import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';
import {
    updateArtistProfileSchema,
    artistQuerySchema,
} from '../validators/artist.validator';
import { Prisma } from '@prisma/client';

// Get all artists with filtering and pagination
export const getArtists = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = artistQuerySchema.parse(req.query);

        // Build where clause
        const where: Prisma.ArtistWhereInput = {};

        if (query.originCity) {
            where.originCity = { contains: query.originCity, mode: 'insensitive' };
        }

        if (query.search) {
            where.user = {
                fullName: { contains: query.search, mode: 'insensitive' },
            };
        }

        const skip = (query.page - 1) * query.limit;

        const total = await prisma.artist.count({ where });

        const artists = await prisma.artist.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        artworks: true,
                    },
                },
            },
            orderBy: query.sortBy === 'fullName'
                ? { user: { fullName: query.sortOrder } }
                : { [query.sortBy]: query.sortOrder },
            skip,
            take: query.limit,
        });

        res.status(StatusCodes.OK).json({
            artists,
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
        console.error('Get artists error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch artists',
        });
    }
};

// Get single artist by ID
export const getArtistById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const artist = await prisma.artist.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        createdAt: true,
                    },
                },
                artworks: {
                    where: { inStock: true },
                    orderBy: { createdAt: 'desc' },
                    take: 6,
                },
                _count: {
                    select: {
                        artworks: true,
                    },
                },
            },
        });

        if (!artist) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Artist not found' });
            return;
        }

        res.status(StatusCodes.OK).json({ artist });
    } catch (error) {
        console.error('Get artist error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch artist',
        });
    }
};

// Get artist by user ID
export const getArtistByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId as string;

        const artist = await prisma.artist.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        createdAt: true,
                    },
                },
                artworks: {
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        artworks: true,
                    },
                },
            },
        });

        if (!artist) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Artist not found' });
            return;
        }

        res.status(StatusCodes.OK).json({ artist });
    } catch (error) {
        console.error('Get artist by user ID error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch artist',
        });
    }
};

// Update artist profile (Artist only - own profile)
export const updateArtistProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const id = req.params.id as string;
        const validatedData = updateArtistProfileSchema.parse(req.body);

        // Get artist and verify ownership
        const existingArtist = await prisma.artist.findUnique({
            where: { id },
        });

        if (!existingArtist) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Artist not found' });
            return;
        }

        // Check if user is the artist owner or admin
        if (existingArtist.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({
                message: 'You can only update your own profile',
            });
            return;
        }

        // Handle empty portfolioUrl
        const updateData = {
            ...validatedData,
            portfolioUrl: validatedData.portfolioUrl === '' ? null : validatedData.portfolioUrl,
        };

        const artist = await prisma.artist.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        res.status(StatusCodes.OK).json({
            message: 'Profile updated successfully',
            artist,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Update artist profile error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to update profile',
        });
    }
};

// Get artist stats (for artist dashboard)
export const getArtistStats = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const id = req.params.id as string;

        // Get artist and verify ownership
        const artist = await prisma.artist.findUnique({
            where: { id },
        });

        if (!artist) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Artist not found' });
            return;
        }

        // Check if user is the artist owner or admin
        if (artist.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({
                message: 'You can only view your own stats',
            });
            return;
        }

        // Get artwork count and total price sum
        const totalArtworks = await prisma.artwork.count({
            where: { artistId: id },
        });

        const priceSum = await prisma.artwork.aggregate({
            where: { artistId: id },
            _sum: {
                price: true,
            },
        });

        // Get artworks in stock vs sold
        const inStockCount = await prisma.artwork.count({
            where: { artistId: id, inStock: true },
        });

        const soldCount = await prisma.artwork.count({
            where: { artistId: id, inStock: false },
        });

        // Get total sales from orders
        const sales = await prisma.orderItem.findMany({
            where: {
                artwork: { artistId: id },
                order: {
                    status: {
                        in: ['PAID', 'SHIPPED', 'DELIVERED'],
                    },
                },
            },
            include: {
                order: true,
            },
        });

        const totalRevenue = sales.reduce(
            (sum, item) => sum + Number(item.priceAtPurchase) * item.quantity,
            0
        );

        const totalSales = sales.length;

        // Get recent orders
        const recentOrders = await prisma.orderItem.findMany({
            where: {
                artwork: { artistId: id },
            },
            include: {
                artwork: {
                    select: {
                        title: true,
                        imageUrl: true,
                    },
                },
                order: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                order: {
                    createdAt: 'desc',
                },
            },
            take: 5,
        });

        const totalPriceValue = priceSum._sum.price ? Number(priceSum._sum.price) : 0;

        res.status(StatusCodes.OK).json({
            stats: {
                totalArtworks,
                inStockCount,
                soldCount,
                totalRevenue,
                totalSales,
                averagePrice: totalArtworks > 0 ? totalPriceValue / totalArtworks : 0,
            },
            recentOrders,
        });
    } catch (error) {
        console.error('Get artist stats error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch stats',
        });
    }
};

// Get my artist profile (for logged in artist)
export const getMyArtistProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const artist = await prisma.artist.findUnique({
            where: { userId: req.user.userId },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phoneNumber: true,
                        createdAt: true,
                    },
                },
                artworks: {
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        artworks: true,
                    },
                },
            },
        });

        if (!artist) {
            res.status(StatusCodes.NOT_FOUND).json({
                message: 'Artist profile not found. You may not have an artist account.'
            });
            return;
        }

        res.status(StatusCodes.OK).json({ artist });
    } catch (error) {
        console.error('Get my artist profile error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch profile',
        });
    }
};
