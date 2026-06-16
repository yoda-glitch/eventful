import { Request, Response, NextFunction } from 'express';
import { EventsService } from './events.service';

const service = new EventsService();

export const createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await service.createEvent(req.user!.id, req.body);
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await service.getEventById(req.params.id as string);
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

export const getEventBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await service.getEventBySlug(req.params.slug as string);
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

export const getAllEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = {
      page: req.query['page'] ? Number(req.query['page']) : 1,
      limit: req.query['limit'] ? Number(req.query['limit']) : 10,
      status: req.query['status'] as string | undefined,
      category: req.query['category'] as string | undefined,
      search: req.query['search'] as string | undefined,
    };
    const result = await service.getAllEvents(query);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await service.updateEvent(req.params.id as string, req.user!.id, req.body);
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

export const publishEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await service.publishEvent(req.params.id as string, req.user!.id);
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

export const cancelEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await service.cancelEvent(req.params.id as string, req.user!.id);
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.deleteEvent(req.params.id as string, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const createTicketTier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tier = await service.createTicketTier(req.params.id as string, req.user!.id, req.body);
    res.status(201).json({ success: true, data: tier });
  } catch (err) { next(err); }
};

export const updateTicketTier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tier = await service.updateTicketTier(req.params.tierId as string, req.user!.id, req.body);
    res.json({ success: true, data: tier });
  } catch (err) { next(err); }
};

export const deleteTicketTier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.deleteTicketTier(req.params.tierId as string, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getEventAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const availability = await service.getEventAvailability(req.params.id as string);
    res.json({ success: true, data: availability });
  } catch (err) { next(err); }
};

export const getShareLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.getShareLink(req.params.id as string);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
