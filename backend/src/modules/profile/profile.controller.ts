import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';

// Schema for updating profile data
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    age: z.number().int().min(1, 'Age must be positive'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    phone: z.string().min(8, 'Phone number must be at least 8 characters'),
    emergencyContactName: z.string().min(2, 'Emergency contact name must be at least 2 characters'),
    emergencyContactPhone: z.string().min(8, 'Emergency contact phone must be at least 8 characters'),
    heartRateThreshold: z.number().int().min(60).max(200, 'Threshold must be between 60 and 200 BPM'),
    temperatureThreshold: z.number().min(35.0).max(42.0, 'Threshold must be between 35 and 42°C'),
  }),
});

export class ProfileController {
  public static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const profile = await prisma.profile.findUnique({
        where: { id: userId },
        include: {
          user: {
            select: {
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
      });

      if (!profile) {
        throw new AppError('Profile not found', 404);
      }

      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  }

  public static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const {
        name,
        age,
        gender,
        phone,
        emergencyContactName,
        emergencyContactPhone,
        heartRateThreshold,
        temperatureThreshold,
      } = req.body;

      const updatedProfile = await prisma.profile.update({
        where: { id: userId },
        data: {
          name,
          age,
          gender,
          phone,
          emergencyContactName,
          emergencyContactPhone,
          heartRateThreshold,
          temperatureThreshold,
        },
      });

      res.status(200).json({
        message: 'Profile updated successfully',
        profile: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  }
}
