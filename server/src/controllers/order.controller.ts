import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import prisma from '../config/database';
import { env } from '../config/env';
import {
    sendEmailAsync,
    getOrderConfirmationTemplate,
    getAdminOrderCopyTemplate,
    getArtistAvailabilityRequestTemplate,
    getArtistConfirmedNotificationTemplate,
    getOrderConfirmedTemplate,
    getShippingUpdateTemplate,
    getDeliveryConfirmationTemplate,
    getOrderCancellationTemplate
} from '../utils/email';

// Helper to generate confirmation token
const generateConfirmationToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

// Create order from cart (User)
export const createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication required' });
            return;
        }

        const { shippingAddress, paymentMethod } = req.body;

        if (!shippingAddress) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Shipping address is required' });
            return;
        }

        // Get cart items
        const cartItems = await prisma.cartItem.findMany({
            where: { userId },
            include: { product: true },
        });

        if (cartItems.length === 0) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Cart is empty' });
            return;
        }

        // Calculate total
        let totalAmount = 0;
        for (const item of cartItems) {
            totalAmount += Number(item.product.price) * item.quantity;
        }

        // Create order transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create order with items
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    totalAmount,
                    shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
                    paymentMethod: paymentMethod || 'STRIPE',
                    items: {
                        create: cartItems.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            priceAtPurchase: item.product.price,
                            type: item.type,
                        })),
                    },
                },
                include: {
                    items: {
                        include: { product: true },
                    },
                    user: {
                        select: { id: true, fullName: true, email: true },
                    },
                },
            });

            // Mark originals as out of stock
            for (const item of cartItems) {
                // Determine if stock needs adjustment. Assuming we just do it for now as per previous logic.
                // Previous logic checked for 'ORIGINAL'. Now we might check for tracked inventory.
                // Assuming all products have limited stock for now if inStock flag is used.
                // Or check product type.
                // For simplicity, sticking to logic: if cart item effectively reduces stock.
                // If we want to mimic previous behavior:
                if (item.type === 'ORIGINAL' || item.product.type === 'FIREARM') { // Validating against PurchaseType ORIGINAL if set, or Product Type
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { inStock: false }
                    });
                }
            }

            // Clear cart after order creation
            await tx.cartItem.deleteMany({ where: { userId } });

            return newOrder;
        });

        res.status(StatusCodes.CREATED).json({ order });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create order' });
    }
};

// Get user's own orders
export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication required' });
            return;
        }

        const page = typeof req.query.page === 'string' ? req.query.page : '1';
        const limit = typeof req.query.limit === 'string' ? req.query.limit : '20';
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { userId },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    title: true,
                                    imageUrl: true,
                                    price: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.order.count({ where: { userId } }),
        ]);

        res.status(StatusCodes.OK).json({
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch orders' });
    }
};

