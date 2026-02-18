import { z } from 'zod';

export const updateManufacturerProfileSchema = z.object({
    description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
    portfolioUrl: z.string().url('Invalid portfolio URL').optional().or(z.literal('')),
    countryOfOrigin: z.string().max(100).optional(),
    imageUrl: z.string().optional(),
});

export const manufacturerQuerySchema = z.object({
    search: z.string().optional(),
    countryOfOrigin: z.string().optional(),
    sortBy: z.enum(['createdAt', 'fullName']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('12'),
});

export type UpdateManufacturerProfileInput = z.infer<typeof updateManufacturerProfileSchema>;
export type ManufacturerQueryInput = z.infer<typeof manufacturerQuerySchema>;
