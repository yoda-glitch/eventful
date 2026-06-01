import { EventsRepository } from './events.repository';
import { CreateEventDto, UpdateEventDto, CreateTicketTierDto, UpdateTicketTierDto, EventQuery } from './events.types';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/shared/errors/HttpError';
import { EventStatus } from '../../generated/prisma/client';
import redis from '@/config/redis.config';
import prisma from '@/config/database.config';
import crypto from 'crypto';

const CACHE_TTL = 300;
const CACHE_PREFIX = 'event:';

export class EventsService {
  private repository: EventsRepository;

  constructor() {
    this.repository = new EventsRepository();
  }

  async createEvent(organizerId: string, dto: CreateEventDto) {
    const slug = this.generateSlug(dto.title);

    // ARCH-2: Wrap role upgrade and event creation in transaction
    const event = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: organizerId },
        data: { role: 'ORGANIZER' },
      });

      return tx.event.create({
        data: {
          organizerId,
          title: dto.title,
          description: dto.description,
          venue: dto.venue,
          timezone: dto.timezone ?? 'Africa/Lagos',
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          slug,
          category: (dto.category as import('../../generated/prisma/client').EventCategory) ?? 'OTHER',
          coverImageUrl: dto.coverImageUrl,
          isFree: dto.isFree ?? false,
        },
      });
    });

    return event;
  }

  async getEventById(id: string) {
    const cacheKey = `${CACHE_PREFIX}${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const event = await this.repository.findEventById(id);
    if (!event) throw new NotFoundError('Event not found');

    await redis.set(cacheKey, JSON.stringify(event), 'EX', CACHE_TTL);
    return event;
  }

  async getEventBySlug(slug: string) {
    const cacheKey = `${CACHE_PREFIX}slug:${slug}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const event = await this.repository.findEventBySlug(slug);
    if (!event) throw new NotFoundError('Event not found');

    await redis.set(cacheKey, JSON.stringify(event), 'EX', CACHE_TTL);
    return event;
  }

  async getAllEvents(query: EventQuery) {
    const cacheKey = `${CACHE_PREFIX}list:${crypto.createHash('md5').update(JSON.stringify(query)).digest('hex')}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await this.repository.findAllEvents(query);
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
    return result;
  }

  async updateEvent(id: string, organizerId: string, dto: UpdateEventDto) {
    const event = await this.repository.findEventById(id);
    if (!event) throw new NotFoundError('Event not found');
    if (event.organizerId !== organizerId) throw new ForbiddenError('Not your event');

    await this.bustCache(id, event.slug);
    return this.repository.updateEvent(id, dto);
  }

  async publishEvent(id: string, organizerId: string) {
    const event = await this.repository.findEventById(id);
    if (!event) throw new NotFoundError('Event not found');
    if (event.organizerId !== organizerId) throw new ForbiddenError('Not your event');
    if (!event.isFree && event.tiers.length === 0) {
      throw new BadRequestError('Event must have at least one ticket tier');
    }

    await this.bustCache(id, event.slug);
    return this.repository.updateEventStatus(id, EventStatus.PUBLISHED);
  }

  async cancelEvent(id: string, organizerId: string) {
    const event = await this.repository.findEventById(id);
    if (!event) throw new NotFoundError('Event not found');
    if (event.organizerId !== organizerId) throw new ForbiddenError('Not your event');

    await this.bustCache(id, event.slug);
    return this.repository.updateEventStatus(id, EventStatus.CANCELLED);
  }

  async deleteEvent(id: string, organizerId: string) {
    const event = await this.repository.findEventById(id);
    if (!event) throw new NotFoundError('Event not found');
    if (event.organizerId !== organizerId) throw new ForbiddenError('Not your event');

    await this.bustCache(id, event.slug);
    await this.repository.deleteEvent(id);
    return { message: 'Event deleted successfully' };
  }

  async createTicketTier(eventId: string, organizerId: string, dto: CreateTicketTierDto) {
    const event = await this.repository.findEventById(eventId);
    if (!event) throw new NotFoundError('Event not found');
    if (event.organizerId !== organizerId) throw new ForbiddenError('Not your event');

    await this.bustCache(eventId, event.slug);
    return this.repository.createTicketTier(eventId, dto);
  }

  async updateTicketTier(tierId: string, organizerId: string, dto: UpdateTicketTierDto) {
    const tier = await this.repository.findTierById(tierId);
    if (!tier) throw new NotFoundError('Ticket tier not found');

    const event = await this.repository.findEventById(tier.eventId);
    if (!event) throw new NotFoundError('Event not found');
    if (event.organizerId !== organizerId) throw new ForbiddenError('Not your event');

    if (dto.totalQuantity !== undefined && dto.totalQuantity < tier.soldQuantity) {
      throw new BadRequestError('Cannot reduce quantity below sold amount');
    }

    await this.bustCache(tier.eventId, event.slug);
    return this.repository.updateTicketTier(tierId, dto);
  }

  async deleteTicketTier(tierId: string, organizerId: string) {
    const tier = await this.repository.findTierById(tierId);
    if (!tier) throw new NotFoundError('Ticket tier not found');

    const event = await this.repository.findEventById(tier.eventId);
    if (!event) throw new NotFoundError('Event not found');
    if (event.organizerId !== organizerId) throw new ForbiddenError('Not your event');

    await this.bustCache(tier.eventId, event.slug);
    await this.repository.deleteTicketTier(tierId);
    return { message: 'Ticket tier deleted successfully' };
  }

  async getEventAvailability(eventId: string) {
    const cacheKey = `${CACHE_PREFIX}${eventId}:availability`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const event = await this.repository.findEventById(eventId);
    if (!event) throw new NotFoundError('Event not found');

    const availability = event.tiers.map((tier) => ({
      tierId: tier.id,
      name: tier.name,
      description: tier.description,
      price: tier.price,
      features: tier.features,
      available: tier.totalQuantity - tier.soldQuantity,
      totalQuantity: tier.totalQuantity,
      soldQuantity: tier.soldQuantity,
    }));

    await redis.set(cacheKey, JSON.stringify(availability), 'EX', 60);
    return availability;
  }

  async getShareLink(eventId: string) {
    const event = await this.repository.findEventById(eventId);
    if (!event) throw new NotFoundError('Event not found');
    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestError('Only published events can be shared');
    }

    const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';
    return {
      shareUrl: `${appUrl}/events/${event.slug}`,
      title: event.title,
      description: event.description,
      coverImageUrl: event.coverImageUrl,
    };
  }

  private generateSlug(title: string): string {
    return (
      title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
      '-' + Date.now()
    );
  }

  private async bustCache(eventId: string, slug: string): Promise<void> {
    await redis.del(`${CACHE_PREFIX}${eventId}`);
    await redis.del(`${CACHE_PREFIX}slug:${slug}`);
    await redis.del(`${CACHE_PREFIX}${eventId}:availability`);
    // PERF-2: Use SCAN instead of KEYS to avoid blocking Redis
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, found] = await redis.scan(cursor, 'MATCH', `${CACHE_PREFIX}list:*`, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...found);
    } while (cursor !== '0');
    if (keys.length > 0) await redis.del(...keys);
  }
}
