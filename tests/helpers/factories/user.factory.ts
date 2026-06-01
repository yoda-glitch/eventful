import bcrypt from 'bcryptjs';
import { testPrisma } from '../db.helper';

export const createTestUser = async (overrides: {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN';
  isEmailVerified?: boolean;
} = {}) => {
  const passwordHash = await bcrypt.hash(overrides.password ?? 'Password123!', 10);
  return testPrisma.user.create({
    data: {
      email: overrides.email ?? `test_${Date.now()}@test.com`,
      firstName: overrides.firstName ?? 'Test',
      lastName: overrides.lastName ?? 'User',
      passwordHash,
      role: overrides.role ?? 'ATTENDEE',
      isEmailVerified: overrides.isEmailVerified ?? true,
    },
  });
};
