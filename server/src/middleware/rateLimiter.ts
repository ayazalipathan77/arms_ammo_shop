import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// Environment-aware rate limit values
// More lenient for testing, stricter for production
const isTestingPhase = env.NODE_ENV === 'development' || process.env.TESTING_PHASE === 'true';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isTestingPhase ? 500 : 100, // Testing: 500 req/15min, Production: 100 req/15min
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
    skip: (req) => env.NODE_ENV === 'development', // Skip entirely in local dev
});

// Stricter limiter for Auth routes (Login/Register)
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isTestingPhase ? 100 : 10, // Testing: 100 attempts/hour, Production: 10 attempts/hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many login attempts from this IP, please try again after an hour',
    },
    skip: (req) => env.NODE_ENV === 'development', // Skip entirely in local dev
});
