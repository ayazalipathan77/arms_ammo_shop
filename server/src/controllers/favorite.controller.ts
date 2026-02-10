import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';

// Get user's favorites
export const getUserFavorites = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const favorites = await prisma.favorite.findMany({
            where: { userId: req.user.userId },
            include: {
                artwork: {
                    include: {
                        artist: {
                            include: {
                                user: {
                                    select: {
                                        fullName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.status(StatusCodes.OK).json({ favorites });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch favorites',
        });
    }
};

// Add artwork to favorites
export const addToFavorites = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const { artworkId } = req.params;

        // Check if artwork exists
        const artwork = await prisma.artwork.findUnique({
            where: { id: artworkId as string },
        });

        if (!artwork) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Artwork not found' });
            return;
        }

        // Check if already favorited
        const existingFavorite = await prisma.favorite.findUnique({
            where: {
                userId_artworkId: {
                    userId: req.user.userId,
                    artworkId: artworkId as string,
                },
            },
        });

        if (existingFavorite) {
            res.status(StatusCodes.OK).json({
                message: 'Already in favorites',
                favorite: existingFavorite,
            });
            return;
        }

        // Create favorite
        const favorite = await prisma.favorite.create({
            data: {
                userId: req.user.userId,
                artworkId: artworkId as string,
            },
            include: {
                artwork: {
                    include: {
                        artist: {
                            include: {
                                user: {
                                    select: {
                                        fullName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        res.status(StatusCodes.CREATED).json({
            message: 'Added to favorites',
            favorite,
        });
    } catch (error) {
        console.error('Add to favorites error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to add to favorites',
        });
    }
};

// Remove artwork from favorites
export const removeFromFavorites = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const { artworkId } = req.params;

        // Check if favorite exists
        const favorite = await prisma.favorite.findUnique({
            where: {
                userId_artworkId: {
                    userId: req.user.userId,
                    artworkId: artworkId as string,
                },
            },
        });

        if (!favorite) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Not in favorites' });
            return;
        }

        // Delete favorite
        await prisma.favorite.delete({
            where: {
                id: favorite.id,
            },
        });

        res.status(StatusCodes.OK).json({
            message: 'Removed from favorites',
        });
    } catch (error) {
        console.error('Remove from favorites error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to remove from favorites',
        });
    }
};

// Check if artwork is favorited by user
export const checkIsFavorited = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.OK).json({ isFavorited: false });
            return;
        }

        const { artworkId } = req.params;

        const favorite = await prisma.favorite.findUnique({
            where: {
                userId_artworkId: {
                    userId: req.user.userId,
                    artworkId: artworkId as string,
                },
            },
        });

        res.status(StatusCodes.OK).json({
            isFavorited: !!favorite,
        });
    } catch (error) {
        console.error('Check favorite error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to check favorite status',
        });
    }
};

// Get favorites count for user
export const getFavoritesCount = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const count = await prisma.favorite.count({
            where: { userId: req.user.userId },
        });

        res.status(StatusCodes.OK).json({ count });
    } catch (error) {
        console.error('Get favorites count error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to get favorites count',
        });
    }
};
