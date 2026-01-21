
import chalk from 'chalk';
import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';

const SERVER_URL = 'http://localhost:5000/api';

const runTest = async () => {
    console.log(chalk.blue('🚀 Starting Cart Merge Test...'));

    let server: any;
    if (!process.env.NO_SPAWN) {
        console.log(chalk.yellow('   Starting server...'));
        const nodePath = 'C:\\Users\\ayaz.ali\\Downloads\\node-v24.13.0-win-x64\\node-v24.13.0-win-x64\\node.exe';
        server = spawn(nodePath, ['-r', 'ts-node/register', 'src/server.ts'], {
            cwd: path.join(__dirname, '../'),
            env: { ...process.env, PORT: '5000', TS_NODE_TRANSPILE_ONLY: 'true' }
        });

        server.stdout.on('data', (data: any) => console.log(`[Server]: ${data}`));
        server.stderr.on('data', (data: any) => console.error(`[Server Error]: ${data}`));

        // Wait for server
        console.log('Waiting for server...');
        await new Promise(resolve => setTimeout(resolve, 8000));
    }

    try {
        // 1. Register/Login User
        console.log(chalk.yellow('1. Creating Test User...'));
        const email = `testuser_${Date.now()}@example.com`;
        const password = 'password123';

        let token = '';
        try {
            const regRes = await axios.post(`${SERVER_URL}/auth/register`, {
                email,
                password,
                fullName: 'Cart Test User',
                role: 'USER'
            });
            token = regRes.data.token;
        } catch (e: any) {
            console.log('User might already exist, attempting login...');
            try {
                const loginRes = await axios.post(`${SERVER_URL}/auth/login`, {
                    email,
                    password
                });
                token = loginRes.data.token;
            } catch (loginError: any) {
                console.error('Login failed after reg fail:', loginError.message);
                if (loginError.response) console.error(loginError.response.data);
                throw loginError;
            }
        }
        console.log(chalk.green('✅ User authenticated'));

        // 2. Clear existing cart
        console.log(chalk.yellow('2. Clearing existing cart...'));
        await axios.delete(`${SERVER_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // 3. Create dummy artwork (Need an artwork ID to add to cart)
        // For simplicity, we assume one exists or we need to find one.
        // Let's try to fetch artworks first.
        const artworksRes = await axios.get(`${SERVER_URL}/artworks`);
        if (artworksRes.data.artworks.length === 0) {
            throw new Error('No artworks found to test with. Seed database first.');
        }
        const artworkId = artworksRes.data.artworks[0].id;
        console.log(chalk.green(`✅ Using artwork ID: ${artworkId}`));

        // 4. Test Login with Guest Cart
        console.log(chalk.yellow('3. Testing Login with Guest Cart...'));
        const guestCart = [
            {
                artworkId: artworkId,
                quantity: 2,
                type: 'ORIGINAL'
            }
        ];

        const loginRes = await axios.post(`${SERVER_URL}/auth/login`, {
            email,
            password,
            guestCart
        });

        if (loginRes.status === 200) {
            console.log(chalk.green('✅ Login with guest cart successful'));
        }

        // 5. Verify Cart has items
        console.log(chalk.yellow('4. Verifying persistent cart...'));
        const cartRes = await axios.get(`${SERVER_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${loginRes.data.token}` }
        });

        const items = cartRes.data.cartItems;
        const targetItem = items.find((i: any) => i.artworkId === artworkId);

        if (targetItem && targetItem.quantity === 2) {
            console.log(chalk.green('✅ Cart merge successful! Item found with correct quantity.'));
        } else {
            console.error(chalk.red('❌ Cart merge failed. Item not found or quantity mismatch.'));
            console.log('Cart Items:', items);
            process.exit(1);
        }

    } catch (error: any) {
        console.error(chalk.red('❌ Test failed:'), error.message);
        if (error.response) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    } finally {
        if (server) server.kill();
        console.log(chalk.blue('🏁 Test complete'));
    }
};

runTest();
