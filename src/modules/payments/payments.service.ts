import crypto from 'crypto';
import { PaymentsRepository } from './payments.repository';
import { EventsRepository } from '@/modules/events/events.repository';
import { paystackClient } from './paystack.client';
import { InitiateOrderDto, PaystackWebhookEvent } from './payments.types';
import { BadRequestError, NotFoundError } from '@/shared/errors/HttpError';
import { OrderStatus, PaymentStatus } from '../../generated/prisma/client';
import redis from '@/config/redis.config';
import { logger } from '@/shared/utils/logger';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import prisma from '@/config/database.config';
import { generateTicketBatch } from '@/shared/utils/ticket.utils';

const LOCK_TTL = 30;

export class PaymentsService {
  private repository: PaymentsRepository;
  private eventsRepository: EventsRepository;
  private notificationsService: NotificationsService;

  constructor() {
    this.repository = new PaymentsRepository();
    this.eventsRepository = new EventsRepository();
    this.notificationsService = new NotificationsService();
  }

  async initiateOrder(userId: string, userEmail: string, dto: InitiateOrderDto) {
    const tier = await this.eventsRepository.findTierById(dto.tierId);
    if (!tier) throw new NotFoundError('Ticket tier not found');

    const event = await this.eventsRepository.findEventById(tier.eventId);
    if (!event) throw new NotFoundError('Event not found');

    const available = tier.totalQuantity - tier.soldQuantity;
    if (available < dto.quantity) {
      throw new BadRequestError(`Only ${available} tickets available`);
    }

    if (event.isFree) {
      return this.processFreeOrder(userId, userEmail, dto, event);
    }

    const lockKey = `lock:tier:${dto.tierId}`;
    const lockValue = crypto.randomUUID();
    const acquired = await redis.set(lockKey, lockValue, 'EX', LOCK_TTL, 'NX');
    if (!acquired) throw new BadRequestError('Another purchase is in progress, please try again');

    try {
      const totalAmount = Number(tier.price) * dto.quantity;
      const reference = `EVT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      const order = await this.repository.createOrder({ userId, totalAmount });

      await this.repository.createPayment({
        orderId: order.id,
        reference,
        metadata: { tierId: dto.tierId, quantity: dto.quantity },
      });

      const paystackResponse = await paystackClient.initializeTransaction({
        email: userEmail,
        amount: totalAmount,
        reference,
        metadata: { orderId: order.id, tierId: dto.tierId, quantity: dto.quantity },
      });

      return {
        orderId: order.id,
        reference,
        authorizationUrl: paystackResponse.data.authorization_url,
        accessCode: paystackResponse.data.access_code,
      };
    } finally {
      const currentLock = await redis.get(lockKey);
      if (currentLock === lockValue) await redis.del(lockKey);
    }
  }

  private async processFreeOrder(
    userId: string,
    userEmail: string,
    dto: InitiateOrderDto,
    event: { id: string; title: string; startDate: Date; venue: string; organizerId: string }
  ) {
    const lockKey = `lock:tier:${dto.tierId}`;
    const lockValue = crypto.randomUUID();
    const acquired = await redis.set(lockKey, lockValue, 'EX', LOCK_TTL, 'NX');
    if (!acquired) throw new BadRequestError('Another registration is in progress, please try again');

    try {
      const reference = `FREE-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      const { order, tickets } = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: { userId, totalAmount: 0 },
        });

        await tx.payment.create({
          data: {
            orderId: order.id,
            reference,
            status: PaymentStatus.SUCCESS,
            paidAt: new Date(),
            metadata: { tierId: dto.tierId, quantity: dto.quantity, isFree: true },
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.COMPLETED },
        });

        await tx.ticketTier.update({
          where: { id: dto.tierId },
          data: { soldQuantity: { increment: dto.quantity } },
        });

        // ARCH-3: Use shared ticket generation utility
        const ticketData = generateTicketBatch(order.id, dto.tierId, dto.quantity);
        await tx.ticket.createMany({ data: ticketData });

