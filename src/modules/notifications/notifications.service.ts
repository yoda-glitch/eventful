import { notificationQueue, reminderQueue } from '@/queues';
import { NotificationJobType } from './notifications.types';

export class NotificationsService {
  async sendTicketConfirmation(data: {
    to: string;
    firstName: string;
    eventTitle: string;
    eventDate: string;
    venue: string;
    tickets: { ticketId: string; qrCodeHash: string }[];
  }): Promise<void> {
    await notificationQueue.add(
      NotificationJobType.TICKET_CONFIRMATION,
      { type: NotificationJobType.TICKET_CONFIRMATION, ...data },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    );
  }

  async sendPaymentReceipt(data: {
    to: string;
    firstName: string;
    eventTitle: string;
    amount: number;
    reference: string;
  }): Promise<void> {
    await notificationQueue.add(
      NotificationJobType.PAYMENT_RECEIPT,
      { type: NotificationJobType.PAYMENT_RECEIPT, ...data },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    );
  }

  async sendEmailVerification(data: {
    to: string;
    firstName: string;
    verifyToken: string;
  }): Promise<void> {
    await notificationQueue.add(
      NotificationJobType.EMAIL_VERIFICATION,
      { type: NotificationJobType.EMAIL_VERIFICATION, ...data },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    );
  }

  async sendPasswordReset(data: {
    to: string;
    firstName: string;
    resetToken: string;
  }): Promise<void> {
    await notificationQueue.add(
      NotificationJobType.PASSWORD_RESET,
      { type: NotificationJobType.PASSWORD_RESET, ...data },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    );
  }

  async scheduleEventReminder(data: {
    to: string;
    firstName: string;
    eventTitle: string;
    eventDate: string;
    venue: string;
    delayMs: number;
  }): Promise<void> {
    await reminderQueue.add(
      NotificationJobType.EVENT_REMINDER,
      { type: NotificationJobType.EVENT_REMINDER, ...data },
      {
        delay: data.delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    );
  }

  async sendEventCancellation(data: {
    to: string;
    firstName: string;
    eventTitle: string;
  }): Promise<void> {
    await notificationQueue.add(
      NotificationJobType.EVENT_CANCELLATION,
      { type: NotificationJobType.EVENT_CANCELLATION, ...data },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    );
  }
}
