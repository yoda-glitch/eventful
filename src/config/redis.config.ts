import Redis from 'ioredis';
import { logger } from '@/shared/utils/logger';
import { env } from './env.validation';

const redisUrl = env.REDIS_URL;
const isTLS = redisUrl.startsWith('rediss://');

const redis = new Redis(redisUrl, {
  tls: isTLS ? { rejectUnauthorized: false } : undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err: Error) => logger.error({ message: 'Redis error', error: err.message }));

export default redis;