// Get all orders (Admin)
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const page = typeof req.query.page === 'string' ? req.query.page : '1';
        const limit = typeof req.query.limit === 'string' ? req.query.limit : '20';
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where: any = {};

        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { user: { fullName: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'createdAt';
        const sortOrder = typeof req.query.sortOrder === 'string' ? req.query.sortOrder : 'desc';

        const orderByClause: any = {};
        if (['createdAt', 'totalAmount', 'status'].includes(sortBy)) {
            orderByClause[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
        } else {
            orderByClause.createdAt = 'desc';
        }

        const [orders, total, ...statusCounts] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phoneNumber: true,
                        }
                    },
                    items: {
                        include: {
                            product: {
                                include: {
                                    manufacturer: {
                                        include: {
                                            user: {
                                                select: {
                                                    id: true,
                                                    fullName: true,
                                                    email: true,
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: orderByClause,
                skip,
                take: parseInt(limit),
            }),
            prisma.order.count({ where }),
            prisma.order.count(),
            prisma.order.count({ where: { status: 'PENDING' } }),
            prisma.order.count({ where: { status: 'PAID' } }),
            prisma.order.count({ where: { status: 'AWAITING_CONFIRMATION' } }),
            prisma.order.count({ where: { status: 'CONFIRMED' } }),
            prisma.order.count({ where: { status: 'SHIPPED' } }),
            prisma.order.count({ where: { status: 'DELIVERED' } }),
            prisma.order.count({ where: { status: 'CANCELLED' } }),
        ]);

        res.status(StatusCodes.OK).json({
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            },
            counts: {
                ALL: statusCounts[0],
                PENDING: statusCounts[1],
                PAID: statusCounts[2],
                AWAITING_CONFIRMATION: statusCounts[3],
                CONFIRMED: statusCounts[4],
                SHIPPED: statusCounts[5],
                DELIVERED: statusCounts[6],
                CANCELLED: statusCounts[7],
            }
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch orders' });
    }
};

// Get single order details
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
        const orderId = req.params.id as string;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phoneNumber: true,
                    }
                },
                items: {
                    include: {
                        product: {
                            include: {
                                manufacturer: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                fullName: true,
                                                email: true,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        // Check authorization: user must be the order owner or an admin
        if (order.userId !== userId && userRole !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Access denied' });
            return;
        }

        res.status(StatusCodes.OK).json({ order });
    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch order' });
    }
};

// Send manufacturer availability request (Admin action)
export const requestManufacturerConfirmation = async (req: Request, res: Response): Promise<void> => {
    try {
        const orderId = req.params.id as string;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: {
                    include: {
                        product: {
                            include: {
                                manufacturer: {
                                    include: {
                                        user: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        if (order.status !== 'PAID') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: `Cannot request manufacturer confirmation for order with status: ${order.status}`
            });
            return;
        }

        // Generate confirmation token
        const confirmationToken = generateConfirmationToken();
        const tokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

        // Update order status
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'AWAITING_CONFIRMATION',
                manufacturerNotifiedAt: new Date(),
                manufacturerConfirmationToken: confirmationToken,
                manufacturerConfirmationExpiry: tokenExpiry,
            }
        });

        // Send email to each unique manufacturer
        const manufacturersSent = new Set<string>();

        for (const item of order.items) {
            const manufacturer = item.product.manufacturer;
            if (manufacturer && manufacturer.user && !manufacturersSent.has(manufacturer.userId)) {
                manufacturersSent.add(manufacturer.userId);

                const confirmUrl = `${env.CLIENT_URL}/api/orders/manufacturer-confirm?token=${confirmationToken}&action=confirm`;
                const declineUrl = `${env.CLIENT_URL}/api/orders/manufacturer-confirm?token=${confirmationToken}&action=decline`;

                // Using existing template function but renamed locally if imported or just mapped
                const emailContent = getArtistAvailabilityRequestTemplate(
                    manufacturer.user.fullName,
                    item.product.title,
                    item.product.imageUrl,
                    order.id,
                    confirmUrl,
                    declineUrl
                );

                sendEmailAsync(
                    manufacturer.user.email,
                    `Product Sold: ${item.product.title} - Action Required`,
                    emailContent
                );
            }
        }

        res.status(StatusCodes.OK).json({
            message: 'Manufacturer confirmation request sent successfully',
            manufacturersNotified: manufacturersSent.size
        });
    } catch (error) {
        console.error('Request manufacturer confirmation error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to send manufacturer confirmation request' });
    }
};

// Manufacturer confirms/declines availability (Public endpoint with token)
export const manufacturerConfirmAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = typeof req.query.token === 'string' ? req.query.token : undefined;
        const action = typeof req.query.action === 'string' ? req.query.action : undefined;

        if (!token || !action) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing token or action' });
            return;
        }

        const order = await prisma.order.findFirst({
            where: { manufacturerConfirmationToken: token },
            include: {
                user: true,
                items: {
                    include: {
                        product: {
                            include: {
                                manufacturer: {
                                    include: {
                                        user: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid or expired confirmation link' });
            return;
        }

        if (order.manufacturerConfirmationExpiry && new Date() > order.manufacturerConfirmationExpiry) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Confirmation link has expired' });
            return;
        }

        if (order.status !== 'AWAITING_CONFIRMATION') {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Order is no longer awaiting confirmation' });
            return;
        }

        // Get manufacturer info from order items
        const manufacturerInfo = order.items[0]?.product?.manufacturer?.user;
        const productTitle = order.items[0]?.product?.title || 'Product';

        if (action === 'confirm') {
            // Update order status
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    manufacturerConfirmedAt: new Date(),
                    manufacturerConfirmedBy: manufacturerInfo?.id,
                    manufacturerConfirmationToken: null, // Clear token
                }
            });

            // Notify admin
            const adminDashboardUrl = `${env.CLIENT_URL}/admin`;
            const emailContent = getArtistConfirmedNotificationTemplate(
                manufacturerInfo?.fullName || 'Manufacturer',
                productTitle,
                order.id,
                adminDashboardUrl
            );

            // Send to admin email
            sendEmailAsync(
                env.SMTP_USER || 'admin@armsammo.shop',
                `Manufacturer Confirmed: Order #${order.id.slice(-8).toUpperCase()}`,
                emailContent
            );

            // Redirect to success page
            res.redirect(`${env.CLIENT_URL}/manufacturer-confirmation?status=confirmed&order=${order.id.slice(-8)}`);
        } else if (action === 'decline') {
            // Update order status to cancelled
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancellationReason: 'Product not available - Manufacturer declined',
                    manufacturerConfirmationToken: null,
                }
            });

            // Notify collector
            const cancellationEmail = getOrderCancellationTemplate(
                order as any,
                'The product is currently not available. We apologize for the inconvenience.'
            );
            sendEmailAsync(
                order.user.email,
                `Order Cancelled: #${order.id.slice(-8).toUpperCase()}`,
                cancellationEmail
            );

            // Redirect to decline confirmation page
            res.redirect(`${env.CLIENT_URL}/manufacturer-confirmation?status=declined&order=${order.id.slice(-8)}`);
        } else {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Manufacturer confirm availability error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to process confirmation' });
    }
};

// Admin confirms order (after manufacturer confirmation)
export const adminConfirmOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const orderId = req.params.id as string;
        const adminUserId = req.user?.userId;
        const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: {
                    include: {
                        product: {
                            include: {
                                manufacturer: {
                                    include: {
                                        user: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        // Allow confirmation from AWAITING_CONFIRMATION (if manufacturer confirmed) or PAID status
        if (!['AWAITING_CONFIRMATION', 'PAID'].includes(order.status)) {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: `Cannot confirm order with status: ${order.status}`
            });
            return;
        }

        // Update order status
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'CONFIRMED',
                adminConfirmedAt: new Date(),
                adminConfirmedBy: adminUserId,
                adminNotes: notes || order.adminNotes,
            }
        });

        // Send confirmation email to collector
        const emailContent = getOrderConfirmedTemplate(order as any);
        sendEmailAsync(
            order.user.email,
            `Order Confirmed: #${order.id.slice(-8).toUpperCase()}`,
            emailContent
        );

        res.status(StatusCodes.OK).json({
            message: 'Order confirmed successfully',
            order: { id: order.id, status: 'CONFIRMED' }
        });
    } catch (error) {
        console.error('Admin confirm order error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to confirm order' });
    }
};

