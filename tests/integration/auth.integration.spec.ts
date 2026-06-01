import request from 'supertest';
import app from '../../src/app';
import { cleanDatabase } from '../helpers/db.helper';
import { createTestUser } from '../helpers/factories/user.factory';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  await cleanDatabase();
});

afterEach(async () => {
  await cleanDatabase();
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('Registration successful');
  });

  it('should reject duplicate email', async () => {
    await createTestUser({ email: 'john@test.com' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'weak',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('should login successfully with valid credentials', async () => {
    await createTestUser({
      email: 'login@test.com',
      password: 'Password123!',
      isEmailVerified: true,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should reject invalid password', async () => {
    await createTestUser({ email: 'login@test.com', isEmailVerified: true });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'WrongPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject unverified email', async () => {
    await createTestUser({
      email: 'unverified@test.com',
      isEmailVerified: false,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'unverified@test.com', password: 'Password123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject non-existent user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.com', password: 'Password123!' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('should logout successfully', async () => {
    await createTestUser({ email: 'logout@test.com', isEmailVerified: true });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'logout@test.com', password: 'Password123!' });

    const { accessToken, refreshToken } = loginRes.body.data;

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject logout without refresh token', async () => {
    await createTestUser({ email: 'logout2@test.com', isEmailVerified: true });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'logout2@test.com', password: 'Password123!' });

    const { accessToken } = loginRes.body.data;

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('should rotate refresh token successfully', async () => {
    await createTestUser({ email: 'refresh@test.com', isEmailVerified: true });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'refresh@test.com', password: 'Password123!' });

    const { refreshToken } = loginRes.body.data;

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should reject invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid.token.here' });

    expect(res.status).toBe(401);
  });
});
