'use client';

import React from 'react';

export type TriageStatus = 
  | 'pending' 
  | 'investigating' 
  | 'confirmed_threat' 
  | 'false_positive' 
  | 'needs_evidence';

interface TriageStatusBadgeProps {
  status: TriageStatus;
  showIcon?: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Unreviewed',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: 'bg-[#f7f6f3]',
    text: 'text-[#787774]',
    border: 'border-[#e3e2e0]',
  },
  investigating: {
    label: 'Investigating',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    bg: 'bg-[#0f7b6c]/10',
    text: 'text-[#0f7b6c]',
    border: 'border-[#0f7b6c]/30',
  },
  confirmed_threat: {
    label: 'Confirmed Threat',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    bg: 'bg-[#eb5757]/10',
    text: 'text-[#eb5757]',
    border: 'border-[#eb5757]/30',
  },
  false_positive: {
    label: 'False Positive',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: 'bg-[#f7f6f3]',
    text: 'text-[#787774]',
    border: 'border-[#e3e2e0]',
  },
  needs_evidence: {
    label: 'Needs Evidence',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: 'bg-[#d97706]/10',
    text: 'text-[#d97706]',
    border: 'border-[#d97706]/30',
  },
};

export function TriageStatusBadge({ 
  status, 
  showIcon = true,
  className = ''
}: TriageStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border text-[11px] font-medium ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </div>
  );
}
