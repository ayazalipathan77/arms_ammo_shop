import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Validation schemas
const createGiftCardSchema = z.object({
    amount: z.number().positive().min(500).max(1000000), // PKR 500 to 1,000,000
    currency: z.string().default('PKR'),
    recipientEmail: z.string().email().optional(),
    recipientName: z.string().optional(),
    message: z.string().max(500).optional(),
});

const redeemGiftCardSchema = z.object({
    code: z.string().min(6),
});

// Generate unique gift card code
const generateGiftCardCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
    let code = 'MRQ-'; // Muraqqa prefix
    for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 4 === 0) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code; // Format: MRQ-XXXX-XXXX-XXXX
};

// Purchase gift card
export const purchaseGiftCard = async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = createGiftCardSchema.parse(req.body);
        const purchasedBy = req.user?.userId || null; // Anonymous purchase allowed

        // Generate unique code
        let code = generateGiftCardCode();
        let existingCard = await prisma.giftCard.findUnique({ where: { code } });

        // Ensure code is unique
        while (existingCard) {
            code = generateGiftCardCode();
            existingCard = await prisma.giftCard.findUnique({ where: { code } });
        }

        // Calculate expiry (1 year from now)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        // Create gift card
        const giftCard = await prisma.giftCard.create({
            data: {
                code,
                amount: new Prisma.Decimal(validatedData.amount),
                currency: validatedData.currency,
                balance: new Prisma.Decimal(validatedData.amount),
                purchasedBy,
                recipientEmail: validatedData.recipientEmail,
                recipientName: validatedData.recipientName,
                message: validatedData.message,
                expiresAt,
            },
        });

        // TODO: Send email to recipient if email provided

        res.status(StatusCodes.CREATED).json({
            message: 'Gift card purchased successfully',
            giftCard: {
                id: giftCard.id,
                code: giftCard.code,
                amount: Number(giftCard.amount),
                currency: giftCard.currency,
                expiresAt: giftCard.expiresAt,
                recipientEmail: giftCard.recipientEmail,
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
        console.error('Purchase gift card error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to purchase gift card',
        });
    }
};

// Get gift card details by code
export const getGiftCardByCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code } = req.params;

        const giftCard = await prisma.giftCard.findUnique({
            where: { code: code as string },
            select: {
                id: true,
                code: true,
                amount: true,
                currency: true,
                balance: true,
                isRedeemed: true,
                redeemedAt: true,
                expiresAt: true,
                recipientName: true,
                message: true,
            },
        });

        if (!giftCard) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Gift card not found' });
            return;
        }

        // Check if expired
        const isExpired = giftCard.expiresAt && new Date() > giftCard.expiresAt;

        res.status(StatusCodes.OK).json({
            giftCard: {
                ...giftCard,
                amount: Number(giftCard.amount),
                balance: Number(giftCard.balance),
                isExpired,
            },
        });
    } catch (error) {
        console.error('Get gift card error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to get gift card',
        });
    }
};

// Redeem/Apply gift card (for checkout)
export const redeemGiftCard = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const validatedData = redeemGiftCardSchema.parse(req.body);

        const giftCard = await prisma.giftCard.findUnique({
            where: { code: validatedData.code },
        });

        if (!giftCard) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Gift card not found' });
            return;
        }

        // Check if already fully redeemed
        if (giftCard.isRedeemed && Number(giftCard.balance) === 0) {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Gift card has already been fully used',
            });
            return;
        }

        // Check if expired
        if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Gift card has expired',
            });
            return;
        }

        // Mark as redeemed by this user
        const updatedGiftCard = await prisma.giftCard.update({
            where: { code: validatedData.code },
            data: {
                redeemedBy: req.user.userId,
                redeemedAt: new Date(),
            },
        });

        res.status(StatusCodes.OK).json({
            message: 'Gift card validated successfully',
            giftCard: {
                code: updatedGiftCard.code,
                balance: Number(updatedGiftCard.balance),
                currency: updatedGiftCard.currency,
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
        console.error('Redeem gift card error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to redeem gift card',
        });
    }
};

// Apply gift card to reduce order total (called during checkout)
export const applyGiftCardToOrder = async (
    giftCardCode: string,
    orderAmount: number
): Promise<{ appliedAmount: number; remainingBalance: number }> => {
    const giftCard = await prisma.giftCard.findUnique({
        where: { code: giftCardCode },
    });

    if (!giftCard) {
        throw new Error('Gift card not found');
    }

    if (giftCard.isRedeemed && Number(giftCard.balance) === 0) {
        throw new Error('Gift card has been fully used');
    }

    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
        throw new Error('Gift card has expired');
    }

    const balance = Number(giftCard.balance);
    const appliedAmount = Math.min(balance, orderAmount);
    const remainingBalance = balance - appliedAmount;

    // Update gift card balance
    await prisma.giftCard.update({
        where: { code: giftCardCode },
        data: {
            balance: new Prisma.Decimal(remainingBalance),
            isRedeemed: remainingBalance === 0,
        },
    });

    return { appliedAmount, remainingBalance };
};

// Get user's purchased gift cards
export const getUserGiftCards = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const giftCards = await prisma.giftCard.findMany({
            where: {
                OR: [
                    { purchasedBy: req.user.userId },
                    { recipientEmail: req.user.email },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(StatusCodes.OK).json({
            giftCards: giftCards.map(gc => ({
                ...gc,
                amount: Number(gc.amount),
                balance: Number(gc.balance),
            })),
        });
    } catch (error) {
        console.error('Get user gift cards error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to get gift cards',
        });
    }
};