        return { order, tickets: ticketData };
      });

      await redis.del(`event:${event.id}:availability`);

      const user = await prisma.user.findUnique({ where: { id: userId } });

      await this.notificationsService.sendTicketConfirmation({
        to: userEmail,
        firstName: user?.firstName ?? 'Guest',
        eventTitle: event.title,
        eventDate: event.startDate.toISOString(),
        venue: event.venue,
        tickets: tickets.map((t) => ({ ticketId: t.orderId, qrCodeHash: t.qrCodeHash })),
      });

      logger.info({ message: 'Free order processed', orderId: order.id });

      return {
        orderId: order.id,
        reference,
        isFree: true,
        message: 'Free tickets issued successfully',
      };
    } finally {
      const currentLock = await redis.get(lockKey);
      if (currentLock === lockValue) await redis.del(lockKey);
    }
  }

  async handleWebhook(event: PaystackWebhookEvent) {
    const { reference } = event.data;

    const lockKey = `lock:webhook:${reference}`;
    const lockValue = crypto.randomUUID();
    const acquired = await redis.set(lockKey, lockValue, 'EX', 60, 'NX');
    if (!acquired) {
      logger.info({ message: 'Webhook already being processed', reference });
      return;
    }

    try {
      const existingPayment = await this.repository.findPaymentByReference(reference);
      if (!existingPayment) {
        logger.warn({ message: 'Webhook received for unknown reference', reference });
        return;
      }

      if (existingPayment.status === PaymentStatus.SUCCESS) {
        logger.info({ message: 'Duplicate webhook ignored', reference });
        return;
      }

      if (event.event === 'charge.success') {
        await this.processSuccessfulPayment(reference);
      } else if (event.event === 'charge.failed') {
        await this.processFailedPayment(reference);
      }
    } finally {
      const currentLock = await redis.get(lockKey);
      if (currentLock === lockValue) await redis.del(lockKey);
    }
  }

  private async processSuccessfulPayment(reference: string) {
    const payment = await this.repository.findPaymentByReference(reference);
    if (!payment) return;

    const metadata = payment.metadata as Record<string, unknown>;
    const tierId = metadata['tierId'] as string;
    const quantity = metadata['quantity'] as number;

    // ARCH-3: Use shared ticket generation utility
    const tickets = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { reference },
        data: { status: PaymentStatus.SUCCESS, paidAt: new Date() },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.COMPLETED },
      });

      await tx.ticketTier.update({
        where: { id: tierId },
        data: { soldQuantity: { increment: quantity } },
      });

      const ticketData = generateTicketBatch(payment.orderId, tierId, quantity);
      await tx.ticket.createMany({ data: ticketData });
      return ticketData;
    });

    const tier = await this.eventsRepository.findTierById(tierId);
    if (tier) await redis.del(`event:${tier.eventId}:availability`);

    const order = await prisma.order.findUnique({
      where: { id: payment.orderId },
      include: {
        user: true,
        tickets: {
          include: { tier: { include: { event: true } } },
        },
      },
    });

    if (order) {
      const event = order.tickets[0]?.tier.event;

      await this.notificationsService.sendPaymentReceipt({
        to: order.user.email,
        firstName: order.user.firstName,
        eventTitle: event?.title ?? 'Event',
        amount: Number(order.totalAmount),
        reference,
      });

      await this.notificationsService.sendTicketConfirmation({
        to: order.user.email,
        firstName: order.user.firstName,
        eventTitle: event?.title ?? 'Event',
        eventDate: event?.startDate.toISOString() ?? '',
        venue: event?.venue ?? '',
        tickets: tickets.map((t) => ({ ticketId: t.orderId, qrCodeHash: t.qrCodeHash })),
      });

      if (event) {
        const eventStart = new Date(event.startDate).getTime();
        const now = Date.now();
        const delay24hr = eventStart - now - 24 * 60 * 60 * 1000;
        const delay1hr = eventStart - now - 60 * 60 * 1000;

        if (delay24hr > 0) {
          await this.notificationsService.scheduleEventReminder({
            to: order.user.email,
            firstName: order.user.firstName,
            eventTitle: event.title,
            eventDate: event.startDate.toISOString(),
            venue: event.venue,
            delayMs: delay24hr,
          });
        }

        if (delay1hr > 0) {
          await this.notificationsService.scheduleEventReminder({
            to: order.user.email,
            firstName: order.user.firstName,
            eventTitle: event.title,
            eventDate: event.startDate.toISOString(),
            venue: event.venue,
            delayMs: delay1hr,
          });
        }
      }
    }

    logger.info({ message: 'Payment processed successfully', reference, orderId: payment.orderId });
  }

  private async processFailedPayment(reference: string) {
    const payment = await this.repository.findPaymentByReference(reference);
    if (!payment) return;

    await this.repository.updatePaymentStatus(reference, PaymentStatus.FAILED);
    await this.repository.updateOrderStatus(payment.orderId, OrderStatus.FAILED);

    logger.warn({ message: 'Payment failed', reference, orderId: payment.orderId });
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.repository.findOrderById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.userId !== userId) throw new BadRequestError('Not your order');
    return order;
  }

  async getUserOrders(userId: string) {
    return this.repository.findOrdersByUserId(userId);
  }

  async verifyPayment(reference: string) {
    const response = await paystackClient.verifyTransaction(reference);
    return response.data;
  }
}
