import app from './app';
import { env } from '@/config';
import { logger } from '@/shared/utils/logger';
import '@/queues/workers/notification.worker';
import prisma from '@/config/database.config';
import redis from '@/config/redis.config';

const PORT = Number(env.PORT) || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
