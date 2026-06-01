import prisma from '@/config/database.config';
import { Event, TicketTier, EventStatus, EventCategory } from '../../generated/prisma/client';
import { CreateEventDto, UpdateEventDto, CreateTicketTierDto, UpdateTicketTierDto, EventQuery } from './events.types';

export class EventsRepository {
  async createEvent(organizerId: string, data: CreateEventDto & { slug: string }): Promise<Event> {
    return prisma.event.create({
      data: {
        organizerId,
        title: data.title,
        description: data.description,
        venue: data.venue,
        timezone: data.timezone ?? 'Africa/Lagos',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        slug: data.slug,
        category: data.category as EventCategory ?? EventCategory.OTHER,
        coverImageUrl: data.coverImageUrl,
        isFree: data.isFree ?? false,
      },
    });
  }

  async findEventById(id: string): Promise<Event & { tiers: TicketTier[] } | null> {
    return prisma.event.findUnique({
      where: { id },
      include: { tiers: true },
    });
  }

  async findEventBySlug(slug: string): Promise<Event & { tiers: TicketTier[] } | null> {
    return prisma.event.findUnique({
      where: { slug },
      include: { tiers: true },
    });
  }

  async findAllEvents(query: EventQuery): Promise<{ events: Event[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.status ? { status: query.status as EventStatus } : {}),
      ...(query.category ? { category: query.category as EventCategory } : {}),
      ...(query.search ? {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' as const } },
          { description: { contains: query.search, mode: 'insensitive' as const } },
          { venue: { contains: query.search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
        include: { tiers: true },
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total };
  }

  async updateEvent(id: string, data: UpdateEventDto): Promise<Event> {
    return prisma.event.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        category: data.category as EventCategory | undefined,
      },
    });
  }

  async updateEventStatus(id: string, status: EventStatus): Promise<Event> {
    return prisma.event.update({
      where: { id },
      data: { status },
    });
  }

  async deleteEvent(id: string): Promise<void> {
    await prisma.event.delete({ where: { id } });
  }

  async createTicketTier(eventId: string, data: CreateTicketTierDto): Promise<TicketTier> {
    return prisma.ticketTier.create({
      data: {
        eventId,
        name: data.name,
        description: data.description,
        price: data.price,
        totalQuantity: data.totalQuantity,
        features: data.features ?? [],
      },
    });
  }

  async findTierById(id: string): Promise<TicketTier | null> {
    return prisma.ticketTier.findUnique({ where: { id } });
  }

  async updateTicketTier(id: string, data: UpdateTicketTierDto): Promise<TicketTier> {
    return prisma.ticketTier.update({
      where: { id },
      data,
    });
  }

  async deleteTicketTier(id: string): Promise<void> {
    await prisma.ticketTier.delete({ where: { id } });
  }
}
