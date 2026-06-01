import { Router } from 'express';
import {
  createEvent,
  getEventById,
  getEventBySlug,
  getAllEvents,
  updateEvent,
  publishEvent,
  cancelEvent,
  deleteEvent,
  createTicketTier,
  updateTicketTier,
  deleteTicketTier,
  getEventAvailability,
  getShareLink,
} from './events.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import {
  createEventSchema,
  updateEventSchema,
  createTicketTierSchema,
  updateTicketTierSchema,
} from './events.schema';

const router = Router();

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all published events
 *     tags: [Events]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [MUSIC, NIGHTLIFE, BUSINESS, CONFERENCE, CONCERT, OTHER]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, CANCELLED, COMPLETED]
 *     responses:
 *       200:
 *         description: List of events with total count
 */
router.get('/', getAllEvents);

/**
 * @swagger
 * /events/slug/{slug}:
 *   get:
 *     summary: Get event by slug
 *     tags: [Events]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/slug/:slug', getEventBySlug);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/:id', getEventById);

/**
 * @swagger
 * /events/{id}/availability:
 *   get:
 *     summary: Get ticket availability for an event
 *     tags: [Events]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ticket tier availability
 */
router.get('/:id/availability', getEventAvailability);

/**
 * @swagger
 * /events/{id}/share:
 *   get:
 *     summary: Get shareable link for a published event
 *     tags: [Events]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Share link and event metadata
 *       400:
 *         description: Event is not published
 */
router.get('/:id/share', getShareLink);

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, venue, startDate, endDate]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Lagos Tech Summit 2026
 *               description:
 *                 type: string
 *               venue:
 *                 type: string
 *                 example: Eko Hotel, Lagos
 *               timezone:
 *                 type: string
 *                 example: Africa/Lagos
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               category:
 *                 type: string
 *                 enum: [MUSIC, NIGHTLIFE, BUSINESS, CONFERENCE, CONCERT, OTHER]
 *               coverImageUrl:
 *                 type: string
 *               isFree:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Event created successfully
 */
router.post('/', authenticate, validate(createEventSchema), createEvent);

/**
 * @swagger
 * /events/{id}:
 *   patch:
 *     summary: Update an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               venue:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated
 *       403:
 *         description: Not your event
 */
router.patch('/:id', authenticate, validate(updateEventSchema), updateEvent);

/**
 * @swagger
 * /events/{id}/publish:
 *   patch:
 *     summary: Publish an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event published
 *       400:
 *         description: Event must have at least one ticket tier
 */
router.patch('/:id/publish', authenticate, publishEvent);

/**
 * @swagger
 * /events/{id}/cancel:
 *   patch:
 *     summary: Cancel an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event cancelled
 */
router.patch('/:id/cancel', authenticate, cancelEvent);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event deleted
 */
router.delete('/:id', authenticate, deleteEvent);

/**
 * @swagger
 * /events/{id}/tiers:
 *   post:
 *     summary: Create a ticket tier for an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
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
 *             required: [name, price, totalQuantity]
 *             properties:
 *               name:
 *                 type: string
 *                 example: VIP
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 example: 5000
 *               totalQuantity:
 *                 type: integer
 *                 example: 100
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Free drinks", "Front row access"]
 *     responses:
 *       201:
 *         description: Ticket tier created
 */
router.post('/:id/tiers', authenticate, validate(createTicketTierSchema), createTicketTier);

/**
 * @swagger
 * /events/{id}/tiers/{tierId}:
 *   patch:
 *     summary: Update a ticket tier
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ticket tier updated
 *   delete:
 *     summary: Delete a ticket tier
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ticket tier deleted
 */
router.patch('/:id/tiers/:tierId', authenticate, validate(updateTicketTierSchema), updateTicketTier);
router.delete('/:id/tiers/:tierId', authenticate, deleteTicketTier);

export default router;
