import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';
import {
    createArtworkSchema,
    updateArtworkSchema,
    artworkQuerySchema,
} from '../validators/artwork.validator';
import { Prisma } from '@prisma/client';

// Get all artworks with filtering, sorting, and pagination
export const getArtworks = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = artworkQuerySchema.parse(req.query);

        // Build where clause
        const where: Prisma.ArtworkWhereInput = {};

        if (query.category) {
            where.category = query.category;
        }

        if (query.medium) {
            where.medium = query.medium;
        }

        if (query.artistId) {
            where.artistId = query.artistId;
        }

        if (query.inStock !== undefined) {
            where.inStock = query.inStock;
        }

        if (query.isAuction !== undefined) {
            where.isAuction = query.isAuction;
        }

        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            where.price = {};
            if (query.minPrice !== undefined) {
                where.price.gte = query.minPrice;
            }
            if (query.maxPrice !== undefined) {
                where.price.lte = query.maxPrice;
            }
        }

        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
                { artist: { user: { fullName: { contains: query.search, mode: 'insensitive' } } } },
            ];
        }

        // Calculate pagination
        const skip = (query.page - 1) * query.limit;

        // Get total count for pagination
        const total = await prisma.artwork.count({ where });

        // Get artworks
        const artworks = await prisma.artwork.findMany({
            where,
            include: {
                artist: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                [query.sortBy]: query.sortOrder,
            },
            skip,
            take: query.limit,
        });

        res.status(StatusCodes.OK).json({
            artworks,
            pagination: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(total / query.limit),
            },
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Get artworks error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch artworks',
        });
    }
};

// Get single artwork by ID
export const getArtworkById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const artwork = await prisma.artwork.findUnique({
            where: { id },
            include: {
                artist: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        if (!artwork) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Artwork not found' });
            return;
        }

        res.status(StatusCodes.OK).json({ artwork });
    } catch (error) {
        console.error('Get artwork error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch artwork',
        });
    }
};

// Create new artwork (Artist only)
export const createArtwork = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const validatedData = createArtworkSchema.parse(req.body);

        // Get artist profile for this user
        const artist = await prisma.artist.findUnique({
            where: { userId: req.user.userId },
        });

        if (!artist) {
            res.status(StatusCodes.FORBIDDEN).json({
                message: 'Artist profile not found. Only artists can create artworks.',
            });
            return;
        }

        const artwork = await prisma.artwork.create({
            data: {
                ...validatedData,
                price: new Prisma.Decimal(validatedData.price),
                artistId: artist.id,
            },
            include: {
                artist: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(StatusCodes.CREATED).json({
            message: 'Artwork created successfully',
            artwork,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Create artwork error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to create artwork',
        });
    }
};

// Update artwork (Artist owner only)
export const updateArtwork = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const id = req.params.id as string;
        const validatedData = updateArtworkSchema.parse(req.body);

        // Get artwork and verify ownership
        const existingArtwork = await prisma.artwork.findUnique({
            where: { id },
            include: {
                artist: true,
            },
        });

        if (!existingArtwork) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Artwork not found' });
            return;
        }

        // Check if user is the artist owner or admin
        if (existingArtwork.artist.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({
                message: 'You can only update your own artworks',
            });
            return;
        }

        // Prepare update data
        const updateData: Prisma.ArtworkUpdateInput = { ...validatedData };
        if (validatedData.price !== undefined) {
            updateData.price = new Prisma.Decimal(validatedData.price);
        }

        const artwork = await prisma.artwork.update({
            where: { id },
            data: updateData,
            include: {
                artist: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(StatusCodes.OK).json({
            message: 'Artwork updated successfully',
            artwork,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Update artwork error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to update artwork',
        });
    }
};

// Delete artwork (Artist owner or Admin only)
export const deleteArtwork = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const id = req.params.id as string;

        // Get artwork and verify ownership
        const existingArtwork = await prisma.artwork.findUnique({
            where: { id },
            include: {
                artist: true,
            },
        });

        if (!existingArtwork) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Artwork not found' });
            return;
        }

        // Check if user is the artist owner or admin
        if (existingArtwork.artist.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({
                message: 'You can only delete your own artworks',
            });
            return;
        }

        await prisma.artwork.delete({
            where: { id },
        });

        res.status(StatusCodes.OK).json({
            message: 'Artwork deleted successfully',
        });
    } catch (error) {
        console.error('Delete artwork error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to delete artwork',
        });
    }
};

// Get artworks by artist
export const getArtworksByArtist = async (req: Request, res: Response): Promise<void> => {
    try {
        const artistId = req.params.artistId as string;
        const query = artworkQuerySchema.parse(req.query);

        // Verify artist exists
        const artist = await prisma.artist.findUnique({
            where: { id: artistId },
        });

        if (!artist) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Artist not found' });
            return;
        }

        const skip = (query.page - 1) * query.limit;

        const total = await prisma.artwork.count({
            where: { artistId },
        });

        const artworks = await prisma.artwork.findMany({
            where: { artistId },
            include: {
                artist: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                [query.sortBy]: query.sortOrder,
            },
            skip,
            take: query.limit,
        });

        res.status(StatusCodes.OK).json({
            artworks,
            pagination: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(total / query.limit),
            },
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Get artworks by artist error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch artworks',
        });
    }
};

// Get categories and mediums for filters
export const getFilters = async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await prisma.artwork.findMany({
            select: { category: true },
            distinct: ['category'],
        });

        const mediums = await prisma.artwork.findMany({
            select: { medium: true },
            distinct: ['medium'],
        });

        res.status(StatusCodes.OK).json({
            categories: categories.map(c => c.category),
            mediums: mediums.map(m => m.medium),
        });
    } catch (error) {
        console.error('Get filters error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch filters',
        });
    }
};
