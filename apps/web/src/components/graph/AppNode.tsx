'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Smartphone, AlertOctagon } from 'lucide-react';

export interface AppNodeData {
  label: string;
  appName: string;
  packageName: string;
  sha256?: string;
  riskScore: number;
}

export const AppNode = memo(({ data }: { data: AppNodeData }) => {
  return (
    <div className="px-4 py-3 rounded-xl border-2 border-purple-500/80 bg-slate-900/95 shadow-lg min-w-[240px] transition-all hover:scale-102 hover:border-purple-400">
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 !bg-purple-400" />
      
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-purple-400" />
          Rogue APK
        </span>
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
          <AlertOctagon className="w-3 h-3 text-rose-400" />
          Risk {data.riskScore || 95}%
        </span>
      </div>

      <div className="font-semibold text-sm text-white truncate">
        {data.appName || data.label}
      </div>

      <div className="text-xs text-slate-300 font-mono truncate mt-1">
        pkg: <span className="text-purple-300">{data.packageName || 'com.fake.app'}</span>
      </div>

      {data.sha256 && (
        <div className="text-xs text-slate-400 font-mono truncate mt-0.5">
          SHA: {data.sha256.substring(0, 16)}...
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 !bg-purple-400" />
    </div>
  );
});

AppNode.displayName = 'AppNode';
