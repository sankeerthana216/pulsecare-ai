import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Calendar,
  XCircle,
  Activity,
  Heart,
  Flame,
  Check
} from 'lucide-react';

const Alerts: React.FC = () => {
  const queryClient = useQueryClient();

  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'WARNING' | 'CRITICAL'>('ALL');
  const [resolvedFilter, setResolvedFilter] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED'>('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Build filter query strings
  const getQueryString = () => {
    let query = `?page=${page}&limit=${limit}`;
    if (severityFilter !== 'ALL') {
      query += `&severity=${severityFilter}`;
    }
    if (resolvedFilter !== 'ALL') {
      query += `&resolved=${resolvedFilter === 'RESOLVED'}`;
    }
    return query;
  };

  // Fetch paginated alerts
  const { data: alertsData, isLoading, error } = useQuery({
    queryKey: ['alerts', severityFilter, resolvedFilter, page],
    queryFn: () => apiRequest(`/alerts${getQueryString()}`),
  });

  // Mutate: Resolve an alert
  const resolveMutation = useMutation({
    mutationFn: (alertId: string) => apiRequest(`/alerts/${alertId}/resolve`, { method: 'PUT' }),
    onSuccess: () => {
      // Refresh current alerts page cache
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const alerts = alertsData?.alerts || [];
  const pagination = alertsData?.pagination || { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Filters and Search Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/20 p-4 border border-white/5 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Severity Filter */}
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-semibold uppercase mr-1">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value as any);
                setPage(1);
              }}
              className="bg-slate-900 border border-white/5 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Levels</option>
              <option value="WARNING">Warnings</option>
              <option value="CRITICAL">Critical Alerts</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 font-semibold uppercase mr-1">Status:</span>
            <select
              value={resolvedFilter}
              onChange={(e) => {
                setResolvedFilter(e.target.value as any);
                setPage(1);
              }}
              className="bg-slate-900 border border-white/5 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNRESOLVED">Unresolved / Active</option>
              <option value="RESOLVED">Resolved Logs</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-semibold">
          Total: <strong className="text-white">{pagination.total}</strong> events found
        </div>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="h-96 flex flex-col justify-center items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          <p className="text-sm text-slate-500">Retrieving alert entries...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center text-red-400 rounded-3xl border-red-500/15">
          Failed to fetch medical alerts database logs.
        </div>
      ) : alerts.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-white/5 flex flex-col items-center justify-center text-slate-400">
          <CheckCircle2 className="h-10 w-10 text-primary mb-3" />
          <h4 className="font-semibold text-white mb-1">No alerts found</h4>
          <p className="text-xs">Quiet is good. All vitals are in normal parameters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert: any) => {
            const isCritical = alert.severity === 'CRITICAL';
            
            return (
              <div 
                key={alert.id}
                className={`glass-panel p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  alert.resolved 
                    ? 'border-white/5 opacity-70' 
                    : isCritical 
                      ? 'border-emergency/30 bg-emergency/5' 
                      : 'border-warning/30 bg-warning/5'
                }`}
              >
                {/* Alert message body */}
                <div className="flex gap-4 items-start">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    alert.resolved
                      ? 'border-slate-700 bg-slate-800 text-slate-400'
                      : isCritical
                        ? 'border-emergency/20 bg-emergency/10 text-red-400'
                        : 'border-warning/20 bg-warning/10 text-warning'
                  }`}>
                    {alert.resolved ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : isCritical ? (
                      <XCircle className="h-5 w-5 text-red-400 animate-pulse" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-semibold text-sm text-white capitalize">
                        {alert.type.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                        isCritical 
                          ? 'bg-emergency/15 text-red-400 border border-red-500/15' 
                          : 'bg-warning/15 text-warning border border-warning/15'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-xl">
                      {alert.message}
                    </p>

                    {/* Vitals snapshot in time */}
                    {alert.reading && (
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2 font-medium">
                        <span className="flex items-center gap-0.5">
                          <Heart className="h-3 w-3 text-red-400" />
                          {alert.reading.heartRate} BPM
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Activity className="h-3 w-3 text-primary" />
                          {alert.reading.temperature}°C
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Flame className="h-3 w-3 text-warning" />
                          {alert.reading.oxygenLevel}% SpO2
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons (Resolve) */}
                {!alert.resolved && (
                  <button
                    onClick={() => resolveMutation.mutate(alert.id)}
                    disabled={resolveMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/10 transition-all duration-200 self-end sm:self-center shrink-0 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Resolve Alert
                  </button>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 border border-white/5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 disabled:opacity-30 disabled:hover:text-slate-400"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 font-semibold">
                Page <strong className="text-white">{page}</strong> of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border border-white/5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 disabled:opacity-30 disabled:hover:text-slate-400"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Alerts;
