import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const isProduction = process.env['NODE_ENV'] === 'production';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL'],
  ...(isProduction && { ssl: { rejectUnauthorized: false } }),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const adminHash = await bcrypt.hash('Admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@eventful.com' },
    update: {},
    create: {
      email: 'admin@eventful.com',
      firstName: 'Admin',
      lastName: 'Eventful',
      passwordHash: adminHash,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  const orgHash = await bcrypt.hash('Organizer123!', 12);
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@eventful.com' },
    update: {},
    create: {
      email: 'organizer@eventful.com',
      firstName: 'John',
      lastName: 'Organizer',
      passwordHash: orgHash,
      role: 'ORGANIZER',
      isEmailVerified: true,
    },
  });

  const attHash = await bcrypt.hash('Attendee123!', 12);
  await prisma.user.upsert({
    where: { email: 'attendee@eventful.com' },
    update: {},
    create: {
      email: 'attendee@eventful.com',
      firstName: 'Jane',
      lastName: 'Attendee',
      passwordHash: attHash,
      role: 'ATTENDEE',
      isEmailVerified: true,
    },
  });

  const event1 = await prisma.event.upsert({
    where: { slug: 'lagos-tech-summit-2026' },
    update: {},
    create: {
      organizerId: organizer.id,
      title: 'Lagos Tech Summit 2026',
      slug: 'lagos-tech-summit-2026',
      description: 'The biggest tech event in West Africa.',
      venue: 'Eko Hotel & Suites, Lagos',
      timezone: 'Africa/Lagos',
      startDate: new Date('2026-08-15T09:00:00.000Z'),
      endDate: new Date('2026-08-15T18:00:00.000Z'),
      status: 'PUBLISHED',
      category: 'BUSINESS',
      isFree: false,
    },
  });

  await prisma.ticketTier.createMany({
    skipDuplicates: true,
    data: [
      { eventId: event1.id, name: 'Regular', price: 5000, totalQuantity: 200 },
      { eventId: event1.id, name: 'VIP', price: 15000, totalQuantity: 50, features: ['Front row', 'Free lunch'] },
    ],
  });

  const event2 = await prisma.event.upsert({
    where: { slug: 'afrobeats-night-2026' },
    update: {},
    create: {
      organizerId: organizer.id,
      title: 'Afrobeats Night 2026',
      slug: 'afrobeats-night-2026',
      description: 'A night of non-stop Afrobeats music.',
      venue: 'Tafawa Balewa Square, Lagos',
      timezone: 'Africa/Lagos',
      startDate: new Date('2026-09-20T18:00:00.000Z'),
      endDate: new Date('2026-09-20T23:00:00.000Z'),
      status: 'PUBLISHED',
      category: 'MUSIC',
      isFree: false,
    },
  });

  await prisma.ticketTier.createMany({
    skipDuplicates: true,
    data: [
      { eventId: event2.id, name: 'General', price: 3000, totalQuantity: 500 },
      { eventId: event2.id, name: 'VIP', price: 10000, totalQuantity: 100, features: ['VIP lounge', 'Free drinks'] },
    ],
  });

  const event3 = await prisma.event.upsert({
    where: { slug: 'abuja-startup-meetup-2026' },
    update: {},
    create: {
      organizerId: organizer.id,
      title: 'Abuja Startup Meetup',
      slug: 'abuja-startup-meetup-2026',
      description: 'Free networking event for startup founders.',
      venue: 'Co-Creation Hub, Abuja',
      timezone: 'Africa/Lagos',
      startDate: new Date('2026-10-01T10:00:00.000Z'),
      endDate: new Date('2026-10-01T14:00:00.000Z'),
      status: 'PUBLISHED',
      category: 'BUSINESS',
      isFree: true,
    },
  });

  await prisma.ticketTier.createMany({
    skipDuplicates: true,
    data: [
      { eventId: event3.id, name: 'Free Entry', price: 0, totalQuantity: 100 },
    ],
  });

  console.log('✅ Seed completed successfully');
  console.log('Demo accounts:');
  console.log('  Admin:     admin@eventful.com / Admin123!');
  console.log('  Organizer: organizer@eventful.com / Organizer123!');
  console.log('  Attendee:  attendee@eventful.com / Attendee123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
