import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';
import {
    updateManufacturerProfileSchema,
    manufacturerQuerySchema,
} from '../validators/manufacturer.validator';
import { Prisma } from '@prisma/client';

// Get all manufacturers with filtering and pagination
export const getManufacturers = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = manufacturerQuerySchema.parse(req.query);

        // Build where clause
        const where: Prisma.ManufacturerWhereInput = {};

        if (query.countryOfOrigin) {
            where.countryOfOrigin = { contains: query.countryOfOrigin, mode: 'insensitive' };
        }

        if (query.search) {
            where.user = {
                fullName: { contains: query.search, mode: 'insensitive' },
            };
        }

        const skip = (query.page - 1) * query.limit;

        const total = await prisma.manufacturer.count({ where });

        const manufacturers = await prisma.manufacturer.findMany({
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
                        products: true,
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
            manufacturers,
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
        console.error('Get manufacturers error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch manufacturers',
        });
    }
};

// Get single manufacturer by ID
export const getManufacturerById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const manufacturer = await prisma.manufacturer.findUnique({
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
                products: {
                    where: { inStock: true },
                    orderBy: { createdAt: 'desc' },
                    take: 6,
                },
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        });

        if (!manufacturer) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Manufacturer not found' });
            return;
        }

        res.status(StatusCodes.OK).json({ manufacturer });
    } catch (error) {
        console.error('Get manufacturer error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch manufacturer',
        });
    }
};

// Get manufacturer by user ID
export const getManufacturerByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId as string;

        const manufacturer = await prisma.manufacturer.findUnique({
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
                products: {
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        });

        if (!manufacturer) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Manufacturer not found' });
            return;
        }

        res.status(StatusCodes.OK).json({ manufacturer });
    } catch (error) {
        console.error('Get manufacturer by user ID error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch manufacturer',
        });
    }
};

// Update manufacturer profile (Manufacturer only - own profile)
export const updateManufacturerProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const id = req.params.id as string;
        const validatedData = updateManufacturerProfileSchema.parse(req.body);

        // Get manufacturer and verify ownership
        const existingManufacturer = await prisma.manufacturer.findUnique({
            where: { id },
        });

        if (!existingManufacturer) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Manufacturer not found' });
            return;
        }

        // Check if user is the manufacturer owner or admin
        if (existingManufacturer.userId !== req.user.userId && req.user.role !== 'ADMIN') {
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

        const manufacturer = await prisma.manufacturer.update({
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
            manufacturer,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Update manufacturer profile error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to update profile',
        });
    }
};

// Get manufacturer stats (for manufacturer dashboard)
export const getManufacturerStats = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const id = req.params.id as string;

        // Get manufacturer and verify ownership
        const manufacturer = await prisma.manufacturer.findUnique({
            where: { id },
        });

        if (!manufacturer) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Manufacturer not found' });
            return;
        }

        // Check if user is the manufacturer owner or admin
        if (manufacturer.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({
                message: 'You can only view your own stats',
            });
            return;
        }

        // Get product count and total price sum
        const totalProducts = await prisma.product.count({
            where: { manufacturerId: id },
        });

        const priceSum = await prisma.product.aggregate({
            where: { manufacturerId: id },
            _sum: {
                price: true,
            },
        });

        // Get products in stock vs sold
        const inStockCount = await prisma.product.count({
            where: { manufacturerId: id, inStock: true },
        });

        const soldCount = await prisma.product.count({
            where: { manufacturerId: id, inStock: false },
        });

        // Get total sales from orders
        const sales = await prisma.orderItem.findMany({
            where: {
                product: { manufacturerId: id },
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
                product: { manufacturerId: id },
            },
            include: {
                product: {
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
                totalProducts,
                inStockCount,
                soldCount,
                totalRevenue,
                totalSales,
                averagePrice: totalProducts > 0 ? totalPriceValue / totalProducts : 0,
            },
            recentOrders,
        });
    } catch (error) {
        console.error('Get manufacturer stats error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch stats',
        });
    }
};

// Get my manufacturer profile (for logged in manufacturer)
export const getMyManufacturerProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const manufacturer = await prisma.manufacturer.findUnique({
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
                products: {
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        });

        if (!manufacturer) {
            res.status(StatusCodes.NOT_FOUND).json({
                message: 'Manufacturer profile not found. You may not have a manufacturer account.'
            });
            return;
        }

        res.status(StatusCodes.OK).json({ manufacturer });
    } catch (error) {
        console.error('Get my manufacturer profile error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch profile',
        });
    }
};
