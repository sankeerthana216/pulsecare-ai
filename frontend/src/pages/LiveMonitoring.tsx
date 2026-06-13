import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { 
  Heart, 
  Thermometer, 
  Activity, 
  Database,
  Radio
} from 'lucide-react';

const LiveMonitoring: React.FC = () => {
  const { latestVitalsUpdate, isConnected } = useSocket();

  // Scrolling data points state (limits to last 15 measurements)
  const [telemetryStream, setTelemetryStream] = useState<any[]>([]);

  // 1. Fetch initial baseline history on mount
  const { data: initialReadings } = useQuery({
    queryKey: ['live-baseline'],
    queryFn: () => apiRequest('/vitals/history?page=1&limit=15'),
  });

  // Hydrate stream from DB logs on mount
  useEffect(() => {
    if (initialReadings?.readings && telemetryStream.length === 0) {
      const formattedBaseline = [...initialReadings.readings]
        .reverse() // Sort chronologically
        .map((r) => ({
          time: new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          heartRate: r.heartRate,
          temperature: r.temperature,
          oxygenLevel: r.oxygenLevel,
        }));
      setTelemetryStream(formattedBaseline);
    }
  }, [initialReadings]);

  // Hook new real-time Socket.IO readings into the scrolling stream
  useEffect(() => {
    if (latestVitalsUpdate) {
      const newPoint = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        heartRate: latestVitalsUpdate.heartRate,
        temperature: latestVitalsUpdate.temperature,
        oxygenLevel: latestVitalsUpdate.oxygenLevel,
      };

      setTelemetryStream((prev) => {
        const updated = [...prev, newPoint];
        if (updated.length > 15) {
          updated.shift(); // Remove oldest data point to maintain scrolling width
        }
        return updated;
      });
    }
  }, [latestVitalsUpdate]);

  const latestVal = telemetryStream[telemetryStream.length - 1] || {
    heartRate: 72,
    temperature: 36.6,
    oxygenLevel: 98
  };

  return (
    <div className="space-y-6">
      {/* Stream status header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Live Telemetry Stream</h2>
          <p className="text-sm text-slate-400">Continuous wearable sensor feed (scrolling ECG chart)</p>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${
          isConnected 
            ? 'bg-primary/10 border-primary/20 text-primary' 
            : 'bg-slate-900 border-white/5 text-slate-400'
        }`}>
          <Radio className={`h-4.5 w-4.5 ${isConnected ? 'animate-ping' : ''}`} />
          <span>{isConnected ? 'STREAMING ACTIVE' : 'STREAM STANDBY'}</span>
        </div>
      </div>

      {/* Grid containing Vitals Scrolling Graphs */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Heart Rate Real-Time ECG Line Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm text-slate-300 flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-emergency fill-emergency/20" />
              Electrocardiogram-equivalent Chart
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Vitals Stream</span>
          </div>

          <div className="h-72 w-full">
            {telemetryStream.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryStream}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="time" 
                    fontSize={10} 
                    stroke="rgba(255, 255, 255, 0.3)" 
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[40, 190]} 
                    fontSize={10} 
                    stroke="rgba(255, 255, 255, 0.3)" 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      fontSize: 11
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="heartRate" 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4 }}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 gap-1.5">
                <Database className="h-4 w-4" />
                No readings streamed yet. Use "Take Reading" or auto simulation.
              </div>
            )}
          </div>
        </div>

        {/* Real-time numerical gauges */}
        <div className="space-y-4">
          {/* Heart Rate gauge */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
            <div className="h-12 w-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-emergency shrink-0">
              <Heart className="h-6 w-6 fill-red-500/20 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Pulse Rate</span>
              <span className="font-display font-bold text-2xl text-red-400 mr-1">{latestVal.heartRate}</span>
              <span className="text-xs text-slate-400">BPM</span>
            </div>
            {latestVal.heartRate > 100 && (
              <span className="absolute right-4 top-4 bg-emergency/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-[9px] font-semibold animate-pulse">
                High
              </span>
            )}
          </div>

          {/* Body Temperature gauge */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
            <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-primary shrink-0">
              <Thermometer className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Body Temperature</span>
              <span className="font-display font-bold text-2xl text-primary mr-1">{latestVal.temperature}</span>
              <span className="text-xs text-slate-400">°C</span>
            </div>
          </div>

          {/* Oxygen Gauge */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
            <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-warning shrink-0">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Oxygen (SpO2)</span>
              <span className="font-display font-bold text-2xl text-warning mr-1">{latestVal.oxygenLevel}</span>
              <span className="text-xs text-slate-400">%</span>
            </div>
            {latestVal.oxygenLevel < 95 && (
              <span className="absolute right-4 top-4 bg-emergency/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-[9px] font-semibold animate-pulse">
                Low
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;
