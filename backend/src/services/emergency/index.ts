import { prisma } from '../../config/db';
import { NotificationService } from '../notification';
import { WebSocketService } from '../websocket';

export interface VitalsIntake {
  heartRate: number;
  temperature: number;
  oxygenLevel: number;
  bloodPressure: string;
}

export class EmergencyEngine {
  /**
   * Analyze vitals data, check thresholds, create database alerts, and broadcast notifications
   */
  public static async analyze(
    userId: string,
    vitals: VitalsIntake,
    readingId: string
  ): Promise<{
    status: 'NORMAL' | 'ELEVATED' | 'EMERGENCY';
    alertCreated: boolean;
    severity?: 'WARNING' | 'CRITICAL';
    message?: string;
  }> {
    // 1. Fetch patient profile to check custom thresholds
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    const hrThreshold = profile?.heartRateThreshold || 100;
    const tempThreshold = profile?.temperatureThreshold || 38.0;

    let severity: 'WARNING' | 'CRITICAL' | null = null;
    let alertType = '';
    let alertMessage = '';

    // 2. Perform Critical Anomaly Analysis (CRITICAL Severity)
    if (vitals.heartRate > 170) {
      severity = 'CRITICAL';
      alertType = 'TACHYCARDIA';
      alertMessage = `CRITICAL: Severe tachycardia detected! Heart rate is extremely high at ${vitals.heartRate} BPM (Threshold is 170 BPM).`;
    } else if (vitals.heartRate < 45) {
      severity = 'CRITICAL';
      alertType = 'BRADYCARDIA';
      alertMessage = `CRITICAL: Severe bradycardia detected! Heart rate is extremely low at ${vitals.heartRate} BPM (Threshold is 45 BPM).`;
    } else if (vitals.temperature > 39.0) {
      severity = 'CRITICAL';
      alertType = 'FEVER';
      alertMessage = `CRITICAL: Hyperpyrexia (severe fever) detected! Body temperature is extremely high at ${vitals.temperature}°C.`;
    } else if (vitals.oxygenLevel < 90) {
      severity = 'CRITICAL';
      alertType = 'HYPOXIA';
      alertMessage = `CRITICAL: Severe hypoxia detected! Blood oxygen saturation is dangerously low at ${vitals.oxygenLevel}% (Normal is 95-100%).`;
    }
    // 3. Perform Anomaly Warnings (WARNING Severity)
    else if (vitals.heartRate > hrThreshold) {
      severity = 'WARNING';
      alertType = 'ELEVATED_HEART_RATE';
      alertMessage = `Warning: Elevated heart rate detected at ${vitals.heartRate} BPM (Your threshold is ${hrThreshold} BPM).`;
    } else if (vitals.temperature > tempThreshold) {
      severity = 'WARNING';
      alertType = 'FEVER_WARNING';
      alertMessage = `Warning: Elevated body temperature detected at ${vitals.temperature}°C (Your threshold is ${tempThreshold}°C).`;
    } else if (vitals.oxygenLevel < 95) {
      severity = 'WARNING';
      alertType = 'MILD_HYPOXIA';
      alertMessage = `Warning: Mild blood oxygen saturation drop detected at ${vitals.oxygenLevel}% (Normal ranges 95-100%).`;
    }

    // 4. Map final status category
    let status: 'NORMAL' | 'ELEVATED' | 'EMERGENCY' = 'NORMAL';
    if (severity === 'CRITICAL') {
      status = 'EMERGENCY';
    } else if (severity === 'WARNING') {
      status = 'ELEVATED';
    }

    // 5. If alert detected, save to DB and notify
    if (severity && alertType && alertMessage) {
      // Create database Alert entry
      const alert = await prisma.alert.create({
        data: {
          userId,
          readingId,
          type: alertType,
          message: alertMessage,
          severity,
          resolved: false,
        },
      });

      // Emit active emergency trigger via WebSocket
      WebSocketService.emitToUser(userId, 'emergency-triggered', {
        alertId: alert.id,
        type: alertType,
        message: alertMessage,
        severity,
        vitals,
        emergencyContact: profile
          ? {
              name: profile.emergencyContactName,
              phone: profile.emergencyContactPhone,
            }
          : null,
      });

      // Dispatch browser, email, and SMS notifications
      await NotificationService.sendAlert({
        userId,
        title: `${severity}: Health Alert Triggered`,
        message: alertMessage,
        severity,
        vitals,
      });

      return {
        status,
        alertCreated: true,
        severity,
        message: alertMessage,
      };
    }

    return {
      status,
      alertCreated: false,
    };
  }
}
