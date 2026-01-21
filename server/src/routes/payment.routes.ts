import { Router, raw } from 'express';
import {
    createPaymentIntent,
    getPaymentStatus,
    handleStripeWebhook,
    confirmBankTransfer,
    getStripeConfig,
} from '../controllers/payment.controller';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/payments/config
 * @desc    Get Stripe publishable key for frontend
 * @access  Public
 */
router.get('/config', getStripeConfig);

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (verified via Stripe signature)
 * @note    Must use raw body parser for signature verification
 */
router.post('/webhook', raw({ type: 'application/json' }), handleStripeWebhook);

// All routes below require authentication
router.use(authenticate);

/**
 * @route   POST /api/payments/create-intent
 * @desc    Create a Stripe PaymentIntent for an order
 * @access  Private
 * @body    { orderId, currency? }
 */
router.post('/create-intent', createPaymentIntent);

/**
 * @route   GET /api/payments/:orderId
 * @desc    Get payment status for an order
 * @access  Private (Owner or Admin)
 */
router.get('/:orderId', getPaymentStatus);

/**
 * @route   POST /api/payments/confirm-bank-transfer
 * @desc    Confirm bank transfer payment (Admin only)
 * @access  Private (Admin)
 * @body    { orderId, transactionReference, notes? }
 */
router.post('/confirm-bank-transfer', authorizeRole('ADMIN'), confirmBankTransfer);

export default router;
