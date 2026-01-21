import { z } from 'zod';

// Order item schema for order creation
const orderItemSchema = z.object({
    artworkId: z.string().uuid('Invalid artwork ID'),
    quantity: z.number().int().positive().default(1),
    type: z.enum(['ORIGINAL', 'PRINT']).default('ORIGINAL'),
    printSize: z.string().optional(),
});

// Create order schema
export const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
    shippingAddress: z.string().min(10, 'Shipping address is required'),
    shippingCity: z.string().min(2, 'City is required'),
    shippingCountry: z.string().min(2, 'Country is required'),
    paymentMethod: z.enum(['STRIPE', 'BANK']).default('STRIPE'),
    currency: z.enum(['PKR', 'USD', 'GBP']).default('PKR'),
    notes: z.string().optional(),
});

// Update order status (admin only)
export const updateOrderStatusSchema = z.object({
    status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
    trackingNumber: z.string().optional(),
});

// Order query schema for filtering
export const orderQuerySchema = z.object({
    status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['createdAt', 'totalAmount', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
