import { z } from 'zod';

export const addToCartSchema = z.object({
    artworkId: z.string().uuid('Invalid artwork ID'),
    quantity: z.number().int().positive().default(1),
    type: z.enum(['ORIGINAL', 'PRINT']).default('ORIGINAL'),
    printSize: z.string().optional(), // E.g., 'A4', 'A3', 'CANVAS_24x36'
});

export const updateCartItemSchema = z.object({
    quantity: z.number().int().positive('Quantity must be positive'),
});

export const removeFromCartSchema = z.object({
    artworkId: z.string().uuid('Invalid artwork ID'),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
