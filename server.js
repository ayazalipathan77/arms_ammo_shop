const { execSync, spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Deployment Process...');

try {
    // 1. Run Prisma Migrations
    console.log('📦 Running Database Migrations...');
    execSync('npx prisma migrate deploy', {
        cwd: path.join(__dirname, 'server'),
        stdio: 'inherit'
    });

    // 2. Seed Database
    console.log('🌱 Seeding Initial Data...');
    try {
        execSync('npm run seed', {
            cwd: path.join(__dirname, 'server'),
            stdio: 'inherit'
        });
    } catch (seedError) {
        console.warn('⚠️ Seeding failed (might be already seeded):', seedError.message);
    }

    // 3. Start Backend Server
    console.log('⚡ Starting Backend Server...');
    const server = spawn('node', ['dist/server.js'], {
        cwd: path.join(__dirname, 'server'),
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
    });

    server.on('close', (code) => {
        console.log(`Server exited with code ${code}`);
        process.exit(code);
    });

} catch (error) {
    console.error('❌ Deployment Failed:', error);
    process.exit(1);
}
