import { testPrisma } from '../db.helper';

export const createTestEvent = async (organizerId: string, overrides: {
  title?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  isFree?: boolean;
  category?: string;
} = {}) => {
  return testPrisma.event.create({
    data: {
      organizerId,
      title: overrides.title ?? 'Test Event',
      slug: `test-event-${Date.now()}`,
      venue: 'Test Venue',
      startDate: new Date('2026-12-01T10:00:00.000Z'),
      endDate: new Date('2026-12-01T18:00:00.000Z'),
      status: overrides.status ?? 'PUBLISHED',
      isFree: overrides.isFree ?? false,
      category: (overrides.category as never) ?? 'OTHER',
    },
  });
};

export const createTestTier = async (eventId: string, overrides: {
  price?: number;
  totalQuantity?: number;
  name?: string;
} = {}) => {
  return testPrisma.ticketTier.create({
    data: {
      eventId,
      name: overrides.name ?? 'Regular',
      price: overrides.price ?? 5000,
      totalQuantity: overrides.totalQuantity ?? 100,
    },
  });
};
