import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';

const service = new UsersService();

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await service.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await service.updateProfile(req.user!.id, req.body);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.changePassword(req.user!.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getUserEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const events = await service.getUserEvents(req.user!.id);
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
};

export const getUserTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tickets = await service.getUserTickets(req.user!.id);
    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
};
