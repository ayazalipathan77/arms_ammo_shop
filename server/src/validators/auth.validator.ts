import { z } from 'zod';

const emptyToUndefined = (val: unknown) => (val === '' ? undefined : val);

export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    role: z.enum(['USER', 'MANUFACTURER']).default('USER'),
    phoneNumber: z.preprocess(emptyToUndefined, z.string().optional()),
    address: z.preprocess(emptyToUndefined, z.string().min(5, 'Address is too short').optional()),
    city: z.preprocess(emptyToUndefined, z.string().min(2, 'City is required').optional()),
    country: z.string().default('Pakistan'),
    zipCode: z.preprocess(emptyToUndefined, z.string().optional()),
    recaptchaToken: z.any().optional(),
    referralCode: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    guestCart: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        type: z.enum(['FIREARM', 'AMMO', 'OPTIC', 'ACCESSORY']).optional(), // Optional as it might be inferred from product
        // printSize removed
    })).optional(),
});

export const updateProfileSchema = z.object({
    fullName: z.string().min(2).optional(),
    phoneNumber: z.string().optional(),
    description: z.string().optional(),
    portfolioUrl: z.string().url().optional(),
    countryOfOrigin: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
