import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';
import { z } from 'zod';

// Validation schemas
const createReviewSchema = z.object({
    artworkId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
    photos: z.array(z.string().url()).optional(),
});

const updateReviewSchema = z.object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().optional(),
    photos: z.array(z.string().url()).optional(),
});

// Get all reviews for an artwork
export const getArtworkReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const { artworkId } = req.params;
        const { approved } = req.query;

        // Build query filter
        const where: any = { artworkId };

        // Only show approved reviews for non-admin users
        if (approved === 'true' || !req.user || req.user.role !== 'ADMIN') {
            where.isApproved = true;
            where.isRejected = false;
        }

        const reviews = await prisma.review.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: [
                { isVerifiedPurchase: 'desc' }, // Verified purchases first
                { createdAt: 'desc' },
            ],
        });

        // Calculate average rating
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        res.status(StatusCodes.OK).json({
            reviews,
            stats: {
                count: reviews.length,
                averageRating: avgRating,
                verifiedCount: reviews.filter(r => r.isVerifiedPurchase).length,
            },
        });
    } catch (error) {
        console.error('Get artwork reviews error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch reviews',
        });
    }
};

// Create a review
export const createReview = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const validatedData = createReviewSchema.parse(req.body);

        // Check if artwork exists
        const artwork = await prisma.artwork.findUnique({
            where: { id: validatedData.artworkId },
        });

        if (!artwork) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Artwork not found' });
            return;
        }

        // Check if user already reviewed this artwork
        const existingReview = await prisma.review.findFirst({
            where: {
                userId: req.user.userId,
                artworkId: validatedData.artworkId,
            },
        });

        if (existingReview) {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'You have already reviewed this artwork',
            });
            return;
        }

        // Check if user purchased this artwork (for verified purchase badge)
        const hasPurchased = await prisma.orderItem.findFirst({
            where: {
                artworkId: validatedData.artworkId,
                order: {
                    userId: req.user.userId,
                    status: {
                        in: ['PAID', 'SHIPPED', 'DELIVERED'],
                    },
                },
            },
        });

        // Create review
        const review = await prisma.review.create({
            data: {
                userId: req.user.userId,
                artworkId: validatedData.artworkId,
                rating: validatedData.rating,
                comment: validatedData.comment,
                photos: validatedData.photos || [],
                isVerifiedPurchase: !!hasPurchased,
                isApproved: false, // Requires admin approval
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        res.status(StatusCodes.CREATED).json({
            message: 'Review submitted successfully. It will be visible after approval.',
            review,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Create review error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to create review',
        });
    }
};

// Update a review
export const updateReview = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const { reviewId } = req.params;
        const validatedData = updateReviewSchema.parse(req.body);

        // Find review
        const review = await prisma.review.findUnique({
            where: { id: reviewId as string },
        });

        if (!review) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Review not found' });
            return;
        }

        // Check ownership
        if (review.userId !== req.user.userId) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Not authorized' });
            return;
        }

        // Update review (reset approval status)
        const updatedReview = await prisma.review.update({
            where: { id: reviewId as string },
            data: {
                ...validatedData,
                isApproved: false, // Requires re-approval after edit
                updatedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        res.status(StatusCodes.OK).json({
            message: 'Review updated successfully',
            review: updatedReview,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Update review error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to update review',
        });
    }
};

// Delete a review
export const deleteReview = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const { reviewId } = req.params;

        // Find review
        const review = await prisma.review.findUnique({
            where: { id: reviewId as string },
        });

        if (!review) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Review not found' });
            return;
        }

        // Check ownership or admin
        if (review.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Not authorized' });
            return;
        }

        // Delete review
        await prisma.review.delete({
            where: { id: reviewId as string },
        });

        res.status(StatusCodes.OK).json({
            message: 'Review deleted successfully',
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to delete review',
        });
    }
};

// Vote review helpful/unhelpful
export const voteReview = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reviewId } = req.params;
        const { helpful } = req.body;

        if (typeof helpful !== 'boolean') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'helpful must be a boolean',
            });
            return;
        }

        const review = await prisma.review.findUnique({
            where: { id: reviewId as string },
        });

        if (!review) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Review not found' });
            return;
        }

        // Update vote count
        const updatedReview = await prisma.review.update({
            where: { id: reviewId as string },
            data: helpful
                ? { helpfulCount: { increment: 1 } }
                : { unhelpfulCount: { increment: 1 } },
        });

        res.status(StatusCodes.OK).json({
            message: 'Vote recorded',
            review: updatedReview,
        });
    } catch (error) {
        console.error('Vote review error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to vote on review',
        });
    }
};

// Admin: Get all reviews for moderation
export const getAllReviewsForModeration = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.query; // pending, approved, rejected

        const where: any = {};
        if (status === 'pending') {
            where.isApproved = false;
            where.isRejected = false;
        } else if (status === 'approved') {
            where.isApproved = true;
        } else if (status === 'rejected') {
            where.isRejected = true;
        }

        const [reviews, pendingCount, approvedCount, rejectedCount] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                    artwork: {
                        select: {
                            id: true,
                            title: true,
                            imageUrl: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.review.count({ where: { isApproved: false, isRejected: false } }),
            prisma.review.count({ where: { isApproved: true } }),
            prisma.review.count({ where: { isRejected: true } }),
        ]);

        res.status(StatusCodes.OK).json({
            reviews,
            counts: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount },
        });
    } catch (error) {
        console.error('Get reviews for moderation error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch reviews',
        });
    }
};

// Admin: Approve a review
export const approveReview = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const { reviewId } = req.params;

        const review = await prisma.review.update({
            where: { id: reviewId as string },
            data: {
                isApproved: true,
                isRejected: false,
                approvedAt: new Date(),
                approvedBy: req.user.userId,
                rejectedAt: null,
                rejectionReason: null,
            },
        });

        res.status(StatusCodes.OK).json({
            message: 'Review approved',
            review,
        });
    } catch (error) {
        console.error('Approve review error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to approve review',
        });
    }
};

// Admin: Reject a review
export const rejectReview = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const { reviewId } = req.params;
        const { reason } = req.body;

        const review = await prisma.review.update({
            where: { id: reviewId as string },
            data: {
                isApproved: false,
                isRejected: true,
                rejectedAt: new Date(),
                rejectionReason: reason || 'Does not meet quality guidelines',
                approvedAt: null,
                approvedBy: null,
            },
        });

        res.status(StatusCodes.OK).json({
            message: 'Review rejected',
            review,
        });
    } catch (error) {
        console.error('Reject review error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to reject review',
        });
    }
};
