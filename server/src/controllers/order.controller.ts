import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import prisma from '../config/database';
import { env } from '../config/env';
import {
    sendEmail,
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
            include: { artwork: true },
        });

        if (cartItems.length === 0) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Cart is empty' });
            return;
        }

        // Calculate total
        let totalAmount = 0;
        for (const item of cartItems) {
            totalAmount += Number(item.artwork.price) * item.quantity;
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
                            artworkId: item.artworkId,
                            quantity: item.quantity,
                            priceAtPurchase: item.artwork.price,
                            type: item.type,
                            printSize: item.printSize,
                        })),
                    },
                },
                include: {
                    items: {
                        include: { artwork: true },
                    },
                    user: {
                        select: { id: true, fullName: true, email: true },
                    },
                },
            });

            // Mark originals as out of stock
            for (const item of cartItems) {
                if (item.type === 'ORIGINAL') {
                    await tx.artwork.update({
                        where: { id: item.artworkId },
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
                            artwork: {
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

        const [orders, total] = await Promise.all([
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
                            artwork: {
                                include: {
                                    artist: {
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.order.count({ where })
        ]);

        res.status(StatusCodes.OK).json({
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
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
                        artwork: {
                            include: {
                                artist: {
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

// Send artist availability request (Admin action)
export const requestArtistConfirmation = async (req: Request, res: Response): Promise<void> => {
    try {
        const orderId = req.params.id as string;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: {
                    include: {
                        artwork: {
                            include: {
                                artist: {
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
                message: `Cannot request artist confirmation for order with status: ${order.status}`
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
                artistNotifiedAt: new Date(),
                artistConfirmationToken: confirmationToken,
                artistConfirmationExpiry: tokenExpiry,
            }
        });

        // Send email to each unique artist
        const artistsSent = new Set<string>();

        for (const item of order.items) {
            const artist = item.artwork.artist;
            if (artist && artist.user && !artistsSent.has(artist.userId)) {
                artistsSent.add(artist.userId);

                const confirmUrl = `${env.CLIENT_URL}/api/orders/artist-confirm?token=${confirmationToken}&action=confirm`;
                const declineUrl = `${env.CLIENT_URL}/api/orders/artist-confirm?token=${confirmationToken}&action=decline`;

                const emailContent = getArtistAvailabilityRequestTemplate(
                    artist.user.fullName,
                    item.artwork.title,
                    item.artwork.imageUrl,
                    order.id,
                    confirmUrl,
                    declineUrl
                );

                await sendEmail(
                    artist.user.email,
                    `Artwork Sold: ${item.artwork.title} - Action Required`,
                    emailContent
                );
            }
        }

        res.status(StatusCodes.OK).json({
            message: 'Artist confirmation request sent successfully',
            artistsNotified: artistsSent.size
        });
    } catch (error) {
        console.error('Request artist confirmation error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to send artist confirmation request' });
    }
};

// Artist confirms/declines availability (Public endpoint with token)
export const artistConfirmAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = typeof req.query.token === 'string' ? req.query.token : undefined;
        const action = typeof req.query.action === 'string' ? req.query.action : undefined;

        if (!token || !action) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing token or action' });
            return;
        }

        const order = await prisma.order.findFirst({
            where: { artistConfirmationToken: token },
            include: {
                user: true,
                items: {
                    include: {
                        artwork: {
                            include: {
                                artist: {
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

        if (order.artistConfirmationExpiry && new Date() > order.artistConfirmationExpiry) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Confirmation link has expired' });
            return;
        }

        if (order.status !== 'AWAITING_CONFIRMATION') {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Order is no longer awaiting confirmation' });
            return;
        }

        // Get artist info from order items
        const artistInfo = order.items[0]?.artwork?.artist?.user;
        const artworkTitle = order.items[0]?.artwork?.title || 'Artwork';

        if (action === 'confirm') {
            // Update order status
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    artistConfirmedAt: new Date(),
                    artistConfirmedBy: artistInfo?.id,
                    artistConfirmationToken: null, // Clear token
                }
            });

            // Notify admin
            const adminDashboardUrl = `${env.CLIENT_URL}/admin`;
            const emailContent = getArtistConfirmedNotificationTemplate(
                artistInfo?.fullName || 'Artist',
                artworkTitle,
                order.id,
                adminDashboardUrl
            );

            // Send to admin email
            await sendEmail(
                env.SMTP_USER || 'admin@muraqqa.art',
                `Artist Confirmed: Order #${order.id.slice(-8).toUpperCase()}`,
                emailContent
            );

            // Redirect to success page
            res.redirect(`${env.CLIENT_URL}/artist-confirmation?status=confirmed&order=${order.id.slice(-8)}`);
        } else if (action === 'decline') {
            // Update order status to cancelled
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancellationReason: 'Artwork not available - Artist declined',
                    artistConfirmationToken: null,
                }
            });

            // Notify collector
            const cancellationEmail = getOrderCancellationTemplate(
                order as any,
                'The artwork is currently not available. We apologize for the inconvenience.'
            );
            await sendEmail(
                order.user.email,
                `Order Cancelled: #${order.id.slice(-8).toUpperCase()}`,
                cancellationEmail
            );

            // Redirect to decline confirmation page
            res.redirect(`${env.CLIENT_URL}/artist-confirmation?status=declined&order=${order.id.slice(-8)}`);
        } else {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Artist confirm availability error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to process confirmation' });
    }
};

// Admin confirms order (after artist confirmation)
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
                        artwork: {
                            include: {
                                artist: {
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

        // Allow confirmation from AWAITING_CONFIRMATION (if artist confirmed) or PAID status
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
        await sendEmail(
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
        const orderId = req.params.id;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                items: {
                    include: {
                        artwork: {
                            include: {
                                artist: { include: { user: { select: { fullName: true } } } }
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
        await sendEmail(
            order.user.email,
            'Payment Confirmed - Muraqqa Art Gallery',
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
                        artwork: {
                            include: {
                                artist: {
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
        await sendEmail(
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
                        artwork: {
                            include: {
                                artist: {
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
        await sendEmail(
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
                        artwork: true
                    }
                }
            }
        });

        if (!order) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: `Cannot cancel order with status: ${order.status}`
            });
            return;
        }

        // Restore artwork stock if it was marked as sold
        // Always try to restore stock for originals upon cancellation
        for (const item of order.items) {
            if (item.type === 'ORIGINAL') {
                await prisma.artwork.update({
                    where: { id: item.artworkId },
                    data: { inStock: true }
                });
            }
        }

        // Update order status
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancellationReason: reason,
                artistConfirmationToken: null,
            }
        });

        // Send cancellation email to collector
        const emailContent = getOrderCancellationTemplate(order as any, reason);
        await sendEmail(
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
                        artwork: {
                            include: {
                                artist: {
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
        await sendEmail(
            order.user.email,
            `Order Confirmation: #${order.id.slice(-8).toUpperCase()}`,
            collectorEmail
        );

        // 2. Send copy to admin with action button
        const requestArtistUrl = `${env.CLIENT_URL}/admin?action=request-artist&order=${order.id}`;
        const adminEmail = getAdminOrderCopyTemplate(order as any, requestArtistUrl);
        await sendEmail(
            env.SMTP_USER || 'admin@muraqqa.art',
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
