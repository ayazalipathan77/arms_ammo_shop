import { Request, Response } from 'express';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { env } from '../config/env';
import { AuthProvider } from '@prisma/client';

interface SocialProfile {
    provider: 'GOOGLE' | 'FACEBOOK';
    providerUserId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
}

export const findOrCreateSocialUser = async (profile: SocialProfile) => {
    // 1. Check if social account already exists
    const existingSocialAccount = await prisma.socialAccount.findUnique({
        where: {
            provider_providerUserId: {
                provider: profile.provider as AuthProvider,
                providerUserId: profile.providerUserId,
            },
        },
        include: { user: true },
    });

    if (existingSocialAccount) {
        return existingSocialAccount.user;
    }

    // 2. Check if a user with this email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: profile.email },
    });

    if (existingUser) {
        // Link social account to existing user
        await prisma.socialAccount.create({
            data: {
                provider: profile.provider as AuthProvider,
                providerUserId: profile.providerUserId,
                userId: existingUser.id,
            },
        });

        // Update avatar if not set
        if (!existingUser.avatarUrl && profile.avatarUrl) {
            await prisma.user.update({
                where: { id: existingUser.id },
                data: { avatarUrl: profile.avatarUrl },
            });
        }

        return existingUser;
    }

    // 3. Create new user + social account
    const newUser = await prisma.user.create({
        data: {
            email: profile.email,
            passwordHash: null,
            fullName: profile.fullName,
            avatarUrl: profile.avatarUrl,
            isEmailVerified: true, // Social login implies verified email
            isApproved: true,
            socialAccounts: {
                create: {
                    provider: profile.provider as AuthProvider,
                    providerUserId: profile.providerUserId,
                },
            },
        },
    });

    return newUser;
};

// Google OAuth callback handler
// SECURITY FIX: Use secure cookie instead of URL parameter to prevent token theft
export const googleCallback = (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
        res.redirect(`${env.CLIENT_URL}/auth?error=google_failed`);
        return;
    }

    const token = generateToken({
        userId: user.userId,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
    });

    // Store token in a short-lived secure cookie instead of URL
    res.cookie('auth_token_temp', token, {
        httpOnly: true, // Cannot be accessed by JavaScript
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 5 * 60 * 1000, // 5 minutes only
        path: '/api/auth/social-token'
    });

    // Redirect WITHOUT token in URL - prevents token exposure in browser history and referer headers
    res.redirect(`${env.CLIENT_URL}/auth/social-callback`);
};

// Facebook OAuth callback handler
// SECURITY FIX: Use secure cookie instead of URL parameter to prevent token theft
export const facebookCallback = (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
        res.redirect(`${env.CLIENT_URL}/auth?error=facebook_failed`);
        return;
    }

    const token = generateToken({
        userId: user.userId,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
    });

    // Store token in a short-lived secure cookie instead of URL
    res.cookie('auth_token_temp', token, {
        httpOnly: true, // Cannot be accessed by JavaScript
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 5 * 60 * 1000, // 5 minutes only
        path: '/api/auth/social-token'
    });

    // Redirect WITHOUT token in URL - prevents token exposure in browser history and referer headers
    res.redirect(`${env.CLIENT_URL}/auth/social-callback`);
};

// New endpoint: Retrieve social auth token from secure cookie
// This endpoint is called by the frontend after OAuth redirect
export const getSocialAuthToken = async (req: Request, res: Response): Promise<void> => {
    const tempToken = req.cookies?.auth_token_temp;
    
    if (!tempToken) {
        res.status(401).json({ 
            message: 'No authentication token found',
            code: 'TOKEN_MISSING'
        });
        return;
    }
    
    // Clear the temporary cookie immediately
    res.clearCookie('auth_token_temp', {
        path: '/api/auth/social-token'
    });
    
    // Return token in response body (not URL)
    res.json({ 
        token: tempToken,
        message: 'Authentication successful'
    });
};