// Mark order as paid (Admin)
export const markOrderPaid = async (req: Request, res: Response): Promise<void> => {
    try {
        const orderId = req.params.id as string;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: {
                    include: {
                        product: {
                            include: {
                                manufacturer: { include: { user: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        if (order.status !== 'PENDING') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: `Cannot mark order as paid — current status: ${order.status}`
            });
            return;
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: 'PAID', paidAt: new Date() },
        });

        // Send confirmation email to collector
        sendEmailAsync(
            order.user.email,
            'Payment Confirmed - Arms & Ammo Shop',
            getOrderConfirmationTemplate(order as any)
        );

        res.status(StatusCodes.OK).json({
            message: 'Order marked as paid',
            order: { id: updatedOrder.id, status: updatedOrder.status }
        });
    } catch (error) {
        console.error('Mark order paid error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to mark order as paid' });
    }
};

// Mark order as shipped (Admin)
export const markOrderShipped = async (req: Request, res: Response): Promise<void> => {
    try {
        const orderId = req.params.id as string;
        const adminUserId = req.user?.userId;
        const trackingNumber = typeof req.body.trackingNumber === 'string' ? req.body.trackingNumber : '';
        const carrier = typeof req.body.carrier === 'string' ? req.body.carrier : undefined;
        const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;

        if (!trackingNumber) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Tracking number is required' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: {
                    include: {
                        product: {
                            include: {
                                manufacturer: {
                                    include: {
                                        user: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        if (order.status !== 'CONFIRMED') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: `Cannot ship order with status: ${order.status}. Order must be CONFIRMED first.`
            });
            return;
        }

        // Update order status
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'SHIPPED',
                shippedAt: new Date(),
                shippedBy: adminUserId,
                trackingNumber,
                adminNotes: notes ? `${order.adminNotes || ''}\nShipping: ${notes}`.trim() : order.adminNotes,
            }
        });

        // Send shipping update email to collector
        const emailContent = getShippingUpdateTemplate(order as any, trackingNumber, carrier);
        sendEmailAsync(
            order.user.email,
            `Your Order Has Shipped: #${order.id.slice(-8).toUpperCase()}`,
            emailContent
        );

        res.status(StatusCodes.OK).json({
            message: 'Order marked as shipped',
            order: { id: order.id, status: 'SHIPPED', trackingNumber }
        });
    } catch (error) {
        console.error('Mark order shipped error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update order' });
    }
};

