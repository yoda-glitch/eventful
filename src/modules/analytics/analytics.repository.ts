import prisma from '@/config/database.config';
import { OrderStatus } from '../../generated/prisma/client';

export class AnalyticsRepository {
  async getEventAnalytics(eventId: string) {
    return prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tiers: {
          include: {
            tickets: {
              include: { order: true },
            },
          },
        },
      },
    });
  }

  async getEventAttendance(eventId: string) {
    const [totalTickets, scannedTickets] = await Promise.all([
      prisma.ticket.count({ where: { tier: { eventId } } }),
      prisma.ticket.count({ where: { tier: { eventId }, isUsed: true } }),
    ]);
    return { totalTickets, scannedTickets };
  }

  async getEventPayments(eventId: string) {
    return prisma.payment.findMany({
      where: {
        order: {
          tickets: { some: { tier: { eventId } } },
          status: OrderStatus.COMPLETED,
        },
      },
      include: {
        order: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // PERF-1: Single query with aggregation instead of N+1
  async getOrganizerDashboard(organizerId: string) {
    return prisma.event.findMany({
      where: { organizerId },
      include: {
        tiers: {
          include: {
            tickets: {
              select: { isUsed: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTotalRevenue(): Promise<number> {
    const result = await prisma.order.aggregate({
      where: { status: OrderStatus.COMPLETED },
      _sum: { totalAmount: true },
    });
    return Number(result._sum.totalAmount ?? 0);
  }

  async getTotalTicketsSold(): Promise<number> {
    return prisma.ticket.count();
  }

  async getTotalUsers(): Promise<number> {
    return prisma.user.count();
  }

  async getTotalEvents(): Promise<number> {
    return prisma.event.count();
  }

  async getTopEvents(limit = 5) {
    const orders = await prisma.order.findMany({
      where: { status: OrderStatus.COMPLETED },
      include: {
        tickets: {
          include: {
            tier: { include: { event: true } },
          },
        },
      },
    });

    const eventMap = new Map<string, {
      eventId: string;
      eventTitle: string;
      totalRevenue: number;
      totalTicketsSold: number;
    }>();

    for (const order of orders) {
      for (const ticket of order.tickets) {
        const eventId = ticket.tier.event.id;
        const existing = eventMap.get(eventId);
        if (existing) {
          existing.totalRevenue += Number(ticket.tier.price);
          existing.totalTicketsSold += 1;
        } else {
          eventMap.set(eventId, {
            eventId,
            eventTitle: ticket.tier.event.title,
            totalRevenue: Number(ticket.tier.price),
            totalTicketsSold: 1,
          });
        }
      }
    }

    return Array.from(eventMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }
}
