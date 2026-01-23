import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';

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
        const pendingArtists = await prisma.user.count({ where: { role: 'USER' } }); // Logic might vary if we have a specific 'APPLICANT' role or status

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
                createdAt: true,
                artistProfile: {
                    select: { id: true }
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
