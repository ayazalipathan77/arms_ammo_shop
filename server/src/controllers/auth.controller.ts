import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { sendEmail, getPasswordResetTemplate, getVerificationTemplate } from '../utils/email';
import { env } from '../config/env';

// Generate a secure random token
const generateVerificationToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Registration request body:', req.body);
        // Validate input
        const validatedData = registerSchema.parse(req.body);
        console.log('Validated data:', validatedData);

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

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user with verification token
        const user = await prisma.user.create({
            data: {
                email: validatedData.email,
                passwordHash,
                fullName: validatedData.fullName,
                role: validatedData.role,
                phoneNumber: validatedData.phoneNumber,
                verificationToken,
                verificationTokenExpiry,
                isEmailVerified: false,
                isApproved: validatedData.role === 'USER', // Users are auto-approved, artists need admin approval
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

        // Link referral if provided
        if (validatedData.referralCode) {
            const referralConfig = await prisma.setting.findUnique({ where: { key: 'referralConfig' } });
            const config = referralConfig?.value as any;
            if (config?.isEnabled) {
                const referrer = await prisma.user.findUnique({
                    where: { referralCode: validatedData.referralCode },
                    select: { id: true },
                });
                if (referrer) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { referredBy: referrer.id },
                    });
                }
            }
        }

        // Create address if provided
        if (validatedData.address && validatedData.city) {
            await prisma.address.create({
                data: {
                    userId: user.id,
                    address: validatedData.address,
                    city: validatedData.city,
                    country: validatedData.country,
                    zipCode: validatedData.zipCode,
                    type: 'SHIPPING',
                    isDefault: true
                }
            });
        }

        // Send verification email
        const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${verificationToken}&id=${user.id}`;
        const emailContent = getVerificationTemplate(verifyUrl);
        await sendEmail(user.email, 'Verify Your Email - Muraqqa Art Gallery', emailContent);

        res.status(StatusCodes.CREATED).json({
            message: validatedData.role === 'ARTIST'
                ? 'Registration successful! Please verify your email. After verification, your account will be reviewed by our team.'
                : 'Registration successful! Please verify your email to continue.',
            requiresVerification: true,
            requiresApproval: validatedData.role === 'ARTIST',
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

// Helper to merge guest cart
const mergeGuestCart = async (userId: string, guestCart: any[]) => {
    if (!guestCart || guestCart.length === 0) return;

    for (const item of guestCart) {
        // Verify artwork exists
        const artwork = await prisma.artwork.findUnique({ where: { id: item.artworkId } });
        if (!artwork) continue;

        const existingItem = await prisma.cartItem.findFirst({
            where: {
                userId,
                artworkId: item.artworkId,
                type: item.type,
                printSize: item.printSize || null,
            },
        });

        if (existingItem) {
            // Update quantity
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + item.quantity },
            });
        } else {
            // Create new item
            await prisma.cartItem.create({
                data: {
                    userId,
                    artworkId: item.artworkId,
                    quantity: item.quantity,
                    type: item.type,
                    printSize: item.printSize || null,
                },
            });
        }
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate input
        const validatedData = loginSchema.parse(req.body);
        console.log('Login attempt for email:', validatedData.email);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
            include: {
                artistProfile: true,
            },
        });

        if (!user) {
            console.log('User not found for email:', validatedData.email);
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
            return;
        }

        console.log('User found:', user.email, 'Role:', user.role);

        // Check if this is a social-only account (no password)
        if (!user.passwordHash) {
            res.status(StatusCodes.FORBIDDEN).json({
                message: 'This account uses social login. Please sign in with Google or Facebook.',
                code: 'SOCIAL_ONLY_ACCOUNT',
            });
            return;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(validatedData.password, user.passwordHash);
        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('Invalid password for user:', user.email);
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
            return;
        }

        // Check email verification (skip for admins)
        if (!user.isEmailVerified && user.role !== 'ADMIN') {
            res.status(StatusCodes.FORBIDDEN).json({
                message: 'Please verify your email before logging in.',
                code: 'EMAIL_NOT_VERIFIED',
                userId: user.id,
                email: user.email
            });
            return;
        }

        // Check artist approval (only for artists)
        if (user.role === 'ARTIST' && !user.isApproved) {
            res.status(StatusCodes.FORBIDDEN).json({
                message: 'Your artist account is pending approval. You will be notified once approved.',
                code: 'ARTIST_NOT_APPROVED'
            });
            return;
        }

        // Merge guest cart if provided
        if (validatedData.guestCart && validatedData.guestCart.length > 0) {
            await mergeGuestCart(user.id, validatedData.guestCart);
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
        });

        res.status(StatusCodes.OK).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                isApproved: user.isApproved,
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
        });

        if (!user) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
            return;
        }

        res.status(StatusCodes.OK).json({
            user: {
                ...user,
                passwordHash: undefined, // Remove password hash from response
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch user' });
    }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Email is required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Generic message to avoid enumeration
            res.status(StatusCodes.OK).json({ message: 'If the email exists, a reset link has been sent.' });
            return;
        }

        // Social-only accounts can't reset passwords
        if (!user.passwordHash) {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'This account uses social login and has no password to reset. Please sign in with Google or Facebook.',
                code: 'SOCIAL_ONLY_ACCOUNT',
            });
            return;
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(resetToken, 10);

        // Save hashed token to db
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: hash,
                resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
            },
        });

        // Send email
        const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}&id=${user.id}`;
        const emailContent = getPasswordResetTemplate(resetUrl);
        await sendEmail(user.email, 'Password Reset Request', emailContent);

        res.status(StatusCodes.OK).json({ message: 'If the email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong' });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, token, newPassword } = req.body;

        if (!userId || !token || !newPassword) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing required fields' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.resetToken || !user.resetTokenExpiry) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid or expired token' });
            return;
        }

        // Check expiry
        if (new Date() > user.resetTokenExpiry) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Token expired' });
            return;
        }

        // Verify token
        const isValid = await bcrypt.compare(token, user.resetToken);
        if (!isValid) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid or expired token' });
            return;
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update user
        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        res.status(StatusCodes.OK).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to reset password' });
    }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, token } = req.body;

        if (!userId || !token) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing required fields' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid user' });
            return;
        }

        // Check if already verified
        if (user.isEmailVerified) {
            res.status(StatusCodes.OK).json({
                message: 'Email already verified',
                isApproved: user.isApproved,
                role: user.role
            });
            return;
        }

        // Verify the token matches
        if (user.verificationToken !== token) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid verification token' });
            return;
        }

        // Check token expiry
        if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Verification link has expired. Please request a new one.' });
            return;
        }

        // Mark as verified
        await prisma.user.update({
            where: { id: userId },
            data: {
                isEmailVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null,
            },
        });

        // Return different messages based on role
        if (user.role === 'ARTIST') {
            res.status(StatusCodes.OK).json({
                message: 'Email verified successfully! Your artist account is now pending admin approval. You will be notified once approved.',
                requiresApproval: true,
                isApproved: false,
                role: user.role
            });
        } else {
            res.status(StatusCodes.OK).json({
                message: 'Email verified successfully! You can now log in.',
                requiresApproval: false,
                isApproved: true,
                role: user.role
            });
        }
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to verify email' });
    }
};

// Resend verification email
export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Email is required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Generic message to avoid enumeration
            res.status(StatusCodes.OK).json({ message: 'If the email exists, a verification link has been sent.' });
            return;
        }

        if (user.isEmailVerified) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Email is already verified' });
            return;
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken,
                verificationTokenExpiry,
            },
        });

        // Send verification email
        const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${verificationToken}&id=${user.id}`;
        const emailContent = getVerificationTemplate(verifyUrl);
        await sendEmail(user.email, 'Verify Your Email - Muraqqa Art Gallery', emailContent);

        res.status(StatusCodes.OK).json({ message: 'Verification email sent successfully' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to resend verification email' });
    }
};
