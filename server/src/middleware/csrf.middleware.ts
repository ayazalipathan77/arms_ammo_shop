import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

/**
 * Generate a cryptographically secure CSRF token
 */
export const generateCsrfToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern
 * 
 * For GET requests: Sets CSRF token cookie
 * For state-changing requests (POST, PUT, DELETE, PATCH): Validates CSRF token
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Skip CSRF protection for GET, HEAD, OPTIONS requests
    // These are safe methods that don't modify state
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        // Set CSRF token cookie for GET requests if not already present
        if (!req.cookies || !req.cookies[CSRF_COOKIE_NAME]) {
            const token = generateCsrfToken();
            res.cookie(CSRF_COOKIE_NAME, token, {
                httpOnly: false, // Must be accessible by JavaScript to read and send back
                secure: isProduction,
                sameSite: isProduction ? 'strict' : 'lax',
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                path: '/'
            });
        }
        return next();
    }

    // In development, skip CSRF validation for cross-origin requests
    // (CORS already provides sufficient protection in dev)
    if (!isProduction) {
        return next();
    }

    // For state-changing requests in production, validate CSRF token
    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME.toLowerCase()];

    // Check if tokens exist and match
    if (!cookieToken || !headerToken) {
        res.status(403).json({
            message: 'CSRF token missing. Please refresh the page and try again.',
            code: 'CSRF_MISSING'
        });
        return;
    }

    if (cookieToken !== headerToken) {
        res.status(403).json({
            message: 'Invalid CSRF token. Please refresh the page and try again.',
            code: 'CSRF_INVALID'
        });
        return;
    }

    // Token is valid, proceed with request
    next();
};

/**
 * Middleware to set CSRF token cookie
 * Use this on authentication endpoints to ensure token is available
 */
export const setCsrfCookie = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.cookies || !req.cookies[CSRF_COOKIE_NAME]) {
        const token = generateCsrfToken();
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });
    }
    next();
};

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
