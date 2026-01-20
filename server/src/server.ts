import app from './app';
import { env } from './config/env';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
    console.log(`
  ################################################
  🛡️  Server listening on port: ${PORT} 🛡️
  ################################################
  `);
});

process.on('unhandledRejection', (reason: Error) => {
    console.error('Unhandled Rejection at:', reason);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
