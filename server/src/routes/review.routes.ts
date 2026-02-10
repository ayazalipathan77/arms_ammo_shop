import { Router } from 'express';
import {
    getArtworkReviews,
    createReview,
    updateReview,
    deleteReview,
    voteReview,
    getAllReviewsForModeration,
    approveReview,
    rejectReview,
} from '../controllers/review.controller';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/artwork/:artworkId', getArtworkReviews);

// Authenticated routes
router.post('/', authenticate, createReview);
router.put('/:reviewId', authenticate, updateReview);
router.delete('/:reviewId', authenticate, deleteReview);
router.post('/:reviewId/vote', voteReview); // Public voting

// Admin routes
router.get('/moderation/all', authenticate, authorizeRole('ADMIN'), getAllReviewsForModeration);
router.put('/:reviewId/approve', authenticate, authorizeRole('ADMIN'), approveReview);
router.put('/:reviewId/reject', authenticate, authorizeRole('ADMIN'), rejectReview);

export default router;
