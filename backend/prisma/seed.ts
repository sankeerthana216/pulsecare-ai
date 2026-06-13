import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing records
  await prisma.refreshToken.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.healthReading.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  // Hashes for passwords
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@pulsecare.ai',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const doctor = await prisma.user.create({
    data: {
      email: 'doctor@pulsecare.ai',
      passwordHash,
      role: 'DOCTOR',
    },
  });

  const patient = await prisma.user.create({
    data: {
      email: 'patient@pulsecare.ai',
      passwordHash,
      role: 'PATIENT',
    },
  });

  // 2. Create Profiles
  await prisma.profile.create({
    data: {
      id: admin.id,
      name: 'Dr. Jane Smith (Admin)',
      age: 42,
      gender: 'FEMALE',
      phone: '+15551234567',
      emergencyContactName: 'John Smith',
      emergencyContactPhone: '+15557654321',
      heartRateThreshold: 120,
      temperatureThreshold: 38.5,
    },
  });

  await prisma.profile.create({
    data: {
      id: doctor.id,
      name: 'Dr. Robert Carter',
      age: 48,
      gender: 'MALE',
      phone: '+15552345678',
      emergencyContactName: 'Mary Carter',
      emergencyContactPhone: '+15558765432',
      heartRateThreshold: 110,
      temperatureThreshold: 38.2,
    },
  });

  const patientProfile = await prisma.profile.create({
    data: {
      id: patient.id,
      name: 'John Doe',
      age: 67,
      gender: 'MALE',
      phone: '+15553456789',
      emergencyContactName: 'Sarah Doe (Daughter)',
      emergencyContactPhone: '+15559876543',
      heartRateThreshold: 100, // lower threshold to trigger warnings easily
      temperatureThreshold: 37.8,
    },
  });

  // 3. Generate 7 days of historical health readings
  console.log('Generating historical health readings...');
  const now = new Date();
  const readingsData = [];

  for (let i = 7; i >= 0; i--) {
    const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // Create 4 readings per day
    for (let hour = 0; hour < 24; hour += 6) {
      const readingDate = new Date(dayDate.getTime());
      readingDate.setHours(hour, 0, 0, 0);

      // Base vitals
      let heartRate = 72 + Math.floor(Math.random() * 12) - 6; // 66 - 78
      let temperature = 36.6 + Math.round(Math.random() * 4) / 10 - 0.2; // 36.4 - 36.8
      let oxygenLevel = 97 + Math.floor(Math.random() * 3); // 97 - 99
      let bloodPressure = '120/80';
      let status = 'NORMAL';
      let aiAnalysis = 'Vitals are stable and within normal parameters.';

      // Introduce occasional abnormalities for simulation realism
      if (i === 4 && hour === 12) {
        // High fever / heart rate warning
        heartRate = 105;
        temperature = 38.2;
        status = 'ELEVATED';
        aiAnalysis = 'Slight fever detected with matching elevated heart rate. Advised hydration and rest.';
      } else if (i === 1 && hour === 18) {
        // Critical anomaly
        heartRate = 175;
        temperature = 39.4;
        oxygenLevel = 88;
        bloodPressure = '145/95';
        status = 'EMERGENCY';
        aiAnalysis = 'CRITICAL: Severe tachycardia, high fever, and hypoxia detected. Dispatched emergency overlays and alerts.';
      }

      readingsData.push({
        userId: patient.id,
        heartRate,
        temperature,
        oxygenLevel,
        bloodPressure,
        aiAnalysis,
        status,
        createdAt: readingDate,
      });
    }
  }

  // Create health readings and capture their creation details
  for (const reading of readingsData) {
    const createdReading = await prisma.healthReading.create({
      data: reading,
    });

    // If reading is warning or emergency, trigger corresponding alerts
    if (reading.status === 'ELEVATED') {
      await prisma.alert.create({
        data: {
          userId: patient.id,
          readingId: createdReading.id,
          type: 'FEVER',
          message: `Elevated body temperature (${reading.temperature}°C) and mild tachycardia detected.`,
          severity: 'WARNING',
          resolved: true,
          createdAt: reading.createdAt,
        },
      });
    } else if (reading.status === 'EMERGENCY') {
      await prisma.alert.create({
        data: {
          userId: patient.id,
          readingId: createdReading.id,
          type: 'HYPOXIA',
          message: `CRITICAL: Extremely low oxygen levels (${reading.oxygenLevel}%) and heart rate (${reading.heartRate} BPM) detected.`,
          severity: 'CRITICAL',
          resolved: false,
          createdAt: reading.createdAt,
        },
      });
    }
  }

  console.log('Seeding complete successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
