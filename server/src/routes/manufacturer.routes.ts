import { Router } from 'express';
import {
    getManufacturers,
    getManufacturerById,
    getManufacturerByUserId,
    updateManufacturerProfile,
    getManufacturerStats,
    getMyManufacturerProfile,
} from '../controllers/manufacturer.controller';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/manufacturers
 * @desc    Get all manufacturers with filtering and pagination
 * @access  Public
 * @query   search, countryOfOrigin, sortBy, sortOrder, page, limit
 */
router.get('/', getManufacturers);

/**
 * @route   GET /api/manufacturers/me
 * @desc    Get current logged-in manufacturer's profile
 * @access  Private (Manufacturer only)
 */
router.get('/me', authenticate, authorizeRole('MANUFACTURER', 'ADMIN'), getMyManufacturerProfile);

/**
 * @route   GET /api/manufacturers/user/:userId
 * @desc    Get manufacturer by user ID
 * @access  Public
 */
router.get('/user/:userId', getManufacturerByUserId);

/**
 * @route   GET /api/manufacturers/:id
 * @desc    Get single manufacturer by ID
 * @access  Public
 */
router.get('/:id', getManufacturerById);

/**
 * @route   PUT /api/manufacturers/:id
 * @desc    Update manufacturer profile
 * @access  Private (Manufacturer owner or Admin)
 */
router.put('/:id', authenticate, authorizeRole('MANUFACTURER', 'ADMIN'), updateManufacturerProfile);

/**
 * @route   GET /api/manufacturers/:id/stats
 * @desc    Get manufacturer statistics (sales, views, etc.)
 * @access  Private (Manufacturer owner or Admin)
 */
router.get('/:id/stats', authenticate, authorizeRole('MANUFACTURER', 'ADMIN'), getManufacturerStats);

export default router;
