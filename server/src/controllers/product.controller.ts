import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';
import {
    createProductSchema,
    updateProductSchema,
    productQuerySchema,
} from '../validators/product.validator';
import { Prisma } from '@prisma/client';

// Get all products with filtering, sorting, and pagination
export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = productQuerySchema.parse(req.query);

        // Build where clause
        const where: Prisma.ProductWhereInput = {};

        if (query.category) {
            where.category = query.category;
        }

        if (query.type) {
            where.type = query.type;
        }

        if (query.manufacturerId) {
            where.manufacturerId = query.manufacturerId;
        }

        if (query.inStock !== undefined) {
            where.inStock = query.inStock;
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
                { manufacturer: { user: { fullName: { contains: query.search, mode: 'insensitive' } } } },
                { manufacturerName: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        // Calculate pagination
        const skip = (query.page - 1) * query.limit;

        const [products, total, totalAll, inStockCount, soldOutCount] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    manufacturer: {
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
            }),
            prisma.product.count({ where }),
            prisma.product.count(),
            prisma.product.count({ where: { inStock: true } }),
            prisma.product.count({ where: { inStock: false } }),
        ]);

        res.status(StatusCodes.OK).json({
            products,
            pagination: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(total / query.limit),
            },
            counts: {
                ALL: totalAll,
                IN_STOCK: inStockCount,
                SOLD_OUT: soldOutCount,
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
        console.error('Get products error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch products',
        });
    }
};

// Get single product by ID
export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                manufacturer: {
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

        if (!product) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Product not found' });
            return;
        }

        res.status(StatusCodes.OK).json({ product });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch product',
        });
    }
};

// Create new product (Manufacturer only)
export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const validatedData = createProductSchema.parse(req.body);

        // Get manufacturer profile for this user
        const manufacturer = await prisma.manufacturer.findUnique({
            where: { userId: req.user.userId },
            include: {
                user: {
                    select: {
                        fullName: true,
                    },
                },
            },
        });

        if (!manufacturer && req.user.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({
                message: 'Manufacturer profile not found. Only manufacturers and admins can create products.',
            });
            return;
        }

        // Determine manufacturer name
        const manufacturerName = validatedData.manufacturerName || manufacturer?.user.fullName || 'Unknown Manufacturer';

        const product = await prisma.product.create({
            data: {
                ...validatedData,
                price: new Prisma.Decimal(validatedData.price),
                manufacturerId: manufacturer?.id || null,
                manufacturerName,
            },
            include: {
                manufacturer: {
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
            message: 'Product created successfully',
            product,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Create product error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to create product',
        });
    }
};

// Update product (Manufacturer owner only)
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const id = req.params.id as string;
        const validatedData = updateProductSchema.parse(req.body);

        // Get product and verify ownership
        const existingProduct = await prisma.product.findUnique({
            where: { id },
            include: {
                manufacturer: true,
            },
        });

        if (!existingProduct) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Product not found' });
            return;
        }

        // Check if user is the manufacturer owner or admin
        if (existingProduct.manufacturer?.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({
                message: 'You can only update your own products',
            });
            return;
        }

        const updateData: Prisma.ProductUpdateInput = { ...validatedData };
        if (validatedData.price !== undefined) {
            updateData.price = new Prisma.Decimal(validatedData.price);
        }

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                manufacturer: {
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
            message: 'Product updated successfully',
            product,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Update product error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to update product',
        });
    }
};

// Delete product (Manufacturer owner or Admin only)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const id = req.params.id as string;

        // Get product and verify ownership
        const existingProduct = await prisma.product.findUnique({
            where: { id },
            include: {
                manufacturer: true,
            },
        });

        if (!existingProduct) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Product not found' });
            return;
        }

        // Check if user is the manufacturer owner or admin
        if (existingProduct.manufacturer?.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({
                message: 'You can only delete your own products',
            });
            return;
        }

        await prisma.product.delete({
            where: { id },
        });

        res.status(StatusCodes.OK).json({
            message: 'Product deleted successfully',
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to delete product',
        });
    }
};

// Get products by manufacturer
export const getProductsByManufacturer = async (req: Request, res: Response): Promise<void> => {
    try {
        const manufacturerId = req.params.manufacturerId as string;
        const query = productQuerySchema.parse(req.query);

        // Verify manufacturer exists
        const manufacturer = await prisma.manufacturer.findUnique({
            where: { id: manufacturerId },
        });

        if (!manufacturer) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Manufacturer not found' });
            return;
        }

        const skip = (query.page - 1) * query.limit;

        const total = await prisma.product.count({
            where: { manufacturerId },
        });

        const products = await prisma.product.findMany({
            where: { manufacturerId },
            include: {
                manufacturer: {
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
            products,
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
        console.error('Get products by manufacturer error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch products',
        });
    }
};

// Get categories and types for filters
export const getFilters = async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await prisma.product.findMany({
            select: { category: true },
            distinct: ['category'],
        });

        const types = await prisma.product.findMany({
            select: { type: true },
            distinct: ['type'],
        });

        res.status(StatusCodes.OK).json({
            categories: categories.map(c => c.category),
            types: types.map(t => t.type),
        });
    } catch (error) {
        console.error('Get filters error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch filters',
        });
    }
};
