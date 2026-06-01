import { AnalyticsRepository } from './analytics.repository';
import { EventAnalytics, PlatformAnalytics } from './analytics.types';
import { NotFoundError, ForbiddenError } from '@/shared/errors/HttpError';
import redis from '@/config/redis.config';

const CACHE_TTL = 1800;

export class AnalyticsService {
  private repository: AnalyticsRepository;

  constructor() {
    this.repository = new AnalyticsRepository();
  }

  async getEventAnalytics(eventId: string, organizerId: string): Promise<EventAnalytics> {
    const cacheKey = `analytics:event:${eventId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as EventAnalytics;

    const event = await this.repository.getEventAnalytics(eventId);
    if (!event) throw new NotFoundError('Event not found');
    if (event.organizerId !== organizerId) throw new ForbiddenError('Not your event');

    const { totalTickets, scannedTickets } = await this.repository.getEventAttendance(eventId);

    const tiers = event.tiers.map((tier) => {
      const revenue = tier.tickets
        .filter((t) => t.order.status === 'COMPLETED')
        .length * Number(tier.price);

      return {
        tierId: tier.id,
        name: tier.name,
        price: Number(tier.price),
        totalQuantity: tier.totalQuantity,
        soldQuantity: tier.soldQuantity,
        revenue,
        utilization: tier.totalQuantity > 0
          ? Math.round((tier.soldQuantity / tier.totalQuantity) * 100)
          : 0,
      };
    });

    const totalRevenue = tiers.reduce((sum, t) => sum + t.revenue, 0);
    const totalTicketsSold = tiers.reduce((sum, t) => sum + t.soldQuantity, 0);
    const totalQuantity = tiers.reduce((sum, t) => sum + t.totalQuantity, 0);

    const analytics: EventAnalytics = {
      eventId: event.id,
      eventTitle: event.title,
      totalRevenue,
      totalTicketsSold,
      totalTickets: totalQuantity,
      capacityUtilization: totalQuantity > 0
        ? Math.round((totalTicketsSold / totalQuantity) * 100)
        : 0,
      attendance: {
        totalTickets,
        scannedTickets,
        attendanceRate: totalTickets > 0
          ? Math.round((scannedTickets / totalTickets) * 100)
          : 0,
      },
      tiers,
    };

    await redis.set(cacheKey, JSON.stringify(analytics), 'EX', CACHE_TTL);
    return analytics;
  }

  async getEventPayments(eventId: string, organizerId: string) {
    const cacheKey = `analytics:payments:${eventId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const event = await this.repository.getEventAnalytics(eventId);
    if (!event) throw new NotFoundError('Event not found');
    if (event.organizerId !== organizerId) throw new ForbiddenError('Not your event');

    const payments = await this.repository.getEventPayments(eventId);

    const result = payments.map((p) => ({
      paymentId: p.id,
      reference: p.reference,
      amount: Number(p.order.totalAmount),
      status: p.status,
      paidAt: p.paidAt,
      buyer: {
        id: p.order.user.id,
        name: `${p.order.user.firstName} ${p.order.user.lastName}`,
        email: p.order.user.email,
      },
    }));

    await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
    return result;
  }

  async getOrganizerDashboard(organizerId: string) {
    const cacheKey = `analytics:organizer:${organizerId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // PERF-1: Single query, no N+1
    const events = await this.repository.getOrganizerDashboard(organizerId);

    const dashboard = events.map((event) => {
      const totalTicketsSold = event.tiers.reduce((sum, t) => sum + t.soldQuantity, 0);
      const totalTickets = event.tiers.reduce((sum, t) => sum + t.totalQuantity, 0);
      const totalRevenue = event.tiers.reduce(
        (sum, t) => sum + t.soldQuantity * Number(t.price), 0
      );
      const scannedTickets = event.tiers.reduce(
        (sum, t) => sum + t.tickets.filter((tk) => tk.isUsed).length, 0
      );

      return {
        eventId: event.id,
        eventTitle: event.title,
        status: event.status,
        startDate: event.startDate,
        totalRevenue,
        totalTicketsSold,
        totalTickets,
        scannedTickets,
        capacityUtilization: totalTickets > 0
          ? Math.round((totalTicketsSold / totalTickets) * 100)
          : 0,
        attendanceRate: totalTicketsSold > 0
          ? Math.round((scannedTickets / totalTicketsSold) * 100)
          : 0,
      };
    });

    await redis.set(cacheKey, JSON.stringify(dashboard), 'EX', CACHE_TTL);
    return dashboard;
  }

  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    const cacheKey = 'analytics:platform';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as PlatformAnalytics;

    const [totalRevenue, totalTicketsSold, totalUsers, totalEvents, topEvents] =
      await Promise.all([
        this.repository.getTotalRevenue(),
        this.repository.getTotalTicketsSold(),
        this.repository.getTotalUsers(),
        this.repository.getTotalEvents(),
        this.repository.getTopEvents(),
      ]);

    const analytics: PlatformAnalytics = {
      totalEvents,
      totalRevenue,
      totalTicketsSold,
      totalUsers,
      topEvents,
    };

    await redis.set(cacheKey, JSON.stringify(analytics), 'EX', CACHE_TTL);
    return analytics;
  }
}
