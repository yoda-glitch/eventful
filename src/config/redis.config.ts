import Redis from 'ioredis';
import { logger } from '@/shared/utils/logger';
import { env } from './env.validation';

const redis = new Redis(env.REDIS_URL, {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err: Error) => logger.error({ message: 'Redis error', error: err.message }));

export default redis;
