import { Request, Response, NextFunction } from 'express';

export const rawBodyMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk: string) => { data += chunk; });
  req.on('end', () => {
    (req as Request & { rawBody: string }).rawBody = data;
    next();
  });
};
