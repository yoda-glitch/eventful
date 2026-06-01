export enum NotificationJobType {
  TICKET_CONFIRMATION = 'ticket_confirmation',
  PAYMENT_RECEIPT = 'payment_receipt',
  EVENT_REMINDER = 'event_reminder',
  EVENT_CANCELLATION = 'event_cancellation',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
}

export interface TicketConfirmationJob {
  type: NotificationJobType.TICKET_CONFIRMATION;
  to: string;
  firstName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  tickets: { ticketId: string; qrCodeHash: string }[];
}

export interface PaymentReceiptJob {
  type: NotificationJobType.PAYMENT_RECEIPT;
  to: string;
  firstName: string;
  eventTitle: string;
  amount: number;
  reference: string;
}

export interface EventReminderJob {
  type: NotificationJobType.EVENT_REMINDER;
  to: string;
  firstName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
}

export interface EventCancellationJob {
  type: NotificationJobType.EVENT_CANCELLATION;
  to: string;
  firstName: string;
  eventTitle: string;
}

export interface PasswordResetJob {
  type: NotificationJobType.PASSWORD_RESET;
  to: string;
  firstName: string;
  resetToken: string;
}

export interface EmailVerificationJob {
  type: NotificationJobType.EMAIL_VERIFICATION;
  to: string;
  firstName: string;
  verifyToken: string;
}

export type NotificationJob =
  | TicketConfirmationJob
  | PaymentReceiptJob
  | EventReminderJob
  | EventCancellationJob
  | PasswordResetJob
  | EmailVerificationJob;

export interface SetReminderDto {
  eventId: string;
  minutesBefore: number;
}
