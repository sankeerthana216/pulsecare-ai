import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import bcrypt from 'bcrypt';

jest.mock('../src/config/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    profile: {
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prisma)),
  },
}));

describe('Auth Module Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should successfully register a new user PATIENT with their Profile', async () => {
      const mockUser = { id: 'user-uuid-1', email: 'test@pulsecare.ai', role: 'PATIENT' };
      const mockProfile = { id: 'user-uuid-1', name: 'Alice Test' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.profile.create as jest.Mock).mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@pulsecare.ai',
          password: 'password123',
          name: 'Alice Test',
          age: 30,
          gender: 'FEMALE',
          phone: '+15551112222',
          emergencyContactName: 'Bob Contact',
          emergencyContactPhone: '+15552223333',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('test@pulsecare.ai');
    });

    it('should reject signup if email is already registered', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-id' });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@pulsecare.ai',
          password: 'password123',
          name: 'Alice Test',
          age: 30,
          gender: 'FEMALE',
          phone: '+15551112222',
          emergencyContactName: 'Bob Contact',
          emergencyContactPhone: '+15552223333',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email address already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-uuid-1',
        email: 'test@pulsecare.ai',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'PATIENT',
        profile: { name: 'Alice Test' },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@pulsecare.ai',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.name).toBe('Alice Test');
    });

    it('should reject login with incorrect password', async () => {
      const mockUser = {
        id: 'user-uuid-1',
        email: 'test@pulsecare.ai',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'PATIENT',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@pulsecare.ai',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });
  });
});
