import { Router } from 'express';
import {
    getUserFavorites,
    addToFavorites,
    removeFromFavorites,
    checkIsFavorited,
    getFavoritesCount,
} from '../controllers/favorite.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's favorites
router.get('/', getUserFavorites);

// Get favorites count
router.get('/count', getFavoritesCount);

// Check if specific artwork is favorited
router.get('/check/:artworkId', checkIsFavorited);

// Add to favorites
router.post('/:artworkId', addToFavorites);

// Remove from favorites
router.delete('/:artworkId', removeFromFavorites);

export default router;
