import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { WebSocketService } from '../../services/websocket';

export class AlertsController {
  /**
   * Get list of alerts for the user, with filters and pagination
   */
  public static async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      // Query params
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * limit;
      const severity = req.query.severity as string; // WARNING, CRITICAL
      const resolved = req.query.resolved as string; // "true" or "false"

      // Filters
      const whereClause: any = { userId };

      if (severity) {
        whereClause.severity = severity;
      }

      if (resolved !== undefined) {
        whereClause.resolved = resolved === 'true';
      }

      // Execute queries
      const [alerts, total] = await prisma.$transaction([
        prisma.alert.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            reading: true, // Join health reading context
          },
        }),
        prisma.alert.count({ where: whereClause }),
      ]);

      res.status(200).json({
        alerts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve an active alert (mark resolved: true)
   */
  public static async resolveAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      // Verify alert belongs to user or request comes from doctor/admin
      const alert = await prisma.alert.findUnique({
        where: { id },
      });

      if (!alert) {
        throw new AppError('Alert not found', 404);
      }

      if (req.user?.role === 'PATIENT' && alert.userId !== userId) {
        throw new AppError('Access forbidden. Cannot resolve other patient alerts.', 403);
      }

      const updatedAlert = await prisma.alert.update({
        where: { id },
        data: { resolved: true },
        include: { reading: true },
      });

      // Broadcast resolution status to client via WebSocket
      WebSocketService.emitToUser(alert.userId, 'alert-resolved', updatedAlert);

      res.status(200).json({
        message: 'Alert resolved successfully',
        alert: updatedAlert,
      });
    } catch (error) {
      next(error);
    }
  }
}
