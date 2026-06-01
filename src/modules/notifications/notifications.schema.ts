import { z } from 'zod';

export const setReminderSchema = z.object({
  eventId: z.string().uuid(),
  minutesBefore: z.number().int().min(5).max(10080), // 5 min to 7 days
});
