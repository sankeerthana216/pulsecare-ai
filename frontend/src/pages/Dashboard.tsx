import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { apiRequest } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Activity, 
  Thermometer, 
  Flame, 
  Heart, 
  Sparkles, 
  Play, 
  Pause,
  AlertTriangle,
  FileHeart
} from 'lucide-react';
import { motion } from 'framer-motion';

// Telemetry card component
interface VitalCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ComponentType<any>;
  accentColor: 'primary' | 'warning' | 'emergency';
  isAbnormal?: boolean;
}

const VitalCard: React.FC<VitalCardProps> = ({ title, value, unit, icon: Icon, accentColor, isAbnormal }) => {
  const accentClasses = {
    primary: 'text-primary border-primary/20 bg-primary/5',
    warning: 'text-warning border-warning/20 bg-warning/5',
    emergency: 'text-emergency border-emergency/20 bg-emergency/5 border-red-500/30'
  };

  return (
    <div className={`glass-panel p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden`}>
      <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wider">
        <span>{title}</span>
        <div className={`p-1.5 rounded-lg border ${accentClasses[accentColor]}`}>
          <Icon className={`h-4 w-4 ${isAbnormal && accentColor === 'emergency' ? 'animate-pulse' : ''}`} />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className={`font-display font-bold text-4xl tracking-tight ${
          accentColor === 'emergency' ? 'text-red-400' : accentColor === 'warning' ? 'text-warning' : 'text-primary'
        } ${isAbnormal ? 'vital-num-pulse' : ''}`}>
          {value}
        </span>
        <span className="text-slate-400 text-xs font-semibold">{unit}</span>
      </div>

      {isAbnormal && (
        <span className="absolute right-4 bottom-4 h-2 w-2 rounded-full bg-emergency animate-ping"></span>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { latestVitalsUpdate } = useSocket();

  const [autoSimulation, setAutoSimulation] = useState(false);
  const autoSimTimer = useRef<NodeJS.Timeout | null>(null);

  // Vitals State tracker (falls back to DB reading on load, then updates via Socket/Intake)
  const [currentVitals, setCurrentVitals] = useState({
    heartRate: 72,
    temperature: 36.6,
    oxygenLevel: 98,
    bloodPressure: '120/80',
    status: 'NORMAL',
    aiAnalysis: 'Vitals stable. Toggle Auto Stream to run simulation.'
  });

  // 1. Fetch latest reading from database
  const { data: latestReadingDb, isLoading: dbLoading } = useQuery({
    queryKey: ['latest-reading'],
    queryFn: () => apiRequest('/vitals/history?page=1&limit=1'),
  });

  // 2. Fetch trends stats to show health score
  const { data: trendStats } = useQuery({
    queryKey: ['health-trends'],
    queryFn: () => apiRequest('/analytics/trends?range=weekly'),
  });

  // Sync state with Database Reading on load
  useEffect(() => {
    if (latestReadingDb?.readings?.[0]) {
      const dbRead = latestReadingDb.readings[0];
      setCurrentVitals({
        heartRate: dbRead.heartRate,
        temperature: dbRead.temperature,
        oxygenLevel: dbRead.oxygenLevel,
        bloodPressure: dbRead.bloodPressure,
        status: dbRead.status,
        aiAnalysis: dbRead.aiAnalysis
      });
    }
  }, [latestReadingDb]);

  // Sync state with Real-time WebSocket telemetry pushes
  useEffect(() => {
    if (latestVitalsUpdate) {
      setCurrentVitals({
        heartRate: latestVitalsUpdate.heartRate,
        temperature: latestVitalsUpdate.temperature,
        oxygenLevel: latestVitalsUpdate.oxygenLevel,
        bloodPressure: latestVitalsUpdate.bloodPressure,
        status: latestVitalsUpdate.status,
        aiAnalysis: latestVitalsUpdate.aiAnalysis
      });
      // Invalidate trends to refresh health score
      queryClient.invalidateQueries({ queryKey: ['health-trends'] });
    }
  }, [latestVitalsUpdate, queryClient]);

  // 3. Mutate (Post) new health readings
  const vitalsMutation = useMutation({
    mutationFn: (vitalsPayload: any) => apiRequest('/vitals', { method: 'POST', bodyData: vitalsPayload }),
    onSuccess: (data) => {
      // Invalidate history query cache
      queryClient.invalidateQueries({ queryKey: ['latest-reading'] });
    }
  });

  // Wearable Telemetry simulator logic
  const generateNextVitals = (forceAnomaly = false) => {
    // Anomaly values vs Normal values generator
    const generateAnomaly = Math.random() < 0.08 || forceAnomaly;
    
    let heartRate = currentVitals.heartRate + Math.floor(Math.random() * 8) - 4; // drift
    let temperature = currentVitals.temperature + Math.round((Math.random() * 0.4 - 0.2) * 10) / 10;
    let oxygenLevel = 97 + Math.floor(Math.random() * 3); // 97-99
    let bloodPressure = '120/80';

    if (generateAnomaly) {
      // Pick random anomaly type
      const choice = Math.floor(Math.random() * 3);
      if (choice === 0) {
        heartRate = 178; // Tachycardia
      } else if (choice === 1) {
        temperature = 39.4; // High fever
      } else {
        oxygenLevel = 87; // Severe hypoxia
        bloodPressure = '145/95';
      }
    }

    // Keep numbers within safe physiological bounds
    heartRate = Math.max(40, Math.min(200, heartRate));
    temperature = Math.round(Math.max(34.0, Math.min(42.5, temperature)) * 10) / 10;
    oxygenLevel = Math.max(70, Math.min(100, oxygenLevel));

    return { heartRate, temperature, oxygenLevel, bloodPressure };
  };

  const executeVitalsIntake = (forceAnomaly = false) => {
    const nextVitals = generateNextVitals(forceAnomaly);
    vitalsMutation.mutate(nextVitals);
  };

  // Toggle client simulation intervals
  const toggleAutoSimulation = () => {
    if (autoSimulation) {
      if (autoSimTimer.current) clearInterval(autoSimTimer.current);
      setAutoSimulation(false);
    } else {
      setAutoSimulation(true);
      executeVitalsIntake(); // Fire first immediately
      autoSimTimer.current = setInterval(() => {
        executeVitalsIntake();
      }, 6000); // Ingest telemetry every 6 seconds
    }
  };

  useEffect(() => {
    return () => {
      if (autoSimTimer.current) clearInterval(autoSimTimer.current);
    };
  }, []);

  const healthScore = trendStats?.stats?.healthScore || 100;
  const isEmergency = currentVitals.status === 'EMERGENCY';
  const isElevated = currentVitals.status === 'ELEVATED';

  // Determine status color tags
  const statusColor = isEmergency 
    ? 'bg-emergency/15 text-red-400 border-red-500/25' 
    : isElevated 
      ? 'bg-warning/15 text-warning border-warning/25' 
      : 'bg-primary/10 text-primary border-primary/20';

  return (
    <div className="space-y-6">
      {/* Header Info Section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Live Dashboard</h2>
          <p className="text-sm text-slate-400">Stream vitals or run wearable simulation below</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mock Anomaly Injector for Testing */}
          <button
            onClick={() => executeVitalsIntake(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-200"
            title="Force critical vitals anomaly to trigger emergency overlay"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Inject Anomaly
          </button>

          {/* Take Manual Intake Reading */}
          <button
            onClick={() => executeVitalsIntake(false)}
            disabled={vitalsMutation.isPending}
            className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-white rounded-full transition-all duration-200 disabled:opacity-50"
          >
            {vitalsMutation.isPending ? 'Ingesting...' : 'Take Reading'}
          </button>

          {/* Simulator Toggle */}
          <button
            onClick={toggleAutoSimulation}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-full border transition-all duration-200 ${
              autoSimulation 
                ? 'border-primary bg-primary/10 text-primary' 
                : 'border-white/10 text-slate-400 hover:bg-white/5'
            }`}
          >
            {autoSimulation ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                Auto Stream On
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Auto Stream Off
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid Widgets */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Side: Vitals Grid */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Heart Rate Widget */}
            <VitalCard
              title="Heart Rate"
              value={dbLoading ? '...' : currentVitals.heartRate}
              unit="BPM"
              icon={Heart}
              accentColor={currentVitals.heartRate > 100 || currentVitals.heartRate < 50 ? 'emergency' : 'primary'}
              isAbnormal={currentVitals.heartRate > 100 || currentVitals.heartRate < 50}
            />

            {/* Temperature Widget */}
            <VitalCard
              title="Body Temperature"
              value={dbLoading ? '...' : currentVitals.temperature}
              unit="°C"
              icon={Thermometer}
              accentColor={currentVitals.temperature > 37.8 ? 'warning' : 'primary'}
              isAbnormal={currentVitals.temperature > 37.8}
            />

            {/* Oxygen Saturation SpO2 Widget */}
            <VitalCard
              title="Blood Oxygen (SpO2)"
              value={dbLoading ? '...' : currentVitals.oxygenLevel}
              unit="%"
              icon={Activity}
              accentColor={currentVitals.oxygenLevel < 95 ? 'emergency' : 'primary'}
              isAbnormal={currentVitals.oxygenLevel < 95}
            />

            {/* Blood Pressure Widget */}
            <VitalCard
              title="Blood Pressure"
              value={dbLoading ? '...' : currentVitals.bloodPressure}
              unit="mmHg"
              icon={FileHeart}
              accentColor="primary"
            />
          </div>

          {/* AI Clinical Diagnosis Status Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">PulseCare AI Insight</span>
              <span className="text-[10px] text-slate-500">Real-time tele-diagnostics</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Dynamic Status tag */}
              <span className={`px-4 py-1.5 text-xs font-semibold rounded-full border uppercase ${statusColor}`}>
                {currentVitals.status}
              </span>
              
              <div className="flex-1 flex gap-2 items-start">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {currentVitals.aiAnalysis}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Health Score & Device Info */}
        <div className="space-y-6">
          {/* Health Score Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 text-center flex flex-col justify-center items-center relative overflow-hidden min-h-64">
            <h3 className="text-sm font-semibold text-slate-400 mb-6 uppercase tracking-wider">Clinical Health Score</h3>
            
            {/* Circular score bar */}
            <div className="relative h-36 w-36 flex items-center justify-center">
              {/* SVG circular progress */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track Circle */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                {/* Foreground Progress Circle */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke={healthScore > 80 ? '#10b981' : healthScore > 60 ? '#f59e0b' : '#ef4444'} 
                  strokeWidth="6" 
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthScore / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              
              <div className="flex flex-col items-center">
                <span className="font-display font-bold text-4xl text-white tracking-tight">{healthScore}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Index</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-6 max-w-xs leading-relaxed">
              Score is calculated based on abnormal telemetry readings and active warnings logged in the last 7 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
