'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe, AlertTriangle } from 'lucide-react';

export interface WebAssetNodeData {
  label: string;
  domain: string;
  url?: string;
  riskScore: number;
  isLookalike?: boolean;
}

export const WebAssetNode = memo(({ data }: { data: WebAssetNodeData }) => {
  return (
    <div className="px-4 py-3 rounded-xl border-2 border-amber-500/80 bg-slate-900/95 shadow-lg min-w-[230px] transition-all hover:scale-102 hover:border-amber-400">
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 !bg-amber-400" />
      
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          Web Asset
        </span>
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          Risk {data.riskScore || 90}%
        </span>
      </div>

      <div className="font-semibold text-sm text-white truncate">
        {data.domain || data.label}
      </div>

      {data.url && (
        <div className="text-xs text-slate-400 font-mono truncate mt-1" title={data.url}>
          {data.url}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 !bg-amber-400" />
    </div>
  );
});

WebAssetNode.displayName = 'WebAssetNode';
