import { Router } from 'express';
import {
  getEventAnalytics,
  getEventPayments,
  getOrganizerDashboard,
  getPlatformAnalytics,
} from './analytics.controller';
import { authenticate, authorize } from '@/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get organizer dashboard — all events with revenue and attendance
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Dashboard data for all organizer events
 */
router.get('/dashboard', authenticate, getOrganizerDashboard);

/**
 * @swagger
 * /analytics/events/{eventId}:
 *   get:
 *     summary: Get detailed analytics for a specific event
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event analytics including revenue, tickets, attendance rate
 *       403:
 *         description: Not your event
 */
router.get('/events/:eventId', authenticate, getEventAnalytics);

/**
 * @swagger
 * /analytics/events/{eventId}/payments:
 *   get:
 *     summary: Get payment details for a specific event
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of payments with buyer details
 */
router.get('/events/:eventId/payments', authenticate, getEventPayments);

/**
 * @swagger
 * /analytics/platform:
 *   get:
 *     summary: Get platform-wide analytics (Admin only)
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Platform analytics
 *       403:
 *         description: Admin access required
 */
router.get('/platform', authenticate, authorize('ADMIN'), getPlatformAnalytics);

export default router;
