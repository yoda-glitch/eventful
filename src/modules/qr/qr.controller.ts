import { Request, Response, NextFunction } from 'express';
import { QRService } from './qr.service';

const service = new QRService();

export const generateQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const qrImage = await service.generateQRImage(req.params.ticketId as string, req.user!.id);
    res.json({ success: true, data: { qrCode: qrImage } });
  } catch (err) { next(err); }
};

export const validateQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { qrCodeHash } = req.body as { qrCodeHash: string };
    const result = await service.validateQR(qrCodeHash, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getTicketsByOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tickets = await service.getTicketsByOrder(req.params.orderId as string, req.user!.id);
    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
};
