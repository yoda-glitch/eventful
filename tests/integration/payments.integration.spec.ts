import request from 'supertest';
import app from '../../src/app';
import { cleanDatabase } from '../helpers/db.helper';
import { createTestUser } from '../helpers/factories/user.factory';
import { createTestEvent, createTestTier } from '../helpers/factories/event.factory';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.test' });

jest.mock('../../src/modules/payments/paystack.client', () => ({
  paystackClient: {
    initializeTransaction: jest.fn().mockResolvedValue({
      data: {
        authorization_url: 'https://checkout.paystack.com/test123',
        access_code: 'test123',
        reference: 'MOCK-REF',
      },
    }),
    verifyTransaction: jest.fn().mockResolvedValue({
      data: { status: 'success', amount: 5000 },
    }),
  },
}));

let userToken: string;
let userId: string;
let tierId: string;
let freeTierId: string;

beforeAll(async () => {
  await cleanDatabase();

  const user = await createTestUser({
    email: 'buyer@payments.test',
    role: 'ORGANIZER',
    isEmailVerified: true,
  });
  userId = user.id;

  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'buyer@payments.test', password: 'Password123!' });
  userToken = login.body.data.accessToken;

  const event = await createTestEvent(userId, { status: 'PUBLISHED', isFree: false });
  const tier = await createTestTier(event.id, { price: 5000, totalQuantity: 10 });
  tierId = tier.id;

  const freeEvent = await createTestEvent(userId, { status: 'PUBLISHED', isFree: true });
  const freeTier = await createTestTier(freeEvent.id, { price: 0, totalQuantity: 10 });
  freeTierId = freeTier.id;
});

afterAll(async () => {
  await cleanDatabase();
});

describe('POST /api/v1/payments/orders', () => {
  it('should initiate a paid order successfully', async () => {
    const res = await request(app)
      .post('/api/v1/payments/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ tierId, quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reference).toBeDefined();
    expect(res.body.data.authorizationUrl).toBeDefined();
  });

  it('should process free order without payment', async () => {
    const res = await request(app)
      .post('/api/v1/payments/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ tierId: freeTierId, quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isFree).toBe(true);
    expect(res.body.data.reference).toMatch(/^FREE-/);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/v1/payments/orders')
      .send({ tierId, quantity: 1 });

    expect(res.status).toBe(401);
  });

  it('should reject quantity exceeding availability', async () => {
    const res = await request(app)
      .post('/api/v1/payments/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ tierId, quantity: 100 });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/payments/webhook', () => {
  it('should reject webhook with missing signature', async () => {
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .send({ event: 'charge.success', data: {} });

    expect(res.status).toBe(401);
  });

  it('should reject webhook with invalid signature', async () => {
    const payload = JSON.stringify({
      event: 'charge.success',
      data: { reference: 'TEST-REF', amount: 5000, status: 'success', customer: { email: 'test@test.com' } },
    });

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', 'invalid-signature')
      .send(payload);

    expect(res.status).toBe(401);
  });

  it.skip('should process valid webhook successfully', async () => {
    const orderRes = await request(app)
      .post('/api/v1/payments/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ tierId, quantity: 1 });

    const { reference } = orderRes.body.data;

    const payload = JSON.stringify({
      event: 'charge.success',
      data: {
        reference,
        amount: 5000,
        status: 'success',
        customer: { email: 'buyer@payments.test' },
      },
    });

    const secret = process.env['PAYSTACK_SECRET_KEY'] ?? '';
    const signature = crypto.createHmac('sha512', secret).update(payload).digest('hex');

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', signature)
      .send(Buffer.from(payload));

    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/payments/orders', () => {
  it('should return user orders', async () => {
    const res = await request(app)
      .get('/api/v1/payments/orders')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
