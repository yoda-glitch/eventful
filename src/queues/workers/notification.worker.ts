import { Worker, Job, Queue } from 'bullmq';
import { connection } from '@/config/bullmq.config';
import { QUEUE_NAMES, DLQ_NAMES } from '@/shared/constants/queue-names';
import { NotificationJob, NotificationJobType } from '@/modules/notifications/notifications.types';
import { sendEmail } from '@/modules/notifications/channels/email.channel';
import { ticketConfirmationTemplate } from '@/modules/notifications/templates/ticket-confirmation';
import { paymentReceiptTemplate } from '@/modules/notifications/templates/payment-receipt';
import { eventReminderTemplate } from '@/modules/notifications/templates/event-reminder';
import { emailVerificationTemplate } from '@/modules/notifications/templates/email-verification';
import { passwordResetTemplate } from '@/modules/notifications/templates/password-reset';
import { logger } from '@/shared/utils/logger';

// Dead letter queue
const notificationDLQ = new Queue(DLQ_NAMES.NOTIFICATION_DLQ, { connection });

const processJob = async (job: Job<NotificationJob>): Promise<void> => {
  const data = job.data;

  switch (data.type) {
    case NotificationJobType.TICKET_CONFIRMATION: {
      const template = ticketConfirmationTemplate(data);
      await sendEmail({ to: data.to, ...template });
      break;
    }
    case NotificationJobType.PAYMENT_RECEIPT: {
      const template = paymentReceiptTemplate(data);
      await sendEmail({ to: data.to, ...template });
      break;
    }
    case NotificationJobType.EVENT_REMINDER: {
      const template = eventReminderTemplate(data);
      await sendEmail({ to: data.to, ...template });
      break;
    }
    case NotificationJobType.EMAIL_VERIFICATION: {
      const template = emailVerificationTemplate(data);
      await sendEmail({ to: data.to, ...template });
      break;
    }
    case NotificationJobType.PASSWORD_RESET: {
      const template = passwordResetTemplate(data);
      await sendEmail({ to: data.to, ...template });
      break;
    }
    case NotificationJobType.EVENT_CANCELLATION: {
      await sendEmail({
        to: data.to,
        subject: `Event Cancelled: ${data.eventTitle}`,
        html: `<h2>Hi ${data.firstName},</h2><p>Unfortunately, <strong>${data.eventTitle}</strong> has been cancelled.</p>`,
      });
      break;
    }
    default: {
      logger.warn({ message: 'Unknown job type', job: job.name });
    }
  }

  logger.info({ message: 'Notification sent', type: data.type, to: data.to });
};

const workerOptions = {
  connection,
  concurrency: 5,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

export const notificationWorker = new Worker(
  QUEUE_NAMES.NOTIFICATION,
  processJob,
  workerOptions
);

notificationWorker.on('failed', async (job, err) => {
  logger.error({
    message: 'Notification job failed',
    job: job?.name,
    jobId: job?.id,
    attempts: job?.attemptsMade,
    error: err.message,
  });

  // Move to DLQ if all retries exhausted
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    logger.error({ message: 'Job permanently failed — moving to DLQ', jobId: job.id });
    await notificationDLQ.add('dead-letter', {
      originalJob: job.data,
      error: err.message,
      failedAt: new Date(),
    });
  }
});

notificationWorker.on('stalled', (jobId) => {
  logger.warn({ message: 'Notification job stalled', jobId });
});

export const reminderWorker = new Worker(
  QUEUE_NAMES.REMINDER,
  processJob,
  { ...workerOptions, concurrency: 2 }
);

reminderWorker.on('failed', async (job, err) => {
  logger.error({
    message: 'Reminder job failed',
    job: job?.name,
    jobId: job?.id,
    attempts: job?.attemptsMade,
    error: err.message,
  });

  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    logger.error({ message: 'Reminder job permanently failed — moving to DLQ', jobId: job.id });
    await notificationDLQ.add('dead-letter', {
      originalJob: job.data,
      error: err.message,
      failedAt: new Date(),
    });
  }
});
