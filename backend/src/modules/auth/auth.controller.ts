import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';

// Zod schemas for input validation
export const signupSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    age: z.number().int().min(1, 'Age must be positive'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    phone: z.string().min(8, 'Phone number must be at least 8 characters'),
    emergencyContactName: z.string().min(2, 'Emergency contact name must be at least 2 characters'),
    emergencyContactPhone: z.string().min(8, 'Emergency contact phone must be at least 8 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

// Helper functions to generate JWTs
const generateAccessToken = (userId: string, email: string, role: string): string => {
  const secret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  return jwt.sign({ id: userId, email, role }, secret, { expiresIn });
};

const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

export class AuthController {
  public static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, age, gender, phone, emergencyContactName, emergencyContactPhone } = req.body;

      // Check if email already registered
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new AppError('Email address already registered', 400);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user and profile in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            role: 'PATIENT', // Default role is PATIENT
          },
        });

        const profile = await tx.profile.create({
          data: {
            id: user.id,
            name,
            age,
            gender,
            phone,
            emergencyContactName,
            emergencyContactPhone,
            heartRateThreshold: 100, // Default HR alert threshold
            temperatureThreshold: 38.0, // Default Temp alert threshold
          },
        });

        return { user, profile };
      });

      // Generate initial tokens
      const accessToken = generateAccessToken(result.user.id, result.user.email, result.user.role);
      const refreshToken = generateRefreshToken(result.user.id);

      // Save refresh token to DB
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await prisma.refreshToken.create({
        data: {
          userId: result.user.id,
          token: refreshToken,
          expiresAt,
        },
      });

      res.status(201).json({
        message: 'User registered successfully',
        accessToken,
        refreshToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          name: result.profile.name,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Save refresh token to DB
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt,
        },
      });

      res.status(200).json({
        message: 'Signed in successfully',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.profile?.name || '',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Delete refresh token if provided
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      }

      res.status(200).json({ message: 'Signed out successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      // Find token in DB
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw new AppError('Refresh token is invalid or expired', 403);
      }

      // Verify token
      if (tokenRecord.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
        throw new AppError('Refresh token expired', 403);
      }

      const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
      
      try {
        jwt.verify(refreshToken, secret);
      } catch (err) {
        await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
        throw new AppError('Refresh token invalid', 403);
      }

      // Token is valid - perform Refresh Token Rotation (RTR)
      // 1. Delete used refresh token
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });

      // 2. Generate new tokens
      const newAccessToken = generateAccessToken(tokenRecord.user.id, tokenRecord.user.email, tokenRecord.user.role);
      const newRefreshToken = generateRefreshToken(tokenRecord.user.id);

      // 3. Save new refresh token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.refreshToken.create({
        data: {
          userId: tokenRecord.user.id,
          token: newRefreshToken,
          expiresAt,
        },
      });

      res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      next(error);
    }
  }
}
