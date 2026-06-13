import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  Activity, 
  Thermometer, 
  Flame,
  FileDown,
  Sparkles
} from 'lucide-react';

const Analytics: React.FC = () => {
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [exportType, setExportType] = useState<'weekly' | 'monthly' | 'emergency'>('weekly');
  const [exporting, setExporting] = useState(false);

  // Fetch trends analytics data
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['trends', range],
    queryFn: () => apiRequest(`/analytics/trends?range=${range}`),
  });

  // Handle PDF/CSV report downloads with Authorization headers
  const handleExport = async () => {
    setExporting(true);
    const token = localStorage.getItem('accessToken');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const url = `${apiUrl}/analytics/export?format=${exportFormat}&reportType=${exportType}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export download failed');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute(
        'download',
        `PulseCare_Report_${exportType}_${new Date().toISOString().split('T')[0]}.${exportFormat}`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to export document:', err);
      alert('Failed to generate health report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const stats = analyticsData?.stats || {
    averageHeartRate: 0,
    maxHeartRate: 0,
    minHeartRate: 0,
    averageTemperature: 0,
    maxTemperature: 0,
    minTemperature: 0,
    averageOxygenLevel: 0,
    alertCount: 0,
    healthScore: 100,
  };

  const chartData = (analyticsData?.readings || []).map((r: any) => ({
    time: new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
          ' ' + new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    heartRate: r.heartRate,
    temperature: r.temperature,
    oxygenLevel: r.oxygenLevel,
  }));

  const ranges: { value: typeof range; label: string }[] = [
    { value: 'daily', label: 'Last 24 Hours' },
    { value: 'weekly', label: 'Last 7 Days' },
    { value: 'monthly', label: 'Last 30 Days' },
    { value: 'quarterly', label: 'Last 90 Days' },
  ];

  return (
    <div className="space-y-6">
      {/* Range filter selector header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Analytics & Trends</h2>
          <p className="text-sm text-slate-400">View aggregates and download clinical records</p>
        </div>

        {/* Range toggles */}
        <div className="flex bg-slate-900 border border-white/5 p-1 rounded-xl">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                range === r.value 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 flex flex-col justify-center items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          <p className="text-sm text-slate-500">Generating analytics metrics...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center text-red-400 rounded-3xl border-red-500/15">
          Failed to load health analytics trends.
        </div>
      ) : (
        <>
          {/* Stats Summary Panel */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Heart Rate Stats */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <span>Avg Heart Rate</span>
                <Activity className="h-4 w-4 text-emergency" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-bold text-3xl text-white">{stats.averageHeartRate}</span>
                <span className="text-xs text-slate-400">BPM</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Min: <strong className="text-slate-400">{stats.minHeartRate}</strong> | Max: <strong className="text-slate-400">{stats.maxHeartRate}</strong>
              </div>
            </div>

            {/* Temperature Stats */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <span>Avg Temperature</span>
                <Thermometer className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-bold text-3xl text-white">{stats.averageTemperature}</span>
                <span className="text-xs text-slate-400">°C</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Min: <strong className="text-slate-400">{stats.minTemperature}</strong> | Max: <strong className="text-slate-400">{stats.maxTemperature}</strong>
              </div>
            </div>

            {/* Oxygen Stats */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <span>Avg Oxygen SpO2</span>
                <Flame className="h-4 w-4 text-warning" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-bold text-3xl text-white">{stats.averageOxygenLevel}</span>
                <span className="text-xs text-slate-400">%</span>
              </div>
              <span className="text-[10px] text-primary block font-semibold">Healthy Range (95-100)</span>
            </div>

            {/* Alert Event count */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <span>Alerts Logged</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-bold text-3xl text-white">{stats.alertCount}</span>
                <span className="text-xs text-slate-400">Events</span>
              </div>
              <span className="text-[10px] text-slate-500 block">Total anomalies caught</span>
            </div>
          </div>

          {/* Recharts Vital Graphs */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Heart Rate trends */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-emergency" />
                Heart Rate Trend (BPM)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="hrColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="time" fontSize={9} stroke="rgba(255,255,255,0.2)" />
                    <YAxis domain={[50, 180]} fontSize={9} stroke="rgba(255,255,255,0.2)" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 11 }} />
                    <Area type="monotone" dataKey="heartRate" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#hrColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Temperature trends */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Thermometer className="h-4 w-4 text-primary" />
                Temperature Trend (°C)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="time" fontSize={9} stroke="rgba(255,255,255,0.2)" />
                    <YAxis domain={[35, 41]} fontSize={9} stroke="rgba(255,255,255,0.2)" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 11 }} />
                    <Line type="monotone" dataKey="temperature" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Export Report Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 max-w-2xl">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
              <FileDown className="h-4.5 w-4.5 text-primary" />
              Download Clinical Health Report
            </h3>
            
            <div className="grid sm:grid-cols-3 gap-4 items-center">
              {/* Type */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Report Period</label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="weekly">Weekly Report</option>
                  <option value="monthly">Monthly Report</option>
                  <option value="emergency">Emergency Incident Report</option>
                </select>
              </div>

              {/* Format */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">File Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="pdf">Adobe PDF Format</option>
                  <option value="csv">Excel CSV Format</option>
                </select>
              </div>

              {/* Export button */}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center justify-center gap-1.5 w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-primary/15 transition-all duration-200 mt-4 sm:mt-4"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Generating...' : 'Download Report'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
