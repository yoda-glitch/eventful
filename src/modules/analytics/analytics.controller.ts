import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';

const service = new AnalyticsService();

export const getEventAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const analytics = await service.getEventAnalytics(req.params.eventId as string, req.user!.id);
    res.json({ success: true, data: analytics });
  } catch (err) { next(err); }
};

export const getEventPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payments = await service.getEventPayments(req.params.eventId as string, req.user!.id);
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
};

export const getOrganizerDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dashboard = await service.getOrganizerDashboard(req.user!.id);
    res.json({ success: true, data: dashboard });
  } catch (err) { next(err); }
};

export const getPlatformAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const analytics = await service.getPlatformAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) { next(err); }
};
