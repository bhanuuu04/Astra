'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ShieldAlert, User, CheckCircle2 } from 'lucide-react';

export interface ProfileNodeData {
  label: string;
  username: string;
  platform: string;
  riskScore: number;
  severity: string;
  surface: string;
  isFakeBadge?: boolean;
}

export const ProfileNode = memo(({ data }: { data: ProfileNodeData }) => {
  const isHighRisk = data.riskScore >= 70;

  return (
    <div className={`px-4 py-3 rounded-xl border-2 shadow-lg min-w-[230px] transition-all hover:scale-102 ${
      isHighRisk 
        ? 'border-rose-500/80 bg-slate-900/95 text-slate-100 shadow-rose-950/30' 
        : 'border-slate-700 bg-slate-900/95 text-slate-100'
    }`}>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 !bg-indigo-400" />
      
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-indigo-400" />
          {data.platform || data.surface}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
          isHighRisk 
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
        }`}>
          {isHighRisk && <ShieldAlert className="w-3 h-3 text-rose-400" />}
          Risk {data.riskScore}%
        </span>
      </div>

      <div className="font-semibold text-sm text-white truncate flex items-center gap-1.5">
        <span>{data.label || data.username}</span>
        {data.isFakeBadge && (
          <span className="text-xs text-amber-400 font-bold" title="Deceptive badge emoji detected">✓</span>
        )}
      </div>
      
      <div className="text-xs text-slate-400 font-mono truncate mt-0.5">
        @{data.username}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 !bg-indigo-400" />
    </div>
  );
});

ProfileNode.displayName = 'ProfileNode';
