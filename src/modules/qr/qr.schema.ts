import { z } from 'zod';

export const validateQRSchema = z.object({
  qrCodeHash: z.string().min(1),
});
