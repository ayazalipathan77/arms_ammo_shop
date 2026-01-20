import { z } from 'zod';

export const updateArtistProfileSchema = z.object({
    bio: z.string().max(2000, 'Bio must be less than 2000 characters').optional(),
    portfolioUrl: z.string().url('Invalid portfolio URL').optional().or(z.literal('')),
    originCity: z.string().max(100).optional(),
});

export const artistQuerySchema = z.object({
    search: z.string().optional(),
    originCity: z.string().optional(),
    sortBy: z.enum(['createdAt', 'fullName']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('12'),
});

export type UpdateArtistProfileInput = z.infer<typeof updateArtistProfileSchema>;
export type ArtistQueryInput = z.infer<typeof artistQuerySchema>;
