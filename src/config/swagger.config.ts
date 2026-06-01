import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Eventful API',
      version: '1.0.0',
      description: 'A robust event ticketing and management API featuring QR validation, flexible notifications, cached analytics, and Paystack integration.',
      contact: {
        name: 'Eventful Support',
        email: 'support@eventful.com',
      },
    },
    servers: [
      {
        url: process.env['APP_URL'] ? `${process.env['APP_URL']}/api/v1` : 'http://localhost:3000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://eventful-api-b824ebd153c0.herokuapp.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['ATTENDEE', 'ORGANIZER', 'ADMIN'] },
            isEmailVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            organizerId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            venue: { type: 'string' },
            timezone: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'] },
            category: { type: 'string', enum: ['MUSIC', 'NIGHTLIFE', 'PERFORMING_ARTS', 'HOLIDAYS', 'DATING', 'HOBBIES', 'BUSINESS', 'FOOD_AND_DRINK', 'CONFERENCE', 'CONCERT', 'COMMUNITY', 'SEASONAL', 'OTHER'] },
            coverImageUrl: { type: 'string', nullable: true },
            isFree: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TicketTier: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            eventId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            price: { type: 'number' },
            totalQuantity: { type: 'integer' },
            soldQuantity: { type: 'integer' },
            features: { type: 'array', items: { type: 'string' } },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            totalAmount: { type: 'number' },
            status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            orderId: { type: 'string', format: 'uuid' },
            tierId: { type: 'string', format: 'uuid' },
            qrCodeHash: { type: 'string' },
            isUsed: { type: 'boolean' },
            usedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
