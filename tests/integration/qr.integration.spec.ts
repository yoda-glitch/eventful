import request from 'supertest';
import app from '../../src/app';
import { cleanDatabase, testPrisma } from '../helpers/db.helper';
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
      },
    }),
  },
}));

let organizerToken: string;
let attendeeToken: string;
let organizerId: string;
let ticketId: string;
let qrCodeHash: string;
let orderId: string;

beforeAll(async () => {
  await cleanDatabase();

  const organizer = await createTestUser({
    email: 'organizer@qr.test',
    role: 'ORGANIZER',
    isEmailVerified: true,
  });
  organizerId = organizer.id;

  const attendee = await createTestUser({
    email: 'attendee@qr.test',
    role: 'ATTENDEE',
    isEmailVerified: true,
  });

  const orgLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'organizer@qr.test', password: 'Password123!' });
  organizerToken = orgLogin.body.data.accessToken;

  const attLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'attendee@qr.test', password: 'Password123!' });
  attendeeToken = attLogin.body.data.accessToken;

  // Create event and free tier
  const event = await createTestEvent(organizerId, { status: 'PUBLISHED', isFree: true });
  const tier = await createTestTier(event.id, { price: 0, totalQuantity: 10 });

  // Purchase free ticket
  const orderRes = await request(app)
    .post('/api/v1/payments/orders')
    .set('Authorization', `Bearer ${attLogin.body.data.accessToken}`)
    .send({ tierId: tier.id, quantity: 1 });

  orderId = orderRes.body.data.orderId;

  // Get ticket
  const ticket = await testPrisma.ticket.findFirst({ where: { orderId } });
  if (ticket) {
    ticketId = ticket.id;
    qrCodeHash = ticket.qrCodeHash;
  }
});

afterAll(async () => {
  await cleanDatabase();
});

describe('GET /api/v1/qr/orders/:orderId/tickets', () => {
  it('should return tickets for an order', async () => {
    const res = await request(app)
      .get(`/api/v1/qr/orders/${orderId}/tickets`)
      .set('Authorization', `Bearer ${attendeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].qrCodeHash).toBeDefined();
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app).get(`/api/v1/qr/orders/${orderId}/tickets`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/qr/tickets/:ticketId/qr', () => {
  it('should generate QR code for a ticket', async () => {
    const res = await request(app)
      .get(`/api/v1/qr/tickets/${ticketId}/qr`)
      .set('Authorization', `Bearer ${attendeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.qrCode).toMatch(/^data:image\/png;base64,/);
  });
});

describe('POST /api/v1/qr/validate', () => {
  it('should validate a valid QR code', async () => {
    const res = await request(app)
      .post('/api/v1/qr/validate')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ qrCodeHash });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('validated successfully');
  });

  it('should reject duplicate scan', async () => {
    const res = await request(app)
      .post('/api/v1/qr/validate')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ qrCodeHash });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already been used');
  });

  it('should reject invalid QR code', async () => {
    const res = await request(app)
      .post('/api/v1/qr/validate')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ qrCodeHash: crypto.randomBytes(32).toString('hex') });

    expect(res.status).toBe(404);
  });
});
