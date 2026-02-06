const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Server...');
console.log('📝 Note: Database migrations and seeding are handled in the build phase');

try {
    // Start Backend Server
    // Migrations and seeding already ran during the build command
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

    server.on('error', (error) => {
        console.error('❌ Server Error:', error);
        process.exit(1);
    });

} catch (error) {
    console.error('❌ Server Start Failed:', error);
    process.exit(1);
}
