import { z } from 'zod';

export const createExhibitionSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)),
    endDate: z.string().or(z.date()).optional().transform((val) => val ? new Date(val) : null),
    location: z.string().min(1, 'Location is required'),
    imageUrl: z.string().min(1, 'Image URL is required'),
    isVirtual: z.boolean().default(false),
    status: z.enum(['UPCOMING', 'CURRENT', 'PAST']).default('UPCOMING'),
});

export const updateExhibitionSchema = createExhibitionSchema.partial();

export const exhibitionQuerySchema = z.object({
    status: z.enum(['UPCOMING', 'CURRENT', 'PAST']).optional(),
    isVirtual: z.string().transform((val) => val === 'true').optional(),
    limit: z.string().transform(Number).default('20'),
});

export type CreateExhibitionInput = z.infer<typeof createExhibitionSchema>;
export type UpdateExhibitionInput = z.infer<typeof updateExhibitionSchema>;
