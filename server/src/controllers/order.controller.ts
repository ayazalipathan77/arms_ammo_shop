import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';
import {
    createOrderSchema,
    updateOrderStatusSchema,
    orderQuerySchema,
} from '../validators/order.validator';
import { Prisma } from '@prisma/client';

// Currency conversion rates (PKR base)
const CURRENCY_RATES: Record<string, number> = {
    PKR: 1,
    USD: 0.0036,
    GBP: 0.0028,
};

// Create new order
export const createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const validatedData = createOrderSchema.parse(req.body);

        // Fetch user details
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, fullName: true, email: true },
        });

        if (!user) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
            return;
        }

        // Validate all artworks exist and are in stock
        const artworkIds = validatedData.items.map(item => item.artworkId);
        const artworks = await prisma.artwork.findMany({
            where: { id: { in: artworkIds } },
        });

        if (artworks.length !== artworkIds.length) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'One or more artworks not found' });
            return;
        }

        // Check stock for original purchases
        for (const item of validatedData.items) {
            if (item.type === 'ORIGINAL') {
                const artwork = artworks.find(a => a.id === item.artworkId);
                if (artwork && !artwork.inStock) {
                    res.status(StatusCodes.BAD_REQUEST).json({
                        message: `"${artwork.title}" is out of stock`,
                    });
                    return;
                }
            }
        }

        // Calculate total amount in PKR
        let totalAmountPKR = 0;
        const orderItemsData: {
            artworkId: string;
            quantity: number;
            priceAtPurchase: Prisma.Decimal;
            type: 'ORIGINAL' | 'PRINT';
            printSize: string | null;
        }[] = [];

        for (const item of validatedData.items) {
            const artwork = artworks.find(a => a.id === item.artworkId)!;
            const priceAtPurchase = Number(artwork.price);
            totalAmountPKR += priceAtPurchase * item.quantity;

            orderItemsData.push({
                artworkId: item.artworkId,
                quantity: item.quantity,
                priceAtPurchase: new Prisma.Decimal(priceAtPurchase),
                type: item.type,
                printSize: item.printSize || null,
            });
        }

        // Build shipping address string
        const shippingAddress = `${validatedData.shippingAddress}, ${validatedData.shippingCity}, ${validatedData.shippingCountry}`;

        // Create order with items in a transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create the order
            const newOrder = await tx.order.create({
                data: {
                    userId: req.user!.userId,
                    totalAmount: new Prisma.Decimal(totalAmountPKR),
                    status: 'PENDING',
                    shippingAddress,
                    paymentMethod: validatedData.paymentMethod,
                    items: {
                        create: orderItemsData,
                    },
                },
                include: {
                    items: {
                        include: {
                            artwork: {
                                select: {
                                    id: true,
                                    title: true,
                                    imageUrl: true,
                                    artist: {
                                        include: {
                                            user: {
                                                select: { fullName: true },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            });

            // Update stock for original artworks
            for (const item of validatedData.items) {
                if (item.type === 'ORIGINAL') {
                    await tx.artwork.update({
                        where: { id: item.artworkId },
                        data: { inStock: false },
                    });
                }
            }

            // Clear user's cart
            await tx.cartItem.deleteMany({
                where: { userId: req.user!.userId },
            });

            return newOrder;
        });

        res.status(StatusCodes.CREATED).json({
            message: 'Order created successfully',
            order,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Create order error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to create order',
        });
    }
};

// Get user's orders
export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const query = orderQuerySchema.parse(req.query);
        const skip = (query.page - 1) * query.limit;

        // Build where clause
        const where: Prisma.OrderWhereInput = {
            userId: req.user.userId,
        };

        if (query.status) {
            where.status = query.status;
        }

        const total = await prisma.order.count({ where });

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: {
                    include: {
                        artwork: {
                            select: {
                                id: true,
                                title: true,
                                imageUrl: true,
                                artist: {
                                    include: {
                                        user: {
                                            select: { fullName: true },
                                        },
                                    },
                                },
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
            orders,
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
        console.error('Get user orders error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch orders',
        });
    }
};

// Get single order by ID
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const orderId = req.params.id as string;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        artwork: {
                            select: {
                                id: true,
                                title: true,
                                imageUrl: true,
                                dimensions: true,
                                medium: true,
                                artist: {
                                    include: {
                                        user: {
                                            select: { fullName: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        if (!order) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        // Check if user owns the order or is admin
        if (order.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Access denied' });
            return;
        }

        res.status(StatusCodes.OK).json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch order',
        });
    }
};

// Update order status (Admin only)
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const orderId = req.params.id as string;
        const validatedData = updateOrderStatusSchema.parse(req.body);

        // Check if order exists
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!existingOrder) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        // Update order
        const updateData: Prisma.OrderUpdateInput = {
            status: validatedData.status,
        };

        if (validatedData.trackingNumber) {
            updateData.trackingNumber = validatedData.trackingNumber;
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: {
                items: {
                    include: {
                        artwork: {
                            select: {
                                id: true,
                                title: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
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
            message: 'Order status updated',
            order,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Update order status error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to update order status',
        });
    }
};

// Get all orders (Admin only)
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const query = orderQuerySchema.parse(req.query);
        const skip = (query.page - 1) * query.limit;

        // Build where clause
        const where: Prisma.OrderWhereInput = {};

        if (query.status) {
            where.status = query.status;
        }

        const total = await prisma.order.count({ where });

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: {
                    include: {
                        artwork: {
                            select: {
                                id: true,
                                title: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                [query.sortBy]: query.sortOrder,
            },
            skip,
            take: query.limit,
        });

        // Calculate summary stats
        const stats = await prisma.order.aggregate({
            _sum: {
                totalAmount: true,
            },
            _count: true,
        });

        const pendingCount = await prisma.order.count({ where: { status: 'PENDING' } });
        const paidCount = await prisma.order.count({ where: { status: 'PAID' } });
        const shippedCount = await prisma.order.count({ where: { status: 'SHIPPED' } });

        res.status(StatusCodes.OK).json({
            orders,
            pagination: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(total / query.limit),
            },
            summary: {
                totalOrders: stats._count,
                totalRevenue: stats._sum.totalAmount ? Number(stats._sum.totalAmount) : 0,
                pendingCount,
                paidCount,
                shippedCount,
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
        console.error('Get all orders error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch orders',
        });
    }
};

// Cancel order (User can cancel pending orders)
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const orderId = req.params.id as string;

        // Get order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
            },
        });

        if (!order) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        // Check ownership (user can only cancel their own orders, admin can cancel any)
        if (order.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Access denied' });
            return;
        }

        // Can only cancel pending orders
        if (order.status !== 'PENDING') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Only pending orders can be cancelled',
            });
            return;
        }

        // Cancel order and restore stock
        await prisma.$transaction(async (tx) => {
            // Update order status
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' },
            });

            // Restore stock for original artworks
            for (const item of order.items) {
                if (item.type === 'ORIGINAL') {
                    await tx.artwork.update({
                        where: { id: item.artworkId },
                        data: { inStock: true },
                    });
                }
            }
        });

        res.status(StatusCodes.OK).json({
            message: 'Order cancelled successfully',
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to cancel order',
        });
    }
};
