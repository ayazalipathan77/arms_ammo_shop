import { z } from 'zod';

export const createArtworkSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    currency: z.enum(['PKR', 'USD', 'GBP']).default('PKR'),
    category: z.string().min(1, 'Category is required'),
    medium: z.string().min(1, 'Medium is required'),
    dimensions: z.string().optional(),
    imageUrl: z.string().url('Invalid image URL'),
    year: z.number().int().min(1000).max(new Date().getFullYear()),
    isAuction: z.boolean().default(false),
    inStock: z.boolean().default(true),
});

export const updateArtworkSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive').optional(),
    currency: z.enum(['PKR', 'USD', 'GBP']).optional(),
    category: z.string().min(1).optional(),
    medium: z.string().min(1).optional(),
    dimensions: z.string().optional(),
    imageUrl: z.string().url('Invalid image URL').optional(),
    year: z.number().int().min(1000).max(new Date().getFullYear()).optional(),
    isAuction: z.boolean().optional(),
    inStock: z.boolean().optional(),
});

export const artworkQuerySchema = z.object({
    category: z.string().optional(),
    medium: z.string().optional(),
    minPrice: z.string().transform(Number).optional(),
    maxPrice: z.string().transform(Number).optional(),
    search: z.string().optional(),
    artistId: z.string().uuid().optional(),
    inStock: z.string().transform(val => val === 'true').optional(),
    isAuction: z.string().transform(val => val === 'true').optional(),
    sortBy: z.enum(['price', 'createdAt', 'title', 'year']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('12'),
});

export type CreateArtworkInput = z.infer<typeof createArtworkSchema>;
export type UpdateArtworkInput = z.infer<typeof updateArtworkSchema>;
export type ArtworkQueryInput = z.infer<typeof artworkQuerySchema>;
