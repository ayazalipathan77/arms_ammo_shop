import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { StatusCodes } from 'http-status-codes';
import { env } from './config/env';

// Import Routes
import authRoutes from './routes/auth.routes';
import artworkRoutes from './routes/artwork.routes';
import artistRoutes from './routes/artist.routes';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(helmet());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// CORS Configuration
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/artists', artistRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Route not found' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Internal Server Error',
        error: env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

export default app;
