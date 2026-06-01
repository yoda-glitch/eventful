import { Request, Response, NextFunction } from 'express';
import { ReminderService } from './reminder.service';

const service = new ReminderService();

export const setReminder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.setPersonalReminder(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getUserReminders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reminders = await service.getUserReminders(req.user!.id);
    res.json({ success: true, data: reminders });
  } catch (err) { next(err); }
};

export const deleteReminder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.deleteReminder(req.params.reminderId as string, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const setCreatorReminders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { minutesBefore } = req.body as { minutesBefore: number[] };
    const result = await service.setCreatorReminders(
      req.user!.id,
      req.params.eventId as string,
      minutesBefore
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
