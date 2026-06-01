import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { logger } from '@/shared/utils/logger';
import { env } from './env.validation';

const connectionString = env.DATABASE_URL;

const adapter = new PrismaPg({
  connectionString,
  ...(env.NODE_ENV === 'production' && {
    ssl: { rejectUnauthorized: false },
  }),
});

const prisma = new PrismaClient({ adapter });

prisma.$connect()
  .then(() => logger.info('Database connected'))
  .catch((err: Error) => logger.error({ message: 'Database connection failed', error: err.message }));

export default prisma;
