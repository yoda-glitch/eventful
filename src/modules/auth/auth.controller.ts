import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.types';

const service = new AuthService();

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto: RegisterDto = req.body;
    const result = await service.register(dto);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto: LoginDto = req.body;
    const tokens = await service.login(dto);
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.body.refreshToken as string;
    await service.logout(req.user!.id, refreshToken);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const tokens = await service.refresh(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    await service.verifyEmail(token as string);
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3000';
    res.redirect(frontendUrl + '/auth/verify?status=success&token=' + token);
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await service.forgotPassword(email);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const result = await service.resetPassword(token as string, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
