import prisma from '@/config/database.config';
import { NotificationsService } from './notifications.service';
import { NotFoundError, BadRequestError } from '@/shared/errors/HttpError';
import { SetReminderDto } from './notifications.types';

const notificationsService = new NotificationsService();

export class ReminderService {
  async setPersonalReminder(userId: string, dto: SetReminderDto) {
    const event = await prisma.event.findUnique({ where: { id: dto.eventId } });
    if (!event) throw new NotFoundError('Event not found');

    const reminderAt = new Date(event.startDate.getTime() - dto.minutesBefore * 60 * 1000);

    if (reminderAt <= new Date()) {
      throw new BadRequestError('Reminder time has already passed');
    }

    // Upsert — one reminder per user per event
    await prisma.eventReminder.upsert({
      where: {
        // Use a compound approach since we don't have @@unique
        id: (await prisma.eventReminder.findFirst({
          where: { eventId: dto.eventId, userId },
          select: { id: true },
        }))?.id ?? 'new',
      },
      update: { reminderAt, sent: false },
      create: { eventId: dto.eventId, userId, reminderAt },
    });

    // Schedule the BullMQ job
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const delayMs = reminderAt.getTime() - Date.now();
      await notificationsService.scheduleEventReminder({
        to: user.email,
        firstName: user.firstName,
        eventTitle: event.title,
        eventDate: event.startDate.toISOString(),
        venue: event.venue,
        delayMs,
      });
    }

    return {
      message: `Reminder set for ${dto.minutesBefore} minutes before the event`,
      reminderAt,
    };
  }

  async getUserReminders(userId: string) {
    return prisma.eventReminder.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { reminderAt: 'asc' },
    });
  }

  async deleteReminder(reminderId: string, userId: string) {
    const reminder = await prisma.eventReminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) throw new NotFoundError('Reminder not found');
    if (reminder.userId !== userId) throw new BadRequestError('Not your reminder');

    await prisma.eventReminder.delete({ where: { id: reminderId } });
    return { message: 'Reminder deleted successfully' };
  }

  async setCreatorReminders(organizerId: string, eventId: string, minutesBefore: number[]) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundError('Event not found');
    if (event.organizerId !== organizerId) throw new BadRequestError('Not your event');

    const results = [];

    for (const minutes of minutesBefore) {
      const reminderAt = new Date(event.startDate.getTime() - minutes * 60 * 1000);
      if (reminderAt <= new Date()) continue;

      results.push({
        minutesBefore: minutes,
        reminderAt,
        scheduledAt: new Date(),
      });
    }

    return {
      message: `${results.length} reminder(s) configured for your eventees`,
      reminders: results,
    };
  }
}
