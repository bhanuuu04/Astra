'use client';

import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Activity,
  RefreshCw,
  Loader2,
  Play,
  Settings,
  Trash2,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConnectorData {
  id: string;
  name: string;
  connector_type: string;
  status: 'active' | 'degraded' | 'error' | 'unconfigured' | 'revoked';
  permitted_scopes?: string[];
  last_successful_sync_at?: string | null;
  last_health_check_at?: string | null;
  error_message?: string | null;
  rate_limit_rpm?: number;
}

interface ConnectorStatusCardProps {
  connector: ConnectorData;
  onHealthCheck: (id: string) => Promise<void> | void;
  isChecking?: boolean;
  onSync?: (id: string) => Promise<void> | void;
  isSyncing?: boolean;
  onConfigure?: (connector: ConnectorData) => void;
  onDelete?: (id: string) => Promise<void> | void;
  isDeleting?: boolean;
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

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  active: {
    icon: CheckCircle,
    color: 'text-[#0f7b6c]',
    bg: 'bg-[#0f7b6c]/10',
    border: 'border-[#0f7b6c]/30',
    label: 'Active',
  },
  degraded: {
    icon: AlertCircle,
    color: 'text-[#d97706]',
    bg: 'bg-[#d97706]/10',
    border: 'border-[#d97706]/30',
    label: 'Degraded',
  },
  error: {
    icon: XCircle,
    color: 'text-[#eb5757]',
    bg: 'bg-[#eb5757]/10',
    border: 'border-[#eb5757]/30',
    label: 'Error',
  },
  unconfigured: {
    icon: Activity,
    color: 'text-[#787774]',
    bg: 'bg-[#f7f6f3]',
    border: 'border-[#e3e2e0]',
    label: 'Unconfigured',
  },
};

export function ConnectorStatusCard({
  connector,
  onHealthCheck,
  isChecking = false,
  onSync,
  isSyncing = false,
  onConfigure,
  onDelete,
  isDeleting = false,
}: ConnectorStatusCardProps) {
  const isTemplate = connector.id.startsWith('conn-');
  const isPushConnector = ['meta_graph', 'meta_graph_api', 'meta_webhook', 'instagram'].includes(connector.connector_type.toLowerCase());
  const config = STATUS_CONFIG[connector.status] || STATUS_CONFIG.unconfigured;
  const Icon = config.icon;

  return (
    <div className={cn(
      'p-5 rounded-[8px] border bg-white transition-all flex flex-col justify-between group shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#9b9a97]',
      config.border
    )}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-[6px] flex items-center justify-center border shrink-0',
              config.bg,
              config.border
            )}>
              <Icon className={cn('w-5 h-5', config.color)} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#37352f] flex items-center gap-2">
                <span>{connector.name}</span>
                {isTemplate && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#d97706]/10 border border-[#d97706]/30 text-[#d97706] font-mono">
                    Template
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#787774] uppercase font-mono tracking-wider">
                {connector.connector_type.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={cn(
              'px-2 py-0.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-wider border',
              config.bg,
              config.color,
              config.border
            )}>
              {config.label}
            </span>
            {!isTemplate && onDelete && (
              <button
                onClick={() => onDelete(connector.id)}
                disabled={isDeleting}
                title="Delete connector"
                className="p-1 rounded text-[#9b9a97] hover:text-[#eb5757] hover:bg-[#eb5757]/10 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3 bg-[#f7f6f3] p-3 rounded-[6px] border border-[#e3e2e0]">
          <div>
            <p className="text-[10px] text-[#787774] uppercase tracking-wider mb-0.5 font-semibold">Last Sync</p>
            <p suppressHydrationWarning className="text-xs text-[#37352f] font-mono">
              {formatRelativeTime(connector.last_successful_sync_at)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#787774] uppercase tracking-wider mb-0.5 font-semibold">Rate Limit</p>
            <p className="text-xs text-[#37352f] font-mono">
              {connector.rate_limit_rpm ? `${connector.rate_limit_rpm} req/m` : 'Default'}
            </p>
          </div>
        </div>

        {/* Scopes Badge Strip */}
        {connector.permitted_scopes && connector.permitted_scopes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {connector.permitted_scopes.map((scope) => (
              <span
                key={scope}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#f7f6f3] text-[10px] text-[#787774] font-mono border border-[#e3e2e0]"
              >
                <Shield className="w-2.5 h-2.5 text-[#0f7b6c]" />
                {scope}
              </span>
            ))}
          </div>
        )}

        {/* Error Message */}
        {connector.error_message && (
          <div className="p-2.5 rounded-[6px] bg-[#eb5757]/10 border border-[#eb5757]/30 mb-4">
            <p className="text-xs text-[#eb5757] font-mono leading-relaxed">{connector.error_message}</p>
          </div>
        )}
        {isPushConnector && !isTemplate && (
          <div className="mb-4 rounded-[6px] border border-[#0f7b6c]/20 bg-[#0f7b6c]/5 p-2.5">
            <p className="text-xs leading-relaxed text-[#0f7b6c]">Push/webhook source. Configure Meta webhook delivery separately; ASTRA does not poll public Instagram accounts.</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-3 border-t border-[#e3e2e0] flex flex-col gap-2">
        {isTemplate ? (
          <button
            onClick={() => onConfigure && onConfigure(connector)}
            className="w-full px-3 py-2 rounded-[6px] bg-[#0f7b6c] hover:bg-[#0c6357] text-xs font-medium text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure Vault Credentials</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onHealthCheck(connector.id)}
              disabled={isChecking}
              className="px-3 py-2 rounded-[6px] bg-white hover:bg-[#f7f6f3] border border-[#e3e2e0] text-xs font-medium text-[#37352f] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isChecking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0f7b6c]" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-[#787774]" />
              )}
              <span>{isChecking ? 'Checking...' : 'Health Check'}</span>
            </button>

            {onSync && (
              <button
                onClick={() => onSync(connector.id)}
                disabled={isSyncing || connector.status === 'unconfigured'}
                className="px-3 py-2 rounded-[6px] bg-[#0f7b6c]/10 hover:bg-[#0f7b6c]/20 border border-[#0f7b6c]/30 text-xs font-medium text-[#0f7b6c] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0f7b6c]" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-[#0f7b6c]" />
                )}
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
