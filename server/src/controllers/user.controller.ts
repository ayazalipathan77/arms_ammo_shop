import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { env } from '../config/env';

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                addresses: true,
                artistProfile: true,
            },
        });

        if (!user) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
            return;
        }

        // Remove password hash
        const { passwordHash, ...userProfile } = user;

        res.status(StatusCodes.OK).json({ user: userProfile });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch profile' });
    }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const { fullName, phoneNumber } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: {
                fullName,
                phoneNumber,
            },
            include: {
                addresses: true,
                artistProfile: true,
            },
        });

        // Remove password hash
        const { passwordHash, ...userProfile } = updatedUser;

        res.status(StatusCodes.OK).json({
            message: 'Profile updated successfully',
            user: userProfile,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update profile' });
    }
};

// Add new address
export const addAddress = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const { address, city, country, zipCode, type, isDefault } = req.body;

        // If this is set as default, unset other defaults
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: req.user.userId },
                data: { isDefault: false },
            });
        }

        const newAddress = await prisma.address.create({
            data: {
                userId: req.user.userId,
                address,
                city,
                country,
                zipCode,
                type: type || 'SHIPPING',
                isDefault: isDefault || false,
            },
        });

        res.status(StatusCodes.CREATED).json({
            message: 'Address added successfully',
            address: newAddress,
        });
    } catch (error) {
        console.error('Add address error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to add address' });
    }
};

// Delete address
export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const { id } = req.params;

        // Verify address belongs to user
        const address = await prisma.address.findUnique({
            where: { id: id as string },
        });

        if (!address) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Address not found' });
            return;
        }

        if (address.userId !== req.user.userId) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Access denied' });
            return;
        }

        await prisma.address.delete({
            where: { id: id as string },
        });

        res.status(StatusCodes.OK).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete address' });
    }
};

// Generate unique referral code helper
const generateReferralCode = (fullName: string, userId: string): string => {
    const namePrefix = fullName.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const uniqueSuffix = userId.substring(0, 6).toUpperCase();
    return `${namePrefix}${uniqueSuffix}`;
};

// Get or create referral code
export const getReferralCode = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        let user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                fullName: true,
                referralCode: true,
                referredBy: true,
            },
        });

        if (!user) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
            return;
        }

        // Generate referral code if doesn't exist
        if (!user.referralCode) {
            const code = generateReferralCode(user.fullName, user.id);
            user = await prisma.user.update({
                where: { id: req.user.userId },
                data: { referralCode: code },
                select: {
                    id: true,
                    fullName: true,
                    referralCode: true,
                    referredBy: true,
                },
            });
        }

        // Get referral stats
        const referralCount = await prisma.user.count({
            where: { referredBy: req.user.userId },
        });

        res.status(StatusCodes.OK).json({
            referralCode: user.referralCode,
            referralUrl: `${env.CLIENT_URL}/auth?ref=${user.referralCode}`,
            referralCount,
            wasReferred: !!user.referredBy,
        });
    } catch (error) {
        console.error('Get referral code error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to get referral code',
        });
    }
};

// Get referral stats
export const getReferralStats = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const referrals = await prisma.user.findMany({
            where: { referredBy: req.user.userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(StatusCodes.OK).json({
            referrals,
            totalReferrals: referrals.length,
        });
    } catch (error) {
        console.error('Get referral stats error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to get referral stats',
        });
    }
};
