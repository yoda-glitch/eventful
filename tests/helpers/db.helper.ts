import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL'],
});

export const testPrisma = new PrismaClient({ adapter });

export const cleanDatabase = async () => {
  await testPrisma.eventReminder.deleteMany();
  await testPrisma.ticket.deleteMany();
  await testPrisma.payment.deleteMany();
  await testPrisma.order.deleteMany();
  await testPrisma.ticketTier.deleteMany();
  await testPrisma.event.deleteMany();
  await testPrisma.user.deleteMany();
};
