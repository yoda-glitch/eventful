export const QUEUE_NAMES = {
  NOTIFICATION: 'notification',
  REMINDER: 'reminder',
} as const;

// Dead letter queue names
export const DLQ_NAMES = {
  NOTIFICATION_DLQ: 'notification-dlq',
} as const;
