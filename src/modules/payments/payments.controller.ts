import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service';
import { PaystackWebhookEvent } from './payments.types';
import crypto from 'crypto';
import { env } from '@/config';
import { UnauthorizedError } from '@/shared/errors/HttpError';

const service = new PaymentsService();

export const initiateOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { next(new UnauthorizedError('Not authenticated')); return; }
    const result = await service.initiateOrder(req.user.id, req.user.email, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signature = req.headers['x-paystack-signature'];
    if (!signature || typeof signature !== 'string') {
      res.status(401).json({ success: false, error: 'Missing webhook signature' });
      return;
    }

    const rawBody = req.body as Buffer;
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      res.status(400).json({ success: false, error: 'Invalid webhook body' });
      return;
    }

    const hash = crypto
      .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      res.status(401).json({ success: false, error: 'Invalid signature' });
      return;
    }

    const event = JSON.parse(rawBody.toString()) as PaystackWebhookEvent;
    await service.handleWebhook(event);
    res.sendStatus(200);
  } catch (err) { next(err); }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { next(new UnauthorizedError('Not authenticated')); return; }
    const order = await service.getOrderById(req.params.orderId as string, req.user.id);
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

export const getUserOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { next(new UnauthorizedError('Not authenticated')); return; }
    const orders = await service.getUserOrders(req.user.id);
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.verifyPayment(req.params.reference as string);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
