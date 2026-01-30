import { Router } from 'express';
import { register, login, getMe, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';
import { verifyRecaptcha, RECAPTCHA_ACTIONS } from '../middleware/recaptcha.middleware';

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

export default router;
