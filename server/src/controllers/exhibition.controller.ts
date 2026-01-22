import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';
import {
    createExhibitionSchema,
    updateExhibitionSchema,
    exhibitionQuerySchema,
} from '../validators/exhibition.validator';

// Get all exhibitions
export const getExhibitions = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = exhibitionQuerySchema.parse(req.query);

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.isVirtual !== undefined) where.isVirtual = query.isVirtual;

        const exhibitions = await prisma.exhibition.findMany({
            where,
            orderBy: { startDate: 'asc' },
            take: query.limit,
        });

        res.status(StatusCodes.OK).json({ exhibitions });
    } catch (error) {
        console.error('Get exhibitions error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch exhibitions',
        });
    }
};

// Get single exhibition
export const getExhibitionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const exhibition = await prisma.exhibition.findUnique({
            where: { id },
        });

        if (!exhibition) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Exhibition not found' });
            return;
        }

        res.status(StatusCodes.OK).json({ exhibition });
    } catch (error) {
        console.error('Get exhibition error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch exhibition',
        });
    }
};

// Create exhibition (Admin only)
export const createExhibition = async (req: Request, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Admin access required' });
            return;
        }

        const validatedData = createExhibitionSchema.parse(req.body);

        const exhibition = await prisma.exhibition.create({
            data: validatedData,
        });

        res.status(StatusCodes.CREATED).json({
            message: 'Exhibition created successfully',
            exhibition,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Create exhibition error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to create exhibition',
        });
    }
};

// Update exhibition (Admin only)
export const updateExhibition = async (req: Request, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Admin access required' });
            return;
        }

        const { id } = req.params;
        const validatedData = updateExhibitionSchema.parse(req.body);

        const exhibition = await prisma.exhibition.update({
            where: { id },
            data: validatedData,
        });

        res.status(StatusCodes.OK).json({
            message: 'Exhibition updated successfully',
            exhibition,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Update exhibition error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to update exhibition',
        });
    }
};

// Delete exhibition (Admin only)
export const deleteExhibition = async (req: Request, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Admin access required' });
            return;
        }

        const { id } = req.params;
        await prisma.exhibition.delete({
            where: { id },
        });

        res.status(StatusCodes.OK).json({ message: 'Exhibition deleted successfully' });
    } catch (error) {
        console.error('Delete exhibition error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to delete exhibition',
        });
    }
};
