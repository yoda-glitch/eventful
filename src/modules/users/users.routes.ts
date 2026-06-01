import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getUserEvents,
  getUserTickets,
} from './users.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { updateProfileSchema, changePasswordSchema } from './users.schema';

const router = Router();

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get authenticated user profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User profile without sensitive fields
 */
router.get('/me', authenticate, getProfile);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch('/me', authenticate, validate(updateProfileSchema), updateProfile);

/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     summary: Change password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password incorrect
 */
router.patch('/me/password', authenticate, validate(changePasswordSchema), changePassword);

/**
 * @swagger
 * /users/me/events:
 *   get:
 *     summary: Get all events created by the authenticated user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of user events
 */
router.get('/me/events', authenticate, getUserEvents);

/**
 * @swagger
 * /users/me/tickets:
 *   get:
 *     summary: Get all tickets purchased by the authenticated user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of orders with tickets
 */
router.get('/me/tickets', authenticate, getUserTickets);

export default router;
