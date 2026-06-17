import { z } from 'zod';

const categories = [
  'MUSIC', 'NIGHTLIFE', 'PERFORMING_ARTS', 'HOLIDAYS',
  'DATING', 'HOBBIES', 'BUSINESS', 'FOOD_AND_DRINK',
  'CONFERENCE', 'CONCERT', 'COMMUNITY', 'SEASONAL', 'OTHER'
] as const;

export const createEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  venue: z.string().min(3).max(200),
  timezone: z.string().default('Africa/Lagos'),
  startDate: z.string().datetime({ message: 'Invalid startDate format' }),
  endDate: z.string().datetime({ message: 'Invalid endDate format' }),
  category: z.enum(categories).default('OTHER'),
  coverImageUrl: z.string().url().optional(),
  galleryImages: z.array(z.string().url()).max(2).optional(),
  isFree: z.boolean().default(false),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'endDate must be after startDate',
  path: ['endDate'],
});

export const updateEventSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  venue: z.string().min(3).max(200).optional(),
  timezone: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: z.enum(categories).optional(),
  coverImageUrl: z.string().url().optional(),
  galleryImages: z.array(z.string().url()).max(2).optional(),
  isFree: z.boolean().optional(),
});

export const createTicketTierSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  totalQuantity: z.number().int().min(1),
  features: z.array(z.string().max(100)).max(10).default([]),
});

export const updateTicketTierSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(0).optional(),
  totalQuantity: z.number().int().min(1).optional(),
  features: z.array(z.string().max(100)).max(10).optional(),
});
