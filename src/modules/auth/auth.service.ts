import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { env } from '@/config';
import redis from '@/config/redis.config';
import { RegisterDto, LoginDto, TokenPayload, AuthTokens } from './auth.types';
import { BadRequestError, UnauthorizedError } from '@/shared/errors/HttpError';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { logger } from '@/shared/utils/logger';

export class AuthService {
  private repository: AuthRepository;
  private notificationsService: NotificationsService;

  constructor() {
    this.repository = new AuthRepository();
    this.notificationsService = new NotificationsService();
  }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.repository.findUserByEmail(dto.email);
    if (existing) throw new BadRequestError('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    await this.repository.createUser({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
      emailVerifyToken,
    });

    await this.notificationsService.sendEmailVerification({
      to: dto.email,
      firstName: dto.firstName,
      verifyToken: emailVerifyToken,
    });

    return { message: 'Registration successful. Please verify your email.' };
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.repository.findUserByEmail(dto.email);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedError('Invalid credentials');

    if (!user.isEmailVerified)
      throw new UnauthorizedError('Please verify your email first');

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const hashedRefresh = this.hashToken(tokens.refreshToken);
    await this.repository.saveRefreshToken(user.id, hashedRefresh);

    return tokens;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.repository.clearRefreshToken(userId);

    // SEC-7: Use decode() not verify() — logout should succeed even if token expired
    try {
      const ttl = 7 * 24 * 60 * 60;
      const result = await redis.set(
        `blacklist:${this.hashToken(refreshToken)}`,
        '1',
        'EX',
        ttl
      );
      if (!result) {
        logger.warn({ message: 'Failed to blacklist token in Redis', userId });
      }
    } catch {
      // Redis failure on logout is non-fatal — DB token already cleared
      logger.warn({ message: 'Redis blacklist failed during logout', userId });
    }
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: TokenPayload;

    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
      }) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const isBlacklisted = await redis.get(`blacklist:${this.hashToken(refreshToken)}`);
    if (isBlacklisted) throw new UnauthorizedError('Token has been revoked');

    const user = await this.repository.findUserById(payload.userId);
    if (!user || !user.refreshToken) throw new UnauthorizedError('Invalid refresh token');

    const isMatch = user.refreshToken === this.hashToken(refreshToken);
    if (!isMatch) throw new UnauthorizedError('Invalid refresh token');

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const hashedRefresh = this.hashToken(tokens.refreshToken);
    await this.repository.saveRefreshToken(user.id, hashedRefresh);

    return tokens;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.repository.findUserByEmailVerifyToken(token);
    if (!user) throw new BadRequestError('Invalid or expired verification token');

    await this.repository.verifyEmail(user.id);
    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.repository.findUserByEmail(email);
    if (!user) return { message: 'If that email exists, a reset link has been sent' };

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.repository.savePasswordResetToken(
      user.id,
      this.hashToken(resetToken),
      expiry
    );

    await this.notificationsService.sendPasswordReset({
      to: user.email,
      firstName: user.firstName,
      resetToken,
    });

    return { message: 'If that email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const user = await this.repository.findUserByResetToken(this.hashToken(token));
    if (!user) throw new BadRequestError('Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(password, 12);
    await this.repository.updatePassword(user.id, passwordHash);

    return { message: 'Password reset successful' };
  }

  private generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
