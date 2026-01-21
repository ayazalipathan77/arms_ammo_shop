import { Router } from 'express';
import {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrders,
    cancelOrder,
} from '../controllers/order.controller';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// All order routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private (Any authenticated user)
 */
router.post('/', createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get current user's orders
 * @access  Private
 */
router.get('/', getUserOrders);

/**
 * @route   GET /api/orders/admin
 * @desc    Get all orders (admin)
 * @access  Private (Admin only)
 */
router.get('/admin', authorizeRole('ADMIN'), getAllOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order by ID
 * @access  Private (Owner or Admin)
 */
router.get('/:id', getOrderById);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin only)
 */
router.put('/:id/status', authorizeRole('ADMIN'), updateOrderStatus);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private (Owner or Admin)
 */
router.put('/:id/cancel', cancelOrder);

export default router;
