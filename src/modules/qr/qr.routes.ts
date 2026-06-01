import { Router } from 'express';
import { generateQR, validateQR, getTicketsByOrder } from './qr.controller';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { validateQRSchema } from './qr.schema';

const router = Router();

/**
 * @swagger
 * /qr/tickets/{ticketId}/qr:
 *   get:
 *     summary: Generate QR code image for a ticket
 *     tags: [QR]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: QR code as base64 PNG data URL
 *       403:
 *         description: Not your ticket
 */
router.get('/tickets/:ticketId/qr', authenticate, generateQR);

/**
 * @swagger
 * /qr/orders/{orderId}/tickets:
 *   get:
 *     summary: Get all tickets for an order
 *     tags: [QR]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of tickets with QR hashes
 */
router.get('/orders/:orderId/tickets', authenticate, getTicketsByOrder);

/**
 * @swagger
 * /qr/validate:
 *   post:
 *     summary: Validate a ticket QR code at event entrance
 *     tags: [QR]
 *     description: Only event organizers can validate tickets for their own events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [qrCodeHash]
 *             properties:
 *               qrCodeHash:
 *                 type: string
 *                 example: 02a747143cd92b90d512a116de32757b...
 *     responses:
 *       200:
 *         description: Ticket validated successfully
 *       400:
 *         description: Ticket already used
 *       404:
 *         description: Invalid QR code
 */
router.post('/validate', authenticate, authorize('ORGANIZER', 'ADMIN'), validate(validateQRSchema), validateQR);

export default router;
