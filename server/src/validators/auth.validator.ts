import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    role: z.enum(['USER', 'ARTIST']).default('USER'),
    phoneNumber: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
    fullName: z.string().min(2).optional(),
    phoneNumber: z.string().optional(),
    bio: z.string().optional(),
    portfolioUrl: z.string().url().optional(),
    originCity: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
