import { Router } from 'express';
import authRoutes from '@/modules/auth/auth.routes';
import eventRoutes from '@/modules/events/events.routes';
import paymentRoutes from '@/modules/payments/payments.routes';
import qrRoutes from '@/modules/qr/qr.routes';
import analyticsRoutes from '@/modules/analytics/analytics.routes';
import notificationRoutes from '@/modules/notifications/notifications.routes';
import userRoutes from '@/modules/users/users.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/payments', paymentRoutes);
router.use('/qr', qrRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);

export default router;
