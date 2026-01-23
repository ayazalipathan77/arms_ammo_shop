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
