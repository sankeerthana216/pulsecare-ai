import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import PDFDocument from 'pdfkit';

export class AnalyticsController {
  /**
   * Get health metrics trends (heart rate, temperature, oxygen level, alerts, and calculated health score)
   */
  public static async getTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const range = (req.query.range as string) || 'weekly'; // daily, weekly, monthly, quarterly
      
      // Calculate start date based on range
      const now = new Date();
      let startDate = new Date();
      if (range === 'daily') {
        startDate.setHours(now.getHours() - 24);
      } else if (range === 'weekly') {
        startDate.setDate(now.getDate() - 7);
      } else if (range === 'monthly') {
        startDate.setDate(now.getDate() - 30);
      } else if (range === 'quarterly') {
        startDate.setDate(now.getDate() - 90);
      } else {
        throw new AppError('Invalid range parameter. Supported values: daily, weekly, monthly, quarterly.', 400);
      }

      // Fetch readings within date range
      const readings = await prisma.healthReading.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Fetch alerts count
      const alertCount = await prisma.alert.count({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
      });

      if (readings.length === 0) {
        return res.status(200).json({
          readings: [],
          stats: {
            averageHeartRate: 0,
            maxHeartRate: 0,
            minHeartRate: 0,
            averageTemperature: 0,
            maxTemperature: 0,
            minTemperature: 0,
            averageOxygenLevel: 0,
            alertCount,
            healthScore: 100,
          },
        });
      }

      // Aggregate calculations
      let totalHr = 0;
      let maxHr = 0;
      let minHr = 300;
      let totalTemp = 0;
      let maxTemp = 0;
      let minTemp = 100;
      let totalO2 = 0;
      let warningCount = 0;
      let emergencyCount = 0;

      readings.forEach((r) => {
        totalHr += r.heartRate;
        if (r.heartRate > maxHr) maxHr = r.heartRate;
        if (r.heartRate < minHr) minHr = r.heartRate;

        totalTemp += r.temperature;
        if (r.temperature > maxTemp) maxTemp = r.temperature;
        if (r.temperature < minTemp) minTemp = r.temperature;

        totalO2 += r.oxygenLevel;

        if (r.status === 'ELEVATED') warningCount++;
        if (r.status === 'EMERGENCY') emergencyCount++;
      });

      const count = readings.length;
      
      // Calculate dynamic health score
      // Starts at 100, deducts 2 points per elevated reading, 10 points per emergency reading. Bounds: [30, 100]
      let healthScore = 100 - (warningCount * 2 + emergencyCount * 10);
      healthScore = Math.max(30, Math.min(100, healthScore));

      const stats = {
        averageHeartRate: Math.round(totalHr / count),
        maxHeartRate: maxHr,
        minHeartRate: minHr === 300 ? 0 : minHr,
        averageTemperature: Math.round((totalTemp / count) * 10) / 10,
        maxTemperature: maxTemp,
        minTemperature: minTemp === 100 ? 0 : minTemp,
        averageOxygenLevel: Math.round(totalO2 / count),
        alertCount,
        healthScore,
      };

      res.status(200).json({
        readings: readings.map((r) => ({
          id: r.id,
          createdAt: r.createdAt,
          heartRate: r.heartRate,
          temperature: r.temperature,
          oxygenLevel: r.oxygenLevel,
          bloodPressure: r.bloodPressure,
          status: r.status,
        })),
        stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export health metrics reports as PDF or CSV
   */
  public static async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const format = (req.query.format as string) || 'pdf'; // pdf, csv
      const reportType = (req.query.reportType as string) || 'weekly'; // weekly, monthly, emergency

      // Fetch user profile info
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
      });

      if (!profile) {
        throw new AppError('Profile not found', 404);
      }

      // Calculate start date based on reportType
      const now = new Date();
      let startDate = new Date();
      if (reportType === 'weekly') {
        startDate.setDate(now.getDate() - 7);
      } else if (reportType === 'monthly') {
        startDate.setDate(now.getDate() - 30);
      } else if (reportType === 'emergency') {
        startDate.setDate(now.getDate() - 90); // last 90 days of emergency data
      }

