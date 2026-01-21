import { z } from 'zod';

// Create payment intent schema
export const createPaymentIntentSchema = z.object({
    orderId: z.string().uuid('Invalid order ID'),
    currency: z.enum(['pkr', 'usd', 'gbp']).default('pkr'),
});

// Confirm payment schema
export const confirmPaymentSchema = z.object({
    paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
    orderId: z.string().uuid('Invalid order ID'),
});

// Bank transfer confirmation schema (admin only)
export const confirmBankTransferSchema = z.object({
    orderId: z.string().uuid('Invalid order ID'),
    transactionReference: z.string().min(1, 'Transaction reference is required'),
    notes: z.string().optional(),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type ConfirmBankTransferInput = z.infer<typeof confirmBankTransferSchema>;
