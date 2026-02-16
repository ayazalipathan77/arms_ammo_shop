import { Router } from 'express';
import passport from 'passport';
import { register, login, getMe, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail } from '../controllers/auth.controller';
import { googleCallback, facebookCallback, getSocialAuthToken } from '../controllers/social-auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';
import { verifyRecaptcha, RECAPTCHA_ACTIONS } from '../middleware/recaptcha.middleware';
import { env } from '../config/env';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @security reCAPTCHA v3
 */
router.post('/register', authLimiter, verifyRecaptcha(RECAPTCHA_ACTIONS.REGISTER), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @security reCAPTCHA v3
 */
router.post('/login', authLimiter, verifyRecaptcha(RECAPTCHA_ACTIONS.LOGIN), login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 * @security reCAPTCHA v3
 */
router.post('/forgot-password', authLimiter, verifyRecaptcha(RECAPTCHA_ACTIONS.FORGOT_PASSWORD), forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authLimiter, resetPassword);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', authLimiter, verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', authLimiter, resendVerificationEmail);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getMe);

// Social Login Routes - Google
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
    router.get(
        '/google/callback',
        passport.authenticate('google', { session: false, failureRedirect: '/auth?error=google_failed' }),
        googleCallback
    );
}

// Social Login Routes - Facebook
if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) {
    router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));
    router.get(
        '/facebook/callback',
        passport.authenticate('facebook', { session: false, failureRedirect: '/auth?error=facebook_failed' }),
        facebookCallback
    );
}

/**
 * @route   GET /api/auth/social-token
 * @desc    Retrieve social auth token from secure cookie
 * @access  Public
 * @security Used after OAuth redirect to retrieve token securely
 */
router.get('/social-token', getSocialAuthToken);

export default router;
