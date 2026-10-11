'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Link2, CreditCard, Phone, Wallet, Image as ImageIcon } from 'lucide-react';

export interface IndicatorNodeData {
  label: string;
  indicatorType: string;
  value: string;
}

export const IndicatorNode = memo(({ data }: { data: IndicatorNodeData }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'upi':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-400" />;
      case 'phone':
        return <Phone className="w-3.5 h-3.5 text-blue-400" />;
      case 'crypto_wallet':
        return <Wallet className="w-3.5 h-3.5 text-amber-400" />;
      case 'logo_hash':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Link2 className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'upi':
        return 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300';
      case 'phone':
        return 'border-blue-500/60 bg-blue-950/40 text-blue-300';
      case 'crypto_wallet':
        return 'border-amber-500/60 bg-amber-950/40 text-amber-300';
      default:
        return 'border-indigo-500/60 bg-indigo-950/40 text-indigo-300';
    }
  };

  return (
    <div className={`px-4 py-2.5 rounded-full border-2 shadow-lg bg-slate-900/95 min-w-[190px] max-w-[260px] flex items-center gap-3 transition-all hover:scale-105 ${getBadgeColor(data.indicatorType)}`}>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 !bg-slate-400" />
      
      <div className="p-1.5 rounded-full bg-slate-800 border border-slate-700 shadow-xs shrink-0">
        {getIcon(data.indicatorType)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">
          Pivot · {data.indicatorType}
        </div>
        <div className="text-xs font-mono font-bold text-white truncate" title={data.value || data.label}>
          {data.value || data.label}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 !bg-slate-400" />
    </div>
  );
});

IndicatorNode.displayName = 'IndicatorNode';
