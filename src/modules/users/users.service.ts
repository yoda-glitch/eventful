import bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto, ChangePasswordDto } from './users.types';
import { NotFoundError, BadRequestError } from '@/shared/errors/HttpError';
import { User } from '../../generated/prisma/client';

type SafeUser = Omit<User, 'passwordHash' | 'refreshToken' | 'emailVerifyToken' | 'passwordResetToken' | 'passwordResetExpiry'>;

const sanitizeUser = (user: User): SafeUser => {
  const { passwordHash, refreshToken, emailVerifyToken, passwordResetToken, passwordResetExpiry, ...safe } = user;
  return safe;
};

export class UsersService {
  private repository: UsersRepository;

  constructor() {
    this.repository = new UsersRepository();
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<SafeUser> {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const updated = await this.repository.updateProfile(userId, dto);
    return sanitizeUser(updated);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) throw new BadRequestError('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.repository.updatePassword(userId, passwordHash);

    // Invalidate all existing sessions after password change
    await this.repository.clearRefreshToken(userId);

    return { message: 'Password changed successfully. Please log in again.' };
  }

  async getUserEvents(userId: string) {
    return this.repository.getUserEvents(userId);
  }

  async getUserTickets(userId: string) {
    return this.repository.getUserTickets(userId);
  }
}
