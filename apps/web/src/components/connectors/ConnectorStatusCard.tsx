'use client';

import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Activity,
  Clock,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConnectorData {
  id: string;
  name: string;
  connector_type: string;
  status: 'active' | 'degraded' | 'error' | 'unconfigured';
  last_successful_sync_at?: string | null;
  last_health_check_at?: string | null;
  error_message?: string | null;
  rate_limit_rpm?: number;
}

interface ConnectorStatusCardProps {
  connector: ConnectorData;
  onHealthCheck: (id: string) => Promise<void> | void;
  isChecking?: boolean;
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return 'Never';
  try {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return dateStr;
  }
}

const STATUS_CONFIG = {
  active: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: 'Active',
  },
  degraded: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    label: 'Degraded',
  },
  error: {
    icon: XCircle,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    label: 'Error',
  },
  unconfigured: {
    icon: Activity,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    label: 'Unconfigured',
  },
};

export function ConnectorStatusCard({ connector, onHealthCheck, isChecking = false }: ConnectorStatusCardProps) {
  const config = STATUS_CONFIG[connector.status] || STATUS_CONFIG.unconfigured;
  const Icon = config.icon;

  return (
    <div className={cn(
      'p-5 rounded-xl border bg-slate-900/60 transition-all flex flex-col justify-between',
      config.border
    )}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center border',
              config.bg,
              config.border
            )}>
              <Icon className={cn('w-5 h-5', config.color)} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {connector.name}
              </h3>
              <p className="text-xs text-slate-400 uppercase font-mono tracking-wider">
                {connector.connector_type.replace('_', ' ')}
              </p>
            </div>
          </div>

          <span className={cn(
            'px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border',
            config.bg,
            config.color,
            config.border
          )}>
            {config.label}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 font-semibold">Last Successful Sync</p>
            <p suppressHydrationWarning className="text-xs text-slate-300 font-mono">
              {formatRelativeTime(connector.last_successful_sync_at)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 font-semibold">Rate Limit</p>
            <p className="text-xs text-slate-300 font-mono">
              {connector.rate_limit_rpm ? `${connector.rate_limit_rpm} req/m` : 'Default'}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {connector.error_message && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 mb-4">
            <p className="text-xs text-rose-300 font-mono leading-relaxed">{connector.error_message}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <button
        onClick={() => onHealthCheck(connector.id)}
        disabled={isChecking}
        className="w-full mt-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isChecking ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        ) : (
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
        )}
        <span>{isChecking ? 'Checking Connection...' : 'Run Live Health Check'}</span>
      </button>
    </div>
  );
}
