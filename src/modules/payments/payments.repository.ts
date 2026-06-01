import prisma from '@/config/database.config';
import { Order, Payment, Ticket, OrderStatus, PaymentStatus } from '../../generated/prisma/client';
import { Prisma } from '../../generated/prisma/client';

export class PaymentsRepository {
  async createOrder(data: {
    userId: string;
    totalAmount: number;
  }): Promise<Order> {
    return prisma.order.create({ data });
  }

  async findOrderById(id: string): Promise<Order & { payment: Payment | null; tickets: Ticket[] } | null> {
    return prisma.order.findUnique({
      where: { id },
      include: { payment: true, tickets: true },
    });
  }

  async findOrdersByUserId(userId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { userId },
      include: { payment: true, tickets: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async createPayment(data: {
    orderId: string;
    reference: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<Payment> {
    return prisma.payment.create({ data });
  }

  async findPaymentByReference(reference: string): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { reference } });
  }

  async updatePaymentStatus(
    reference: string,
    status: PaymentStatus,
    paidAt?: Date
  ): Promise<Payment> {
    return prisma.payment.update({
      where: { reference },
      data: { status, paidAt },
    });
  }

  async createTickets(
    tickets: { orderId: string; tierId: string; qrCodeHash: string }[]
  ): Promise<void> {
    await prisma.ticket.createMany({ data: tickets });
  }

  async incrementTierSoldQuantity(tierId: string, quantity: number): Promise<void> {
    await prisma.ticketTier.update({
      where: { id: tierId },
      data: { soldQuantity: { increment: quantity } },
    });
  }

  async decrementTierSoldQuantity(tierId: string, quantity: number): Promise<void> {
    await prisma.ticketTier.update({
      where: { id: tierId },
      data: { soldQuantity: { decrement: quantity } },
    });
  }

  async findTicketsByOrderId(orderId: string): Promise<Ticket[]> {
    return prisma.ticket.findMany({ where: { orderId } });
  }
}
