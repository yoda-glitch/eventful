import { Queue, Worker, QueueOptions } from 'bullmq';
import { env } from './env.validation';

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: Number(new URL(env.REDIS_URL).port) || 6379,
};

export const queueOptions: QueueOptions = { connection };

export { Queue, Worker, connection };
