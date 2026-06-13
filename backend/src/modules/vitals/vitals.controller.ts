import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { EmergencyEngine } from '../../services/emergency';
import { GeminiService } from '../../services/gemini';
import { WebSocketService } from '../../services/websocket';

// Validator schema for adding vitals
export const addVitalsSchema = z.object({
  body: z.object({
    heartRate: z.number().int().min(30).max(250, 'Heart rate must be between 30 and 250 BPM'),
    temperature: z.number().min(30.0).max(45.0, 'Temperature must be between 30 and 45°C'),
    oxygenLevel: z.number().int().min(50).max(100, 'Oxygen saturation must be between 50 and 100%'),
    bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/, 'Blood pressure must be in format SBP/DBP (e.g. 120/80)'),
  }),
});

export class VitalsController {
  /**
   * Manual entry of vitals from dashboard
   */
  public static async recordVitals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { heartRate, temperature, oxygenLevel, bloodPressure } = req.body;

      const result = await VitalsController.processTelemetryIntake(userId, {
        heartRate,
        temperature,
        oxygenLevel,
        bloodPressure,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * IoT Wearable integration endpoint (supports API Key / Device Auth)
   */
  public static async recordIoTTelemetry(req: Request, res: Response, next: NextFunction) {
    try {
      // For IoT, we allow auth via X-Device-Key header to identify the patient
      const deviceKey = req.headers['x-device-key'] as string;
      let userId: string | undefined;

      if (deviceKey) {
        // Find user by device key. In a full system, user/profile contains a device key mapping.
        // We will query a user whose profile name or email contains this token for demonstration,
        // or support direct query. Let's query by patient profile name containing the key, or we fallback
        // to req.user.id if the device authenticates via standard JWT in Bearer token.
        const profile = await prisma.profile.findFirst({
          where: { phone: { contains: deviceKey } }, // Phone serves as a simple device identifier in this demo database
        });
        if (profile) {
          userId = profile.id;
        }
      }

      // Fallback to JWT auth if header is not present
      if (!userId && req.user) {
        userId = req.user.id;
      }

      if (!userId) {
        throw new AppError('Device not authenticated or mapped to any patient.', 401);
      }

      const { heartRate, temperature, oxygenLevel, bloodPressure } = req.body;

      const result = await VitalsController.processTelemetryIntake(userId, {
        heartRate,
        temperature,
        oxygenLevel,
        bloodPressure,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper method to process, save, run emergency rules, and analyze with AI
   */
  private static async processTelemetryIntake(userId: string, vitals: {
    heartRate: number;
    temperature: number;
    oxygenLevel: number;
    bloodPressure: string;
  }) {
    // 1. Fetch user profile to get patient details
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new AppError('Patient profile not found', 404);
    }

    // 2. Create health reading entry with temporary PENDING state
    let reading = await prisma.healthReading.create({
      data: {
        userId,
        heartRate: vitals.heartRate,
        temperature: vitals.temperature,
        oxygenLevel: vitals.oxygenLevel,
        bloodPressure: vitals.bloodPressure,
        status: 'NORMAL',
        aiAnalysis: 'Analyzing...',
      },
    });

    // 3. Analyze readings in Emergency Engine (saves DB Alerts, triggers WebSocket/Push if abnormal)
    const analysis = await EmergencyEngine.analyze(userId, vitals, reading.id);

    // 4. Call Gemini AI Service (or rule-based fallback) for vital summary description
    const aiMessage = await GeminiService.generateVitalsAnalysis(
      { name: profile.name, age: profile.age, gender: profile.gender },
      vitals,
      analysis.status
    );

    // 5. Update HealthReading with final clinical status & AI message
    reading = await prisma.healthReading.update({
      where: { id: reading.id },
      data: {
        status: analysis.status,
        aiAnalysis: aiMessage,
      },
    });

    // 6. Push real-time vitals update to dashboard via WebSocket Room
    WebSocketService.emitToUser(userId, 'vitals-update', reading);

    return {
      message: 'Telemetry recorded successfully',
      reading,
      alertCreated: analysis.alertCreated,
      alertMessage: analysis.message,
      emergencyContact: {
        name: profile.emergencyContactName,
        phone: profile.emergencyContactPhone,
      },
    };
  }

  /**
   * Get health readings history with search, pagination, and status filters
   */
  public static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      // Query params
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * limit;
      const status = req.query.status as string; // NORMAL, ELEVATED, EMERGENCY
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Construct filter parameters
      const whereClause: any = { userId };

      if (status) {
        whereClause.status = status;
      }

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          whereClause.createdAt.lte = new Date(endDate);
        }
      }

      // Query database
      const [readings, total] = await prisma.$transaction([
        prisma.healthReading.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.healthReading.count({ where: whereClause }),
      ]);

      res.status(200).json({
        readings,
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
}
