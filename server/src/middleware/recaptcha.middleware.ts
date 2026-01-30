import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { env } from '../config/env';

interface RecaptchaResponse {
    success: boolean;
    score: number;
    action: string;
    challenge_ts: string;
    hostname: string;
    'error-codes'?: string[];
}

// Minimum score threshold (0.0 - 1.0, higher is more likely human)
const MIN_SCORE = 0.5;

export const verifyRecaptcha = (action: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Skip in development if reCAPTCHA is not configured
        if (env.NODE_ENV === 'development' && !env.RECAPTCHA_SECRET_KEY) {
            console.log('[reCAPTCHA] Skipping verification in development (not configured)');
            return next();
        }

        // Check if reCAPTCHA is configured
        if (!env.RECAPTCHA_SECRET_KEY) {
            console.warn('[reCAPTCHA] Secret key not configured, skipping verification');
            return next();
        }

        const recaptchaToken = req.body.recaptchaToken || req.headers['x-recaptcha-token'];

        if (!recaptchaToken) {
            return res.status(400).json({
                message: 'reCAPTCHA token is required',
                code: 'RECAPTCHA_MISSING'
            });
        }

        try {
            const response = await axios.post<RecaptchaResponse>(
                'https://www.google.com/recaptcha/api/siteverify',
                null,
                {
                    params: {
                        secret: env.RECAPTCHA_SECRET_KEY,
                        response: recaptchaToken,
                        remoteip: req.ip
                    }
                }
            );

            const { success, score, action: responseAction } = response.data;

            // Log for debugging (remove in production or use proper logging)
            console.log(`[reCAPTCHA] Verification result:`, {
                success,
                score,
                action: responseAction,
                expectedAction: action
            });

            if (!success) {
                console.warn('[reCAPTCHA] Verification failed:', response.data['error-codes']);
                return res.status(400).json({
                    message: 'reCAPTCHA verification failed',
                    code: 'RECAPTCHA_FAILED'
                });
            }

            // Check if action matches (prevents token reuse across different forms)
            if (responseAction !== action) {
                console.warn(`[reCAPTCHA] Action mismatch: expected ${action}, got ${responseAction}`);
                return res.status(400).json({
                    message: 'reCAPTCHA action mismatch',
                    code: 'RECAPTCHA_ACTION_MISMATCH'
                });
            }

            // Check score threshold
            if (score < MIN_SCORE) {
                console.warn(`[reCAPTCHA] Score too low: ${score} < ${MIN_SCORE}`);
                return res.status(400).json({
                    message: 'Request appears to be automated. Please try again.',
                    code: 'RECAPTCHA_LOW_SCORE'
                });
            }

            // Attach score to request for potential logging
            (req as any).recaptchaScore = score;

            next();
        } catch (error) {
            console.error('[reCAPTCHA] Verification error:', error);

            // In case of Google API failure, allow request but log it
            // This prevents blocking legitimate users due to external service issues
            if (env.NODE_ENV === 'production') {
                console.error('[reCAPTCHA] Allowing request due to verification service error');
                return next();
            }

            return res.status(500).json({
                message: 'reCAPTCHA verification service error',
                code: 'RECAPTCHA_SERVICE_ERROR'
            });
        }
    };
};

// Export actions as constants for consistency
export const RECAPTCHA_ACTIONS = {
    LOGIN: 'login',
    REGISTER: 'register',
    FORGOT_PASSWORD: 'forgot_password',
    CONTACT: 'contact'
} as const;
