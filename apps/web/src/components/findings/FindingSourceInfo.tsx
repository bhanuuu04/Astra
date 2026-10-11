'use client';

import React from 'react';
import { Database, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface FindingSourceInfoProps {
  finding: {
    data_mode: string;
    collected_at?: string;
    observed_at?: string;
    connector_id?: string;
    raw_evidence_id?: string;
  };
  connector?: {
    name: string;
    status: string;
    last_successful_sync_at?: string;
  };
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Unknown';
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

export function FindingSourceInfo({ finding, connector }: FindingSourceInfoProps) {
  return (
    <div className="border-t border-slate-800 pt-4 mt-4">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Source & Provenance
      </h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Data Source */}
        <div className="flex items-start gap-2.5">
          <Database className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Source</p>
            <p className="text-sm text-slate-300 font-medium">
              {connector?.name || (finding.data_mode === 'synthetic_demo' ? 'Synthetic Demo Generator' : 'Manual Upload')}
            </p>
            {connector && (
              <div className="flex items-center gap-1.5 mt-1">
                {connector.status === 'active' ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="text-xs text-slate-400 capitalize">
                  {connector.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Observed</p>
            <p className="text-sm text-slate-300">
              {formatRelativeTime(finding.observed_at)}
            </p>
            {finding.collected_at && (
              <p className="text-xs text-slate-500 mt-0.5">
                Collected {formatRelativeTime(finding.collected_at)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Evidence Hash */}
      {finding.raw_evidence_id && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Evidence Hash (SHA-256)</p>
          <p className="text-xs font-mono text-cyan-300/90 break-all select-all">
            {finding.raw_evidence_id}
          </p>
        </div>
      )}
    </div>
  );
}
