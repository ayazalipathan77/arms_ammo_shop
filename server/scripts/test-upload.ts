
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { spawn } from 'child_process';

const SERVER_URL = 'http://localhost:5000/api';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.png');

// Create a dummy image if it doesn't exist
if (!fs.existsSync(TEST_IMAGE_PATH)) {
    // 1x1 transparent PNG
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    fs.writeFileSync(TEST_IMAGE_PATH, buffer);
}

const runTest = async () => {
    console.log(chalk.blue('🚀 Starting Upload Verification Test...'));

    // 1. Login to get token
    console.log(chalk.yellow('1. Authenticating as Artist...'));
    let token = '';

    // Start server process
    let server: any;
    if (!process.env.NO_SPAWN) {
        const nodePath = 'C:\\Users\\ayaz.ali\\Downloads\\node-v24.13.0-win-x64\\node-v24.13.0-win-x64\\node.exe';
        console.log(chalk.yellow('   Starting server with ts-node...'));
        server = spawn(nodePath, ['-r', 'ts-node/register', 'src/server.ts'], {
            cwd: path.join(__dirname, '../'),
            env: { ...process.env, PORT: '5000', TS_NODE_TRANSPILE_ONLY: 'true' }
        });

        server.stdout.on('data', (data: any) => console.log(`[Server]: ${data}`));
        server.stderr.on('data', (data: any) => console.error(`[Server Error]: ${data}`));

        server.on('error', (err: any) => {
            console.error(chalk.red('Failed to start server process:'), err);
        });

        // Give server time to start
        console.log('Waiting for server to start...');
        await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
        console.log(chalk.yellow('   Skipping server spawn (NO_SPAWN set)...'));
    }

    try {
        // Register/Login temp user
        console.log('Attempting login...');
        try {
            const loginRes = await axios.post(`${SERVER_URL}/auth/login`, {
                email: 'artist@test.com',
                password: 'password123'
            });
            token = loginRes.data.token;
        } catch (e) {
            // If login fails, try register
            const regRes = await axios.post(`${SERVER_URL}/auth/register`, {
                email: 'artist@test.com',
                password: 'password123',
                fullName: 'Test Artist',
                role: 'ARTIST',
                phoneNumber: '1234567890'
            });
            token = regRes.data.token;
        }
        console.log(chalk.green('✅ Authentication successful'));

        // 2. Upload Image
        console.log(chalk.yellow('2. Uploading Image...'));
        const form = new FormData();
        form.append('image', fs.createReadStream(TEST_IMAGE_PATH));

        const uploadRes = await axios.post(`${SERVER_URL}/upload`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        if (uploadRes.status === 200 && uploadRes.data.url) {
            console.log(chalk.green(`✅ Upload successful! URL: ${uploadRes.data.url}`));
        } else {
            console.error(chalk.red('❌ Upload failed response format invalid'));
            process.exit(1);
        }

    } catch (error: any) {
        console.error(chalk.red('❌ Test failed:'), error.message);
        if (error.code) console.error('Error code:', error.code);
        if (error.cause) console.error('Error cause:', error.cause);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Full error:', error);
        }
        process.exit(1);
    } finally {
        if (server) server.kill();
        // clean up
        if (fs.existsSync(TEST_IMAGE_PATH)) fs.unlinkSync(TEST_IMAGE_PATH);
        console.log(chalk.blue('🏁 Test complete'));
    }
};

runTest();
