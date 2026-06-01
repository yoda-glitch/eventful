import prisma from '@/config/database.config';
import { User } from '../../generated/prisma/client';

export class UsersRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async updateProfile(id: string, data: { firstName?: string; lastName?: string }): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  async clearRefreshToken(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { refreshToken: null } });
  }

  async getUserEvents(id: string) {
    return prisma.event.findMany({
      where: { organizerId: id },
      include: { tiers: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserTickets(id: string) {
    return prisma.order.findMany({
      where: { userId: id },
      include: {
        tickets: {
          include: {
            tier: { include: { event: true } },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
