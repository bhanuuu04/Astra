'use client';

import React from 'react';

export type DataMode = 'live' | 'synthetic_demo' | 'manual_upload' | 'unknown';

interface DataModeBadgeProps {
  mode: DataMode;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MODE_CONFIG = {
  live: {
    label: 'Provider data',
    bg: 'bg-[#0f7b6c]/10',
    border: 'border-[#0f7b6c]/30',
    text: 'text-[#0f7b6c] font-semibold',
    pulse: false,
  },
  synthetic_demo: {
    label: 'Demo data',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800 font-medium',
    pulse: false,
  },
  manual_upload: {
    label: 'MANUAL',
    bg: 'bg-[#f7f6f3]',
    border: 'border-[#e3e2e0]',
    text: 'text-[#787774] font-medium',
    pulse: false,
  },
  unknown: {
    label: 'Source mode unknown',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-600 font-medium',
    pulse: false,
  },
};

export function DataModeBadge({ 
  mode, 
  showLabel = true, 
  size = 'md',
  className = ''
}: DataModeBadgeProps) {
  const config = MODE_CONFIG[mode];
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-[4px] border font-medium uppercase tracking-wider ${config.bg} ${config.border} ${config.text} ${sizeClasses[size]} ${className}`}
    >
      {config.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0f7b6c] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0f7b6c]"></span>
        </span>
      )}
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {mode === 'live' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
        {mode === 'synthetic_demo' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />}
        {mode === 'manual_upload' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />}
      </svg>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
