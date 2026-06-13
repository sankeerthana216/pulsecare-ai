import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';

export class UsersController {
  /**
   * Get all users with their profiles (accessible by DOCTOR or ADMIN)
   */
  public static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: 'PATIENT', // Only list patient records
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          profile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific user profile and recent readings (accessible by self, DOCTOR, or ADMIN)
   */
  public static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      if (!currentUser) {
        throw new AppError('Unauthorized', 401);
      }

      // Restrict patients to only view their own profile, doctors/admins can view any
      if (currentUser.role === 'PATIENT' && currentUser.id !== id) {
        throw new AppError('Access forbidden. Cannot view other patient data.', 403);
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          profile: true,
          readings: {
            take: 10,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}
