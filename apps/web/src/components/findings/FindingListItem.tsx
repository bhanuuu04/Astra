'use client';

import React from 'react';
import { DataModeBadge, type DataMode } from '@/components/ui/DataModeBadge';
import { TriageStatusBadge, type TriageStatus } from '@/components/ui/TriageStatusBadge';
import { DemoDataWarning } from '@/components/ui/DemoDataWarning';

interface FindingListItemProps {
  finding: {
    id: string;
    target_identifier: string;
    surface: string;
    data_mode: DataMode;
    triage_status: TriageStatus;
    triage_priority: number;
    observed_at: string;
    brand_id: string;
  };
  onSelect: (id: string) => void;
}

function formatDistanceToNow(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function FindingListItem({ finding, onSelect }: FindingListItemProps) {
  const priorityColor = 
    finding.triage_priority >= 0.8 ? 'text-rose-400' :
    finding.triage_priority >= 0.5 ? 'text-amber-400' :
    'text-blue-400';

  return (
    <div
      onClick={() => onSelect(finding.id)}
      className="p-4 border border-slate-800 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 cursor-pointer transition-colors"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <DataModeBadge mode={finding.data_mode} size="sm" />
            <TriageStatusBadge status={finding.triage_status} />
          </div>
          
          <h3 className="text-sm font-semibold text-slate-200 truncate mb-1">
            {finding.target_identifier}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="uppercase">{finding.surface}</span>
            <span>•</span>
            <span suppressHydrationWarning>
              {formatDistanceToNow(new Date(finding.observed_at))}
            </span>
          </div>
        </div>

        {/* Priority Score */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <svg className={`w-4 h-4 ${priorityColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className={`text-sm font-bold ${priorityColor}`}>
              {(finding.triage_priority * 100).toFixed(0)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase">Priority</span>
        </div>
      </div>

      {/* Warning for Demo Data */}
      {finding.data_mode === 'synthetic_demo' && <DemoDataWarning />}
    </div>
  );
}
