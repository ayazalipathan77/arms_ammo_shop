import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';
import { sendEmail } from '../utils/email';
import { env } from '../config/env';

// Email template for artist approval
const getArtistApprovalTemplate = (artistName: string) => {
    return `
    <div style="font-family: serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706; text-align: center; border-bottom: 1px solid #e7e5e4; padding-bottom: 20px;">MURAQQA</h1>
        <p>Dear ${artistName},</p>
        <p>Congratulations! Your artist account has been approved. You can now log in and start showcasing your artwork on Muraqqa Art Gallery.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${env.CLIENT_URL}/auth" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-family: sans-serif;">Login to Your Account</a>
        </div>
        <p style="font-size: 0.9em; color: #57534e;">Welcome to the Muraqqa family. We look forward to seeing your creative works.</p>
        <hr style="border: 0; border-top: 1px solid #e7e5e4; margin: 20px 0;">
        <p style="font-size: 0.8em; text-align: center; color: #78716c;">Muraqqa Art Gallery</p>
    </div>
    `;
};

// Email template for artist rejection
const getArtistRejectionTemplate = (artistName: string, reason?: string) => {
    return `
    <div style="font-family: serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706; text-align: center; border-bottom: 1px solid #e7e5e4; padding-bottom: 20px;">MURAQQA</h1>
        <p>Dear ${artistName},</p>
        <p>Thank you for your interest in joining Muraqqa Art Gallery as an artist.</p>
        <p>After careful review, we regret to inform you that we are unable to approve your artist account at this time.</p>
        ${reason ? `<p style="background: #fef3c7; padding: 12px; border-radius: 4px;"><strong>Reason:</strong> ${reason}</p>` : ''}
        <p style="font-size: 0.9em; color: #57534e;">You are welcome to apply again in the future or contact us for more information.</p>
        <hr style="border: 0; border-top: 1px solid #e7e5e4; margin: 20px 0;">
        <p style="font-size: 0.8em; text-align: center; color: #78716c;">Muraqqa Art Gallery</p>
    </div>
    `;
};

// Get Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Total Revenue (Sum of all PAID/DELIVERED/SHIPPED orders)
        const revenueResult = await prisma.order.aggregate({
            _sum: {
                totalAmount: true,
            },
            where: {
                status: {
                    in: ['PAID', 'SHIPPED', 'DELIVERED'],
                },
            },
        });
        const totalRevenue = revenueResult._sum.totalAmount || 0;

        // 2. Counts
        const totalOrders = await prisma.order.count();
        const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
        const paidOrders = await prisma.order.count({ where: { status: 'PAID' } });
        const shippedOrders = await prisma.order.count({ where: { status: 'SHIPPED' } });

        const totalUsers = await prisma.user.count();
        const totalArtists = await prisma.artist.count();
        const pendingArtists = await prisma.user.count({
            where: {
                role: 'ARTIST',
                isEmailVerified: true,
                isApproved: false
            }
        });
        const pendingVerification = await prisma.user.count({
            where: { isEmailVerified: false }
        });

        const totalArtworks = await prisma.artwork.count();
        const inStockArtworks = await prisma.artwork.count({ where: { inStock: true } });

        // 3. Recent Activity (Last 5 orders)
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { fullName: true, email: true }
                }
            }
        });

        res.status(StatusCodes.OK).json({
            stats: {
                totalRevenue,
                totalOrders,
                pendingOrders,
                paidOrders,
                shippedOrders,
                totalUsers,
                totalArtists,
                pendingArtists,
                pendingVerification,
                totalArtworks,
                inStockArtworks
            },
            recentOrders
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch dashboard stats' });
    }
};

// Get All Users (with filtering)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const role = typeof req.query.role === 'string' ? req.query.role : undefined;
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;

        const where: any = {};
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isEmailVerified: true,
                isApproved: true,
                approvedAt: true,
                createdAt: true,
                artistProfile: {
                    select: {
                        id: true,
                        bio: true,
                        portfolioUrl: true,
                        originCity: true,
                        imageUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(StatusCodes.OK).json({ users });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch users' });
    }
};

