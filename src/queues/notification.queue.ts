import { Queue } from 'bullmq';
import { queueOptions } from '@/config/bullmq.config';
import { QUEUE_NAMES } from '@/shared/constants/queue-names';

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, queueOptions);
