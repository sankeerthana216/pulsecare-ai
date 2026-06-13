import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import jwt from 'jsonwebtoken';

jest.mock('../src/config/db', () => ({
  prisma: {
    profile: {
      findUnique: jest.fn(),
    },
    healthReading: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    alert: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => {
      if (Array.isArray(cb)) {
        return Promise.all(cb);
      }
      return cb(prisma);
    }),
  },
}));

describe('Vitals Module Integration Tests', () => {
  let accessToken: string;

  beforeAll(() => {
    // Generate valid mock JWT access token for testing
    const secret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
    accessToken = jwt.sign(
      { id: 'user-uuid-1', email: 'patient@pulsecare.ai', role: 'PATIENT' },
      secret,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/vitals', () => {
    it('should block vitals ingestion if request lacks Authorization header', async () => {
      const response = await request(app)
        .post('/api/vitals')
        .send({
          heartRate: 72,
          temperature: 36.6,
          oxygenLevel: 98,
          bloodPressure: '120/80',
        });

      expect(response.status).toBe(401);
    });

    it('should reject vital payload with validation error if parameters are out of range', async () => {
      const response = await request(app)
        .post('/api/vitals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          heartRate: 280, // out of range (30-250)
          temperature: 12.0, // out of range (30-45)
          oxygenLevel: 105, // out of range (50-100)
          bloodPressure: 'invalid-bp-format',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should successfully ingest vitals, trigger analysis, and save to DB', async () => {
      const mockProfile = { id: 'user-uuid-1', name: 'John Patient', age: 35, gender: 'MALE', heartRateThreshold: 100, temperatureThreshold: 38.0 };
      const mockReading = { id: 'reading-uuid-123', userId: 'user-uuid-1', heartRate: 75, temperature: 36.8, oxygenLevel: 97, bloodPressure: '120/80', status: 'NORMAL', aiAnalysis: 'Vitals stable' };

      (prisma.profile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
      (prisma.healthReading.create as jest.Mock).mockResolvedValue(mockReading);
      (prisma.healthReading.update as jest.Mock).mockResolvedValue(mockReading);

      const response = await request(app)
        .post('/api/vitals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          heartRate: 75,
          temperature: 36.8,
          oxygenLevel: 97,
          bloodPressure: '120/80',
        });

      expect(response.status).toBe(201);
      expect(response.body.reading.heartRate).toBe(75);
      expect(response.body.reading.status).toBe('NORMAL');
    });
  });

  describe('GET /api/vitals/history', () => {
    it('should retrieve paginated list of readings history', async () => {
      const mockReadings = [
        { id: 'reading-1', heartRate: 70, temperature: 36.6, oxygenLevel: 98, status: 'NORMAL', createdAt: new Date() },
        { id: 'reading-2', heartRate: 110, temperature: 38.2, oxygenLevel: 94, status: 'ELEVATED', createdAt: new Date() }
      ];

      (prisma.healthReading.findMany as jest.Mock).mockResolvedValue(mockReadings);
      (prisma.healthReading.count as jest.Mock).mockResolvedValue(2);

      const response = await request(app)
        .get('/api/vitals/history?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.readings).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.totalPages).toBe(1);
    });
  });
});
