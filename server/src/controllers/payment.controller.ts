import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import prisma from '../config/database';
import { env } from '../config/env';
import {
    sendEmail,
    getOrderConfirmationTemplate,
    getAdminOrderCopyTemplate,
} from '../utils/email';
import {
    createPaymentIntentSchema,
    confirmBankTransferSchema,
} from '../validators/payment.validator';

// Initialize Stripe with secret key (use test key for development)
const stripe = env.STRIPE_SECRET_KEY
    ? new Stripe(env.STRIPE_SECRET_KEY)
    : null;

// Currency conversion rates from PKR
const CURRENCY_MULTIPLIERS: Record<string, number> = {
    pkr: 1,
    usd: 0.0036,
    gbp: 0.0028,
};

// Stripe requires amounts in smallest currency unit (cents, paisa, etc.)
const getStripeAmount = (amountPKR: number, currency: string): number => {
    const converted = amountPKR * CURRENCY_MULTIPLIERS[currency.toLowerCase()];
    // For PKR, amount is in paisa (1 PKR = 100 paisa)
    // For USD/GBP, amount is in cents/pence
    return Math.round(converted * 100);
};

// Create a Stripe PaymentIntent for an order
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        if (!stripe) {
            res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                message: 'Payment service not configured. Please use bank transfer.',
            });
            return;
        }

        const validatedData = createPaymentIntentSchema.parse(req.body);

        // Get the order
        const order = await prisma.order.findUnique({
            where: { id: validatedData.orderId },
            include: {
                items: {
                    include: {
                        artwork: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        // Verify order belongs to user
        if (order.userId !== req.user.userId) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Access denied' });
            return;
        }

        // Check order status - only PENDING orders can be paid
        if (order.status !== 'PENDING') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: `Cannot process payment for order with status: ${order.status}`,
            });
            return;
        }

        // Calculate amount in the requested currency
        const amountPKR = Number(order.totalAmount);
        const currency = validatedData.currency;
        const stripeAmount = getStripeAmount(amountPKR, currency);

        // Create the PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: stripeAmount,
            currency: currency,
            metadata: {
                orderId: order.id,
                userId: req.user.userId,
            },
            description: `Muraqqa Art Gallery - Order ${order.id}`,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.status(StatusCodes.OK).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: stripeAmount,
            currency: currency,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Create payment intent error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to create payment intent',
            error: env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Get payment status for an order
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const orderId = req.params.orderId as string;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                status: true,
                paymentMethod: true,
                totalAmount: true,
                createdAt: true,
            },
        });

        if (!order) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        // Verify order belongs to user or user is admin
        if (order.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Access denied' });
            return;
        }

        res.status(StatusCodes.OK).json({
            orderId: order.id,
            status: order.status,
            paymentMethod: order.paymentMethod,
            amount: Number(order.totalAmount),
            isPaid: order.status === 'PAID' || order.status === 'SHIPPED' || order.status === 'DELIVERED',
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to get payment status',
        });
    }
};

// Stripe webhook handler
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
            res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                message: 'Webhook not configured',
            });
            return;
        }

        const sig = req.headers['stripe-signature'] as string;

        let event: Stripe.Event;

        try {
            // Verify the webhook signature
            event = stripe.webhooks.constructEvent(
                req.body, // Raw body needed for signature verification
                sig,
                env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            res.status(StatusCodes.BAD_REQUEST).json({
                message: `Webhook Error: ${err.message}`,
            });
            return;
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const orderId = paymentIntent.metadata.orderId;

                if (orderId) {
                    // Update order status to PAID and fetch full order data
                    const order = await prisma.order.update({
                        where: { id: orderId },
                        data: {
                            status: 'PAID',
                            transactionId: paymentIntent.id,
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true,
                                    phoneNumber: true,
                                },
                            },
                            items: {
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
                            },
                        },
                    });

                    console.log(`Order ${orderId} marked as PAID`);

                    // Send confirmation email to collector
                    const collectorEmailSent = await sendEmail(
                        order.user.email,
                        'Order Confirmation - Muraqqa Art Gallery',
                        getOrderConfirmationTemplate(order as any)
                    );

                    if (collectorEmailSent) {
                        console.log(`✅ Order confirmation email sent to ${order.user.email}`);
                    } else {
                        console.error(`❌ Failed to send confirmation email to ${order.user.email}`);
                    }

                    // Send order copy to admin
                    const requestArtistUrl = `${env.CLIENT_URL}/admin?tab=orders&orderId=${order.id}`;
                    const adminEmailSent = await sendEmail(
                        'admin@muraqqa.art', // Admin email
                        `New Order Received - #${order.id.slice(-8).toUpperCase()}`,
                        getAdminOrderCopyTemplate(order as any, requestArtistUrl)
                    );

                    if (adminEmailSent) {
                        console.log(`✅ Admin notification email sent`);
                    } else {
                        console.error(`❌ Failed to send admin notification email`);
                    }
                }
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const orderId = paymentIntent.metadata.orderId;

                if (orderId) {
                    console.log(`Payment failed for order ${orderId}`);
                    // Optionally mark order or notify user
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.status(StatusCodes.OK).json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Webhook handler failed',
        });
    }
};

// Confirm bank transfer payment (Admin only)
export const confirmBankTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const validatedData = confirmBankTransferSchema.parse(req.body);

        // Get the order
        const order = await prisma.order.findUnique({
            where: { id: validatedData.orderId },
        });

        if (!order) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
            return;
        }

        // Check if order used bank transfer
        if (order.paymentMethod !== 'BANK') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Order did not use bank transfer payment method',
            });
            return;
        }

        // Check order status
        if (order.status !== 'PENDING') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: `Cannot confirm payment for order with status: ${order.status}`,
            });
            return;
        }

        // Update order to PAID with full details for email
        const updatedOrder = await prisma.order.update({
            where: { id: validatedData.orderId },
            data: {
                status: 'PAID',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phoneNumber: true,
                    },
                },
                items: {
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
                },
            },
        });

        // Send confirmation email to collector
        const collectorEmailSent = await sendEmail(
            updatedOrder.user.email,
            'Payment Confirmed - Muraqqa Art Gallery',
            getOrderConfirmationTemplate(updatedOrder as any)
        );

        if (collectorEmailSent) {
            console.log(`✅ Order confirmation email sent to ${updatedOrder.user.email}`);
        }

        // Send order copy to admin
        const requestArtistUrl = `${env.CLIENT_URL}/admin?tab=orders&orderId=${updatedOrder.id}`;
        const adminEmailSent = await sendEmail(
            'admin@muraqqa.art',
            `Payment Confirmed - Order #${updatedOrder.id.slice(-8).toUpperCase()}`,
            getAdminOrderCopyTemplate(updatedOrder as any, requestArtistUrl)
        );

        if (adminEmailSent) {
            console.log(`✅ Admin notification email sent`);
        }

        res.status(StatusCodes.OK).json({
            message: 'Bank transfer confirmed, order marked as PAID. Confirmation emails sent.',
            order: updatedOrder,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Confirm bank transfer error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to confirm bank transfer',
        });
    }
};

// Get Stripe publishable key for frontend
export const getStripeConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!env.STRIPE_PUBLISHABLE_KEY) {
            res.status(StatusCodes.OK).json({
                enabled: false,
                message: 'Stripe is not configured',
            });
            return;
        }

        res.status(StatusCodes.OK).json({
            enabled: true,
            publishableKey: env.STRIPE_PUBLISHABLE_KEY,
        });
    } catch (error) {
        console.error('Get Stripe config error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to get payment configuration',
        });
    }
};
