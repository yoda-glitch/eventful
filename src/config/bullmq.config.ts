import { Queue, Worker, QueueOptions } from 'bullmq';
import { env } from './env.validation';

const redisUrl = new URL(env.REDIS_URL);
const isTLS = env.REDIS_URL.startsWith('rediss://');

const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  tls: isTLS ? { rejectUnauthorized: false } : undefined,
};

export const queueOptions: QueueOptions = { connection };

export { Queue, Worker, connection };
