import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import jwt from 'jsonwebtoken';

jest.mock('../src/config/db', () => ({
  prisma: {
    alert: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((cb) => {
      if (Array.isArray(cb)) return Promise.all(cb);
      return cb(prisma);
    }),
  },
}));

describe('Alerts Module Integration Tests', () => {
  let accessToken: string;

  beforeAll(() => {
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

  describe('GET /api/alerts', () => {
    it('should fetch alert list for the authenticated patient', async () => {
      const mockAlerts = [
        { id: 'alert-1', type: 'TACHYCARDIA', message: 'High heart rate', severity: 'CRITICAL', resolved: false, createdAt: new Date() }
      ];

      (prisma.alert.findMany as jest.Mock).mockResolvedValue(mockAlerts);
      (prisma.alert.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.alerts).toHaveLength(1);
      expect(response.body.alerts[0].type).toBe('TACHYCARDIA');
    });
  });

  describe('PUT /api/alerts/:id/resolve', () => {
    it('should successfully mark an alert as resolved', async () => {
      const mockAlert = { id: 'alert-1', userId: 'user-uuid-1', type: 'TACHYCARDIA', severity: 'CRITICAL', resolved: false };
      const mockUpdatedAlert = { ...mockAlert, resolved: true };

      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(mockAlert);
      (prisma.alert.update as jest.Mock).mockResolvedValue(mockUpdatedAlert);

      const response = await request(app)
        .put('/api/alerts/alert-1/resolve')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Alert resolved successfully');
      expect(response.body.alert.resolved).toBe(true);
    });

    it('should block resolution of an alert belonging to a different user', async () => {
      // Alert belongs to 'user-uuid-999' but token is 'user-uuid-1'
      const mockAlert = { id: 'alert-1', userId: 'user-uuid-999', type: 'TACHYCARDIA', severity: 'CRITICAL', resolved: false };

      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(mockAlert);

      const response = await request(app)
        .put('/api/alerts/alert-1/resolve')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access forbidden. Cannot resolve other patient alerts.');
    });
  });
});
