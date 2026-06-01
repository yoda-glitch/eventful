import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { errorMiddleware } from '@/middleware/error.middleware';
import { globalRateLimiter } from '@/middleware/rate-limit.middleware';
import router from '@/routes';
import prisma from '@/config/database.config';
import redis from '@/config/redis.config';
import { env } from '@/config';
import { swaggerSpec } from '@/config/swagger.config';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
      connectSrc: ["'self'"],
    },
  },
}));

const allowedOrigins = env.NODE_ENV === 'production'
  ? (process.env['ALLOWED_ORIGINS'] ?? '').split(',').filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
app.use(express.json({ limit: '10kb' }));
if (process.env['NODE_ENV'] !== 'test') app.use(globalRateLimiter);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Eventful API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Health check
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'Welcome to Eventful API', docs: '/api-docs', health: '/health' });
});

app.get('/health', async (_req, res) => {
  const status = { database: 'up', redis: 'up' };
  let healthy = true;

  try { await prisma.$queryRaw`SELECT 1`; }
  catch { status.database = 'down'; healthy = false; }

  try { await redis.ping(); }
  catch { status.redis = 'down'; healthy = false; }

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? 'Server is running' : 'Service unavailable',
    services: status,
  });
});

app.use('/api/v1', router);
app.use(errorMiddleware);

export default app;