// Update User Role
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const { role } = req.body;

        if (!['USER', 'ARTIST', 'ADMIN'].includes(role)) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid role' });
            return;
        }

        const user = await prisma.user.update({
            where: { id },
            data: { role },
        });

        // If promoting to ARTIST, ensure Artist profile exists
        if (role === 'ARTIST') {
            const existingProfile = await prisma.artist.findUnique({ where: { userId: id } });
            if (!existingProfile) {
                await prisma.artist.create({
                    data: { userId: id }
                });
            }
        }

        res.status(StatusCodes.OK).json({ message: 'User role updated successfully', user });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update user role' });
    }
};

// Delete User
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = String(req.params.id);
        const currentUserId = req.user?.userId;

        // Prevent admins from deleting themselves
        if (userId === currentUserId) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Cannot delete your own account' });
            return;
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        if (!user) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
            return;
        }

        // Prevent deletion of other admins
        if (user.role === 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Cannot delete admin accounts' });
            return;
        }

        // Delete user (cascading deletes will handle related records via Prisma schema)
        await prisma.user.delete({
            where: { id: userId }
        });

        res.status(StatusCodes.OK).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete user' });
    }
};

// Get Pending Artist Approvals
export const getPendingArtists = async (req: Request, res: Response): Promise<void> => {
    try {
        const artists = await prisma.user.findMany({
            where: {
                role: 'ARTIST',
                isEmailVerified: true,
                isApproved: false
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                createdAt: true,
                artistProfile: {
                    select: {
                        id: true,
                        bio: true,
                        portfolioUrl: true,
                        originCity: true,
                        imageUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' } // Oldest first
        });

        res.status(StatusCodes.OK).json({ artists });
    } catch (error) {
        console.error('Get pending artists error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch pending artists' });
    }
};

// Approve Artist
export const approveArtist = async (req: Request, res: Response): Promise<void> => {
    try {
        const artistUserId = String(req.params.id);
        const adminUserId = req.user?.userId;

        const user = await prisma.user.findUnique({
            where: { id: artistUserId }
        });

        if (!user) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
            return;
        }

        if (user.role !== 'ARTIST') {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'User is not an artist' });
            return;
        }

        if (user.isApproved) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Artist is already approved' });
            return;
        }

        if (!user.isEmailVerified) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Artist email is not verified yet' });
            return;
        }

        // Approve the artist
        const updatedUser = await prisma.user.update({
            where: { id: artistUserId },
            data: {
                isApproved: true,
                approvedAt: new Date(),
                approvedBy: adminUserId
            }
        });

        // Send approval email
        const emailContent = getArtistApprovalTemplate(user.fullName);
        await sendEmail(user.email, 'Your Artist Account Has Been Approved - Muraqqa', emailContent);

        res.status(StatusCodes.OK).json({
            message: 'Artist approved successfully',
            user: {
                id: updatedUser.id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                isApproved: updatedUser.isApproved,
                approvedAt: updatedUser.approvedAt
            }
        });
    } catch (error) {
        console.error('Approve artist error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to approve artist' });
    }
};

// Reject Artist (Delete or mark as rejected)
export const rejectArtist = async (req: Request, res: Response): Promise<void> => {
    try {
        const artistUserId = String(req.params.id);
        const { reason, deleteAccount } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: artistUserId },
            include: { artistProfile: true }
        });

        if (!user) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
            return;
        }

        if (user.role !== 'ARTIST') {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'User is not an artist' });
            return;
        }

        if (user.isApproved) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Cannot reject an already approved artist' });
            return;
        }

        // Send rejection email
        const emailContent = getArtistRejectionTemplate(user.fullName, reason);
        await sendEmail(user.email, 'Artist Application Update - Muraqqa', emailContent);

        if (deleteAccount) {
            // Delete the artist profile first (if exists)
            if (user.artistProfile) {
                await prisma.artist.delete({ where: { userId: artistUserId } });
            }
            // Delete the user
            await prisma.user.delete({ where: { id: artistUserId } });

            res.status(StatusCodes.OK).json({ message: 'Artist rejected and account deleted' });
        } else {
            // Just change role to USER so they can use the account as a collector
            await prisma.user.update({
                where: { id: artistUserId },
                data: {
                    role: 'USER',
                    isApproved: true // Auto-approve as regular user
                }
            });

            // Delete artist profile
            if (user.artistProfile) {
                await prisma.artist.delete({ where: { userId: artistUserId } });
            }

            res.status(StatusCodes.OK).json({ message: 'Artist rejected, account converted to collector' });
        }
    } catch (error) {
        console.error('Reject artist error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to reject artist' });
    }
};
