import request from 'supertest';
import app from '../../src/app';
import { cleanDatabase } from '../helpers/db.helper';
import { createTestUser } from '../helpers/factories/user.factory';
import { createTestEvent, createTestTier } from '../helpers/factories/event.factory';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

let organizerToken: string;
let attendeeToken: string;
let organizerId: string;

beforeAll(async () => {
  await cleanDatabase();

  const organizer = await createTestUser({
    email: 'organizer@events.test',
    role: 'ORGANIZER',
    isEmailVerified: true,
  });
  organizerId = organizer.id;

  await createTestUser({
    email: 'attendee@events.test',
    role: 'ATTENDEE',
    isEmailVerified: true,
  });

  const orgLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'organizer@events.test', password: 'Password123!' });
  organizerToken = orgLogin.body.data.accessToken;

  const attLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'attendee@events.test', password: 'Password123!' });
  attendeeToken = attLogin.body.data.accessToken;
});

afterAll(async () => {
  await cleanDatabase();
});

describe('POST /api/v1/events', () => {
  it('should create an event for authenticated user', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Test Concert',
        venue: 'Test Venue Lagos',
        startDate: '2026-12-01T10:00:00.000Z',
        endDate: '2026-12-01T18:00:00.000Z',
        category: 'MUSIC',
        isFree: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Concert');
    expect(res.body.data.status).toBe('DRAFT');
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .send({
        title: 'Test Concert',
        venue: 'Test Venue',
        startDate: '2026-12-01T10:00:00.000Z',
        endDate: '2026-12-01T18:00:00.000Z',
      });

    expect(res.status).toBe(401);
  });

  it('should reject invalid dates', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Test Concert',
        venue: 'Test Venue',
        startDate: '2026-12-01T18:00:00.000Z',
        endDate: '2026-12-01T10:00:00.000Z',
      });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/events', () => {
  it('should return list of events publicly', async () => {
    const res = await request(app).get('/api/v1/events');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.events).toBeDefined();
    expect(res.body.data.total).toBeDefined();
  });

  it('should filter events by category', async () => {
    const res = await request(app).get('/api/v1/events?category=MUSIC');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should search events by keyword', async () => {
    const res = await request(app).get('/api/v1/events?search=Concert');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('PATCH /api/v1/events/:id/publish', () => {
  it('should publish event with ticket tier', async () => {
    const event = await createTestEvent(organizerId, { status: 'DRAFT' });
    await createTestTier(event.id);

    const res = await request(app)
      .patch(`/api/v1/events/${event.id}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  it('should reject publish without ticket tier on paid event', async () => {
    const event = await createTestEvent(organizerId, { status: 'DRAFT', isFree: false });

    const res = await request(app)
      .patch(`/api/v1/events/${event.id}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(res.status).toBe(400);
  });

  it('should reject publish by non-owner', async () => {
    const event = await createTestEvent(organizerId, { status: 'DRAFT' });
    await createTestTier(event.id);

    const res = await request(app)
      .patch(`/api/v1/events/${event.id}/publish`)
      .set('Authorization', `Bearer ${attendeeToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/events/:id/availability', () => {
  it('should return ticket availability', async () => {
    const event = await createTestEvent(organizerId, { status: 'PUBLISHED' });
    await createTestTier(event.id, { totalQuantity: 50, price: 5000 });

    const res = await request(app).get(`/api/v1/events/${event.id}/availability`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].available).toBe(50);
  });
});
