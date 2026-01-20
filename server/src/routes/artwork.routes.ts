import { Router } from 'express';
import {
    getArtworks,
    getArtworkById,
    createArtwork,
    updateArtwork,
    deleteArtwork,
    getArtworksByArtist,
    getFilters,
} from '../controllers/artwork.controller';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/artworks
 * @desc    Get all artworks with filtering, sorting, and pagination
 * @access  Public
 * @query   category, medium, minPrice, maxPrice, search, artistId, inStock, isAuction, sortBy, sortOrder, page, limit
 */
router.get('/', getArtworks);

/**
 * @route   GET /api/artworks/filters
 * @desc    Get available categories and mediums for filters
 * @access  Public
 */
router.get('/filters', getFilters);

/**
 * @route   GET /api/artworks/artist/:artistId
 * @desc    Get all artworks by a specific artist
 * @access  Public
 */
router.get('/artist/:artistId', getArtworksByArtist);

/**
 * @route   GET /api/artworks/:id
 * @desc    Get single artwork by ID
 * @access  Public
 */
router.get('/:id', getArtworkById);

/**
 * @route   POST /api/artworks
 * @desc    Create new artwork
 * @access  Private (Artist only)
 */
router.post('/', authenticate, authorizeRole('ARTIST', 'ADMIN'), createArtwork);

/**
 * @route   PUT /api/artworks/:id
 * @desc    Update artwork
 * @access  Private (Artist owner or Admin)
 */
router.put('/:id', authenticate, authorizeRole('ARTIST', 'ADMIN'), updateArtwork);

/**
 * @route   DELETE /api/artworks/:id
 * @desc    Delete artwork
 * @access  Private (Artist owner or Admin)
 */
router.delete('/:id', authenticate, authorizeRole('ARTIST', 'ADMIN'), deleteArtwork);

export default router;
