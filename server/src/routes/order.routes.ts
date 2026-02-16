import { Router } from 'express';
import {
    createOrder,
    getUserOrders,
    getAllOrders,
    getOrderById,
    requestArtistConfirmation,
    artistConfirmAvailability,
    adminConfirmOrder,
    markOrderPaid,
    markOrderShipped,
    markOrderDelivered,
    cancelOrder,
    updateOrderNotes,
} from '../controllers/order.controller';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Public route for artist confirmation (via email link)
router.get('/artist-confirm', artistConfirmAvailability);

// User routes (must be before /:id to avoid conflict)
router.post('/', authenticate, createOrder);
router.get('/my-orders', authenticate, getUserOrders);

// Protected admin routes
router.get('/', authenticate, authorizeRole('ADMIN'), getAllOrders);
// Allow users to view their own orders (ownership checked in controller)
router.get('/:id', authenticate, getOrderById);
router.post('/:id/request-artist-confirmation', authenticate, authorizeRole('ADMIN'), requestArtistConfirmation);
router.put('/:id/pay', authenticate, authorizeRole('ADMIN'), markOrderPaid);
router.put('/:id/confirm', authenticate, authorizeRole('ADMIN'), adminConfirmOrder);
router.put('/:id/ship', authenticate, authorizeRole('ADMIN'), markOrderShipped);
router.put('/:id/deliver', authenticate, authorizeRole('ADMIN'), markOrderDelivered);
router.put('/:id/cancel', authenticate, authorizeRole('ADMIN'), cancelOrder);
router.put('/:id/notes', authenticate, authorizeRole('ADMIN'), updateOrderNotes);

export default router;