// Mark order as delivered (Admin)
export const markOrderDelivered = async (req: Request, res: Response): Promise<void> => {
    try {
        const orderId = req.params.id as string;
        const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: {
                    include: {
                        product: {
                            include: {
                                manufacturer: {
                                    include: {
                                        user: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        if (order.status !== 'SHIPPED') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: `Cannot mark as delivered. Order must be SHIPPED first. Current status: ${order.status}`
            });
            return;
        }

        // Update order status
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'DELIVERED',
                deliveredAt: new Date(),
                adminNotes: notes ? `${order.adminNotes || ''}\nDelivery: ${notes}`.trim() : order.adminNotes,
            }
        });

        // Send delivery confirmation email to collector
        const emailContent = getDeliveryConfirmationTemplate(order as any);
        sendEmailAsync(
            order.user.email,
            `Order Delivered: #${order.id.slice(-8).toUpperCase()}`,
            emailContent
        );

        res.status(StatusCodes.OK).json({
            message: 'Order marked as delivered',
            order: { id: order.id, status: 'DELIVERED' }
        });
    } catch (error) {
        console.error('Mark order delivered error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update order' });
    }
};

// Cancel order (Admin)
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const orderId = req.params.id as string;
        const reason = typeof req.body.reason === 'string' ? req.body.reason : undefined;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!order) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: `Cannot cancel order with status: ${order.status}`
            });
            return;
        }

        // Update order status
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancellationReason: reason,
                manufacturerConfirmationToken: null,
            }
        });

        // Restore stock for items
        for (const item of order.items) {
            // restore stock
            await prisma.product.update({
                where: { id: item.productId },
                data: { inStock: true }
            });
        }

        // Send cancellation email
        const emailContent = getOrderCancellationTemplate(order as any, reason);
        sendEmailAsync(
            order.user.email,
            `Order Cancelled: #${order.id.slice(-8).toUpperCase()}`,
            emailContent
        );

        res.status(StatusCodes.OK).json({
            message: 'Order cancelled successfully',
            order: { id: order.id, status: 'CANCELLED' }
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to cancel order' });
    }
};

// Update order notes (Admin only)
export const updateOrderNotes = async (req: Request, res: Response): Promise<void> => {
    try {
        const orderId = req.params.id as string;
        const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;
        const userRole = req.user?.role;

        // CRITICAL SECURITY FIX: Verify admin role before allowing note updates
        if (userRole !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({
                message: 'Only administrators can update order notes'
            });
            return;
        }

        // Verify order exists before attempting update
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!existingOrder) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: { adminNotes: notes }
        });

        res.status(StatusCodes.OK).json({
            message: 'Order notes updated',
            order: { id: order.id, adminNotes: order.adminNotes }
        });
    } catch (error) {
        console.error('Update order notes error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update order notes' });
    }
};

// Send order confirmation emails (after payment - called from checkout flow)
export const sendOrderConfirmationEmails = async (orderId: string): Promise<void> => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: {
                    include: {
                        product: {
                            include: {
                                manufacturer: {
                                    include: {
                                        user: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            console.error('Order not found for email:', orderId);
            return;
        }

        // 1. Send confirmation to collector
        const collectorEmail = getOrderConfirmationTemplate(order as any);
        sendEmailAsync(
            order.user.email,
            `Order Confirmation: #${order.id.slice(-8).toUpperCase()}`,
            collectorEmail
        );

        // 2. Send copy to admin with action button
        const requestManufacturerUrl = `${env.CLIENT_URL}/admin?action=request-manufacturer&order=${order.id}`;
        const adminEmail = getAdminOrderCopyTemplate(order as any, requestManufacturerUrl);
        sendEmailAsync(
            env.SMTP_USER || 'admin@armsammo.shop',
            `New Order Received: #${order.id.slice(-8).toUpperCase()}`,
            adminEmail
        );

        // Update paidAt timestamp
        await prisma.order.update({
            where: { id: orderId },
            data: { paidAt: new Date() }
        });

        console.log(`Order confirmation emails sent for order ${orderId}`);
    } catch (error) {
        console.error('Error sending order confirmation emails:', error);
    }
};
