import QRCode from 'qrcode';
import prisma from '@/config/database.config';
import redis from '@/config/redis.config';
import { NotFoundError, BadRequestError, ForbiddenError } from '@/shared/errors/HttpError';
import { logger } from '@/shared/utils/logger';

export class QRService {
  async generateQRImage(ticketId: string, userId: string): Promise<string> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        order: true,
        tier: {
          include: { event: true },
        },
      },
    });

    if (!ticket) throw new NotFoundError('Ticket not found');
    if (ticket.order.userId !== userId) throw new ForbiddenError('Not your ticket');

    const payload = JSON.stringify({
      ticketId: ticket.id,
      qrCodeHash: ticket.qrCodeHash,
      eventId: ticket.tier.event.id,
    });

    const qrImage = await QRCode.toDataURL(payload);
    return qrImage;
  }

  async validateQR(qrCodeHash: string, organizerId: string): Promise<{ message: string; ticketId: string }> {
    // Check Redis cache first
    const cachedUsed = await redis.get(`ticket:used:${qrCodeHash}`);
    if (cachedUsed) throw new BadRequestError('Ticket has already been used');

    // SEC-3: Atomic update — only succeeds if isUsed is currently false
    // This prevents TOCTOU race condition on double scan
    const ticket = await prisma.ticket.findUnique({
      where: { qrCodeHash },
      include: {
        tier: { include: { event: true } },
      },
    });

    if (!ticket) throw new NotFoundError('Invalid QR code');

    if (ticket.tier.event.organizerId !== organizerId) {
      throw new ForbiddenError('Not your event');
    }

    if (ticket.isUsed) {
      await redis.set(`ticket:used:${qrCodeHash}`, '1', 'EX', 86400);
      throw new BadRequestError('Ticket has already been used');
    }

    // Atomic update with where clause — only updates if isUsed is still false
    const updated = await prisma.ticket.updateMany({
      where: { id: ticket.id, isUsed: false },
      data: { isUsed: true, usedAt: new Date() },
    });

    // If count is 0 another scanner got there first
    if (updated.count === 0) {
      await redis.set(`ticket:used:${qrCodeHash}`, '1', 'EX', 86400);
      throw new BadRequestError('Ticket has already been used');
    }

    await redis.set(`ticket:used:${qrCodeHash}`, '1', 'EX', 86400);

    logger.info({ message: 'Ticket validated', ticketId: ticket.id, eventId: ticket.tier.event.id });

    return { message: 'Ticket validated successfully', ticketId: ticket.id };
  }

  async getTicketsByOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tickets: {
          include: {
            tier: { include: { event: true } },
          },
        },
      },
    });

    if (!order) throw new NotFoundError('Order not found');
    if (order.userId !== userId) throw new ForbiddenError('Not your order');

    return order.tickets;
  }

}
