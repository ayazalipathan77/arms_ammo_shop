import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { StatusCodes } from 'http-status-codes';
import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimiter';

// Initialize passport strategies
import './config/passport';

// Import Routes
import authRoutes from './routes/auth.routes';
import artworkRoutes from './routes/artwork.routes';
import artistRoutes from './routes/artist.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import uploadRoutes from './routes/upload.routes';
import conversationRoutes from './routes/conversation.routes';
import settingRoutes from './routes/setting.routes';
import exhibitionRoutes from './routes/exhibition.routes';
import userRoutes from './routes/user.routes';
import shippingRoutes from './routes/shipping.routes';
import adminRoutes from './routes/admin.routes';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
// Configure Helmet with relaxed CSP for production
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://js.stripe.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https://api.stripe.com"],
            frameSrc: ["'self'", "https://js.stripe.com"],
            fontSrc: ["'self'", "data:"],
        },
    },
}));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(passport.initialize());

// Rate Limiting
app.use('/api', apiLimiter);

// CORS Configuration
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const allowedOrigins = [env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'];
        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:') || origin.endsWith('.onrender.com')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public Config (reCAPTCHA site key, social login providers, etc.)
app.get('/api/config', (req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({
        recaptchaSiteKey: env.RECAPTCHA_SITE_KEY || null,
        recaptchaEnabled: !!env.RECAPTCHA_SECRET_KEY,
        googleEnabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
        facebookEnabled: !!(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET),
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/exhibitions', exhibitionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/admin', adminRoutes);

// Serve static files in production
if (env.NODE_ENV === 'production') {
    const path = require('path');
    // Serve static files from the frontend dist directory
    // Path: server/dist/ -> ../../dist (two levels up from server/dist/)
    app.use(express.static(path.join(__dirname, '../../dist')));

    app.get('*', (req: Request, res: Response) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.resolve(__dirname, '../../dist', 'index.html'));
        } else {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Route not found' });
        }
    });
}

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
