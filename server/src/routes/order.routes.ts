import { Router } from 'express';
import {
    getAllOrders,
    getOrderById,
    requestArtistConfirmation,
    artistConfirmAvailability,
    adminConfirmOrder,
    markOrderShipped,
    markOrderDelivered,
    cancelOrder,
    updateOrderNotes,
} from '../controllers/order.controller';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Public route for artist confirmation (via email link)
router.get('/artist-confirm', artistConfirmAvailability);

// Protected admin routes
router.get('/', authenticate, authorizeRole('ADMIN'), getAllOrders);
router.get('/:id', authenticate, authorizeRole('ADMIN'), getOrderById);
router.post('/:id/request-artist-confirmation', authenticate, authorizeRole('ADMIN'), requestArtistConfirmation);
router.put('/:id/confirm', authenticate, authorizeRole('ADMIN'), adminConfirmOrder);
router.put('/:id/ship', authenticate, authorizeRole('ADMIN'), markOrderShipped);
router.put('/:id/deliver', authenticate, authorizeRole('ADMIN'), markOrderDelivered);
router.put('/:id/cancel', authenticate, authorizeRole('ADMIN'), cancelOrder);
router.put('/:id/notes', authenticate, authorizeRole('ADMIN'), updateOrderNotes);

export default router;
