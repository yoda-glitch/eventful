import { Router } from 'express';
import {
  setReminder,
  getUserReminders,
  deleteReminder,
  setCreatorReminders,
} from './notifications.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { setReminderSchema } from './notifications.schema';
import { z } from 'zod';

const creatorReminderSchema = z.object({
  minutesBefore: z.array(z.number().int().min(5).max(10080)).min(1).max(5),
});

const router = Router();

/**
 * @swagger
 * /notifications/reminders:
 *   post:
 *     summary: Set a personal reminder for an event
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, minutesBefore]
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *               minutesBefore:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 10080
 *                 example: 1440
 *                 description: Minutes before event to send reminder (5 min to 7 days)
 *     responses:
 *       201:
 *         description: Reminder set successfully
 *       400:
 *         description: Reminder time has already passed
 */
router.post('/reminders', authenticate, validate(setReminderSchema), setReminder);

/**
 * @swagger
 * /notifications/reminders:
 *   get:
 *     summary: Get all personal reminders for the authenticated user
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: List of reminders
 */
router.get('/reminders', authenticate, getUserReminders);

/**
 * @swagger
 * /notifications/reminders/{reminderId}:
 *   delete:
 *     summary: Delete a personal reminder
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: reminderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reminder deleted
 */
router.delete('/reminders/:reminderId', authenticate, deleteReminder);

/**
 * @swagger
 * /notifications/events/{eventId}/reminders:
 *   post:
 *     summary: Set reminders for all eventees (Creator only)
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [minutesBefore]
 *             properties:
 *               minutesBefore:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [10080, 1440, 60]
 *                 description: Array of minutes before event (e.g. 10080=1week, 1440=1day, 60=1hour)
 *     responses:
 *       200:
 *         description: Reminders configured for eventees
 */
router.post('/events/:eventId/reminders', authenticate, validate(creatorReminderSchema), setCreatorReminders);

export default router;
