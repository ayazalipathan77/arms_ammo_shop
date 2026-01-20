import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../validators/auth.validator';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate input
        const validatedData = registerSchema.parse(req.body);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            res.status(StatusCodes.CONFLICT).json({ message: 'User already exists' });
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(validatedData.password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: validatedData.email,
                passwordHash,
                fullName: validatedData.fullName,
                role: validatedData.role,
                phoneNumber: validatedData.phoneNumber,
            },
        });

        // If user is an artist, create artist profile
        if (validatedData.role === 'ARTIST') {
            await prisma.artist.create({
                data: {
                    userId: user.id,
                },
            });
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        res.status(StatusCodes.CREATED).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors
            });
            return;
        }
        console.error('Register error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate input
        const validatedData = loginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
            include: {
                artistProfile: true,
            },
        });

        if (!user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
            return;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(validatedData.password, user.passwordHash);

        if (!isPasswordValid) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
            return;
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        res.status(StatusCodes.OK).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                artistProfile: user.artistProfile,
            },
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors
            });
            return;
        }
        console.error('Login error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Login failed' });
    }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                artistProfile: true,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                phoneNumber: true,
                createdAt: true,
                artistProfile: true,
            },
        });

        if (!user) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
            return;
        }

        res.status(StatusCodes.OK).json({ user });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch user' });
    }
};
