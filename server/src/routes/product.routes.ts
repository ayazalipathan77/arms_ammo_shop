import { Router } from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByManufacturer,
    getFilters,
} from '../controllers/product.controller';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering, sorting, and pagination
 * @access  Public
 * @query   category, type, minPrice, maxPrice, search, manufacturerId, inStock, sortBy, sortOrder, page, limit
 */
router.get('/', getProducts);

/**
 * @route   GET /api/products/filters
 * @desc    Get available categories and types for filters
 * @access  Public
 */
router.get('/filters', getFilters);

/**
 * @route   GET /api/products/manufacturer/:manufacturerId
 * @desc    Get all products by a specific manufacturer
 * @access  Public
 */
router.get('/manufacturer/:manufacturerId', getProductsByManufacturer);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id', getProductById);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (Manufacturer only)
 */
router.post('/', authenticate, authorizeRole('MANUFACTURER', 'ADMIN'), createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Manufacturer owner or Admin)
 */
router.put('/:id', authenticate, authorizeRole('MANUFACTURER', 'ADMIN'), updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (Manufacturer owner or Admin)
 */
router.delete('/:id', authenticate, authorizeRole('MANUFACTURER', 'ADMIN'), deleteProduct);

export default router;
