import { Router } from 'express';
import {
    getArtists,
    getArtistById,
    getArtistByUserId,
    updateArtistProfile,
    getArtistStats,
    getMyArtistProfile,
} from '../controllers/artist.controller';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/artists
 * @desc    Get all artists with filtering and pagination
 * @access  Public
 * @query   search, originCity, sortBy, sortOrder, page, limit
 */
router.get('/', getArtists);

/**
 * @route   GET /api/artists/me
 * @desc    Get current logged-in artist's profile
 * @access  Private (Artist only)
 */
router.get('/me', authenticate, authorizeRole('ARTIST', 'ADMIN'), getMyArtistProfile);

/**
 * @route   GET /api/artists/user/:userId
 * @desc    Get artist by user ID
 * @access  Public
 */
router.get('/user/:userId', getArtistByUserId);

/**
 * @route   GET /api/artists/:id
 * @desc    Get single artist by ID
 * @access  Public
 */
router.get('/:id', getArtistById);

/**
 * @route   PUT /api/artists/:id
 * @desc    Update artist profile
 * @access  Private (Artist owner or Admin)
 */
router.put('/:id', authenticate, authorizeRole('ARTIST', 'ADMIN'), updateArtistProfile);

/**
 * @route   GET /api/artists/:id/stats
 * @desc    Get artist statistics (sales, views, etc.)
 * @access  Private (Artist owner or Admin)
 */
router.get('/:id/stats', authenticate, authorizeRole('ARTIST', 'ADMIN'), getArtistStats);

export default router;
