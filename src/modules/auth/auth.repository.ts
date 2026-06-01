import prisma from '@/config/database.config';
import { User } from '../../generated/prisma/client';
import crypto from 'crypto';

const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export class AuthRepository {
  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    emailVerifyToken: string;
  }): Promise<User> {
    // SEC-9: Hash email verify token before storing
    return prisma.user.create({
      data: {
        ...data,
        emailVerifyToken: hashToken(data.emailVerifyToken),
      },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async verifyEmail(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });
  }

  async findUserByEmailVerifyToken(token: string): Promise<User | null> {
    // SEC-9: Compare hashed token
    return prisma.user.findFirst({
      where: { emailVerifyToken: hashToken(token) },
    });
  }

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: token },
    });
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async savePasswordResetToken(
    userId: string,
    token: string,
    expiry: Date
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    });
  }

  async findUserByResetToken(token: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        refreshToken: null,
      },
    });
  }
}
