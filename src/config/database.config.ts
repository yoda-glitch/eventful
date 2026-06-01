import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { logger } from '@/shared/utils/logger';
import { env } from './env.validation';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

prisma.$connect()
  .then(() => logger.info('Database connected'))
  .catch((err: Error) => logger.error({ message: 'Database connection failed', error: err.message }));

export default prisma;