      // Fetch data based on filters
      const readingsWhere: any = {
        userId,
        createdAt: { gte: startDate },
      };
      if (reportType === 'emergency') {
        readingsWhere.status = 'EMERGENCY';
      }

      const readings = await prisma.healthReading.findMany({
        where: readingsWhere,
        orderBy: { createdAt: 'desc' },
      });

      const alerts = await prisma.alert.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
          ...(reportType === 'emergency' ? { severity: 'CRITICAL' } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });

      const fileName = `PulseCare_Health_Report_${reportType}_${new Date().toISOString().split('T')[0]}`;

      // 1. GENERATE CSV FORMAT
      if (format === 'csv') {
        let csvContent = 'Date,Heart Rate (BPM),Temperature (C),Oxygen Saturation (%),Blood Pressure,Status,AI Analysis\n';
        
        readings.forEach((r) => {
          const dateStr = r.createdAt.toISOString().replace(/T/, ' ').replace(/\..+/, '');
          const escapedAnalysis = r.aiAnalysis.replace(/"/g, '""');
          csvContent += `"${dateStr}",${r.heartRate},${r.temperature},${r.oxygenLevel},"${r.bloodPressure}","${r.status}","${escapedAnalysis}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}.csv`);
        return res.status(200).send(csvContent);
      }

      // 2. GENERATE PDF FORMAT (via pdfkit drawing)
      if (format === 'pdf') {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}.pdf`);

        doc.pipe(res);

        // Header Background
        doc.rect(0, 0, doc.page.width, 100).fill('#0f172a');

        // Logo
        doc.fillColor('#10b981').fontSize(24).font('Helvetica-Bold').text('PulseCare AI', 50, 35);
        doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('NEXT-GENERATION HEALTH SYSTEM', 50, 65);

        // Right side info
        doc.fillColor('#ffffff').fontSize(9).text('CLINICAL HEALTH REPORT', doc.page.width - 250, 40, { align: 'right', width: 200 });
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, doc.page.width - 250, 55, { align: 'right', width: 200 });

        // Patient profile card
        doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('Patient Information', 50, 130);
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 150).lineTo(doc.page.width - 50, 150).stroke();

        doc.fontSize(10).font('Helvetica');
        doc.text(`Name: ${profile.name}`, 50, 165);
        doc.text(`Age: ${profile.age} yrs`, 50, 180);
        doc.text(`Gender: ${profile.gender}`, 50, 195);
        doc.text(`Phone: ${profile.phone}`, 50, 210);

        doc.text(`Emergency Contact: ${profile.emergencyContactName}`, 250, 165);
        doc.text(`Emergency Phone: ${profile.emergencyContactPhone}`, 250, 180);
        doc.text(`HR Alert Threshold: ${profile.heartRateThreshold} BPM`, 250, 195);
        doc.text(`Temp Alert Threshold: ${profile.temperatureThreshold}°C`, 250, 210);

        // Vitals Overview Stats
        doc.fontSize(16).font('Helvetica-Bold').text('Vitals Overview', 50, 250);
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 270).lineTo(doc.page.width - 50, 270).stroke();

        let avgHr = 0;
        let avgTemp = 0;
        let avgO2 = 0;
        if (readings.length > 0) {
          avgHr = Math.round(readings.reduce((sum, r) => sum + r.heartRate, 0) / readings.length);
          avgTemp = Math.round((readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length) * 10) / 10;
          avgO2 = Math.round(readings.reduce((sum, r) => sum + r.oxygenLevel, 0) / readings.length);
        }

        doc.fontSize(10).font('Helvetica');
        doc.rect(50, 285, 150, 60).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor('#0f172a').font('Helvetica-Bold').text('Avg Heart Rate', 60, 295);
        doc.fontSize(18).fillColor('#10b981').text(`${avgHr} BPM`, 60, 315);

        doc.fontSize(10).font('Helvetica');
        doc.rect(220, 285, 150, 60).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor('#0f172a').font('Helvetica-Bold').text('Avg Temperature', 230, 295);
        doc.fontSize(18).fillColor('#2563eb').text(`${avgTemp}°C`, 230, 315);

        doc.fontSize(10).font('Helvetica');
        doc.rect(390, 285, 150, 60).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor('#0f172a').font('Helvetica-Bold').text('Avg Oxygen Level', 400, 295);
        doc.fontSize(18).fillColor('#ef4444').text(`${avgO2}%`, 400, 315);

        // Vitals History Table
        doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('Telemetry Log (Recent)', 50, 370);
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 390).lineTo(doc.page.width - 50, 390).stroke();

        let tableTop = 405;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Date/Time', 50, tableTop);
        doc.text('Heart Rate', 170, tableTop);
        doc.text('Temp', 240, tableTop);
        doc.text('Oxygen', 290, tableTop);
        doc.text('Blood Press.', 340, tableTop);
        doc.text('Status', 410, tableTop);
        doc.text('AI Summary snippet', 470, tableTop);

        doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, tableTop + 15).lineTo(doc.page.width - 50, tableTop + 15).stroke();

        tableTop += 25;
        doc.font('Helvetica').fontSize(8);
        
        const limitReadings = readings.slice(0, 12); // Show only top 12 to fit on a single page nicely
        limitReadings.forEach((r, idx) => {
          const dateString = r.createdAt.toLocaleDateString() + ' ' + r.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const snippet = r.aiAnalysis.length > 25 ? r.aiAnalysis.substring(0, 22) + '...' : r.aiAnalysis;
          
          doc.text(dateString, 50, tableTop);
          doc.text(`${r.heartRate} BPM`, 170, tableTop);
          doc.text(`${r.temperature}°C`, 240, tableTop);
          doc.text(`${r.oxygenLevel}%`, 290, tableTop);
          doc.text(r.bloodPressure, 340, tableTop);
          
          // Color status based on category
          if (r.status === 'EMERGENCY') {
            doc.fillColor('#ef4444').font('Helvetica-Bold').text(r.status, 410, tableTop).font('Helvetica').fillColor('#0f172a');
          } else if (r.status === 'ELEVATED') {
            doc.fillColor('#f59e0b').font('Helvetica-Bold').text(r.status, 410, tableTop).font('Helvetica').fillColor('#0f172a');
          } else {
            doc.fillColor('#10b981').text(r.status, 410, tableTop).fillColor('#0f172a');
          }

          doc.text(snippet, 470, tableTop);
          tableTop += 18;
        });

        // Incident/Alerts Section if exists
        if (alerts.length > 0) {
          doc.addPage();
          
          // Alerts Header
          doc.rect(0, 0, doc.page.width, 40).fill('#ef4444');
          doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text('TRIGGERED MEDICAL ALERTS RECORD', 50, 15);

          let alertTop = 70;
          doc.fillColor('#0f172a').fontSize(10);
          
          alerts.slice(0, 15).forEach((alert) => {
            const dateStr = alert.createdAt.toLocaleDateString() + ' ' + alert.createdAt.toLocaleTimeString();
            doc.font('Helvetica-Bold').text(`[${alert.severity}] ${alert.type} - ${dateStr}`, 50, alertTop);
            doc.font('Helvetica').fontSize(9).text(alert.message, 50, alertTop + 12);
            doc.text(`Resolved status: ${alert.resolved ? 'RESOLVED' : 'UNRESOLVED / ACTIVE'}`, 50, alertTop + 24);
            
            doc.strokeColor('#f3f4f6').lineWidth(1).moveTo(50, alertTop + 38).lineTo(doc.page.width - 50, alertTop + 38).stroke();
            alertTop += 48;
          });
        }

        // Footer Warning Disclaimer
        doc.fillColor('#94a3b8').fontSize(7).text(
          'Disclaimer: PulseCare AI is for wellness tracking purposes. It is not an alternative for professional hospital diagnosis, medical consultation, or emergency care.',
          50,
          doc.page.height - 40,
          { align: 'center', width: doc.page.width - 100 }
        );

        doc.end();
        return;
      }
      
      throw new AppError('Invalid format requested. Supported values: pdf, csv', 400);
    } catch (error) {
      next(error);
    }
  }
}
