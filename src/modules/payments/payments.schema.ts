import { z } from 'zod';

export const initiateOrderSchema = z.object({
  tierId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
});

export const refundSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().min(0).optional(),
});
