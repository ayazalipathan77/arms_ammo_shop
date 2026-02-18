import { z } from 'zod';

export const createProductSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    manufacturerName: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    currency: z.enum(['PKR', 'USD', 'GBP']).default('PKR'),
    category: z.string().min(1, 'Category is required'),
    type: z.enum(['FIREARM', 'AMMO', 'OPTIC', 'ACCESSORY']).default('FIREARM'),
    caliber: z.string().optional(),
    action: z.string().optional(),
    capacity: z.string().optional(),
    barrelLength: z.string().optional(),
    weight: z.string().optional(),
    imageUrl: z.string().url('Invalid image URL'),
    thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
    additionalImages: z.array(z.string().url()).optional(),
    year: z.number().int().min(1000).max(new Date().getFullYear()),
    inStock: z.boolean().default(true),
});

export const updateProductSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    manufacturerName: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive').optional(),
    currency: z.enum(['PKR', 'USD', 'GBP']).optional(),
    category: z.string().min(1).optional(),
    type: z.enum(['FIREARM', 'AMMO', 'OPTIC', 'ACCESSORY']).optional(),
    caliber: z.string().optional(),
    action: z.string().optional(),
    capacity: z.string().optional(),
    barrelLength: z.string().optional(),
    weight: z.string().optional(),
    imageUrl: z.string().url('Invalid image URL').optional(),
    thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
    additionalImages: z.array(z.string().url()).optional(),
    year: z.number().int().min(1000).max(new Date().getFullYear()).optional(),
    inStock: z.boolean().optional(),
});

export const productQuerySchema = z.object({
    category: z.string().optional(),
    type: z.enum(['FIREARM', 'AMMO', 'OPTIC', 'ACCESSORY']).optional(),
    minPrice: z.string().transform(Number).optional(),
    maxPrice: z.string().transform(Number).optional(),
    search: z.string().optional(),
    manufacturerId: z.string().uuid().optional(),
    inStock: z.string().transform(val => val === 'true').optional(),
    sortBy: z.enum(['price', 'createdAt', 'title', 'year', 'viewCount']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('12'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
