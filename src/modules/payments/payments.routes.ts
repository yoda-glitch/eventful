import { Router } from 'express';
import {
  initiateOrder,
  handleWebhook,
  getOrder,
  getUserOrders,
  verifyPayment,
} from './payments.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { initiateOrderSchema } from './payments.schema';

const router = Router();

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Paystack webhook endpoint
 *     tags: [Payments]
 *     security: []
 *     description: Receives webhook events from Paystack. Requires valid HMAC signature.
 *     responses:
 *       200:
 *         description: Webhook processed
 *       401:
 *         description: Invalid signature
 */
router.post('/webhook', handleWebhook);

/**
 * @swagger
 * /payments/orders:
 *   post:
 *     summary: Initiate a ticket purchase order
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tierId, quantity]
 *             properties:
 *               tierId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 2
 *     responses:
 *       201:
 *         description: Order created — returns Paystack authorization URL for paid events or tickets for free events
 *       400:
 *         description: Not enough tickets available
 */
router.post('/orders', authenticate, validate(initiateOrderSchema), initiateOrder);

/**
 * @swagger
 * /payments/orders:
 *   get:
 *     summary: Get all orders for the authenticated user
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/orders', authenticate, getUserOrders);

/**
 * @swagger
 * /payments/orders/{orderId}:
 *   get:
 *     summary: Get a specific order by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/orders/:orderId', authenticate, getOrder);

/**
 * @swagger
 * /payments/verify/{reference}:
 *   get:
 *     summary: Verify a payment by reference
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verification details from Paystack
 */
router.get('/verify/:reference', authenticate, verifyPayment);

export default router;
