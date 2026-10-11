'use client';

import React from 'react';
import { Check, Clock, X, ShieldAlert, Send, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LifecycleState = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'submitted' 
  | 'acknowledged' 
  | 'resolved' 
  | 'rejected';

export interface ResponseCaseTimelineData {
  lifecycle_state: LifecycleState;
  created_at: string;
  drafted_by: string;
  approved_by?: string | null;
  approved_at?: string | null;
  dispatched_at?: string | null;
  resolved_at?: string | null;
  target_provider?: string;
}

interface TimelineStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  timestamp?: string | null;
  actor?: string | null;
  detail?: string;
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return '';
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

export function ResponseCaseTimeline({ responseCase }: { responseCase: ResponseCaseTimelineData }) {
  const steps: TimelineStep[] = [
    {
      id: 'draft',
      label: 'Draft Created',
      status: 'completed',
      timestamp: responseCase.created_at,
      actor: responseCase.drafted_by,
      detail: 'Evidence dossier and takedown notice prepared',
    },
    {
      id: 'approval',
      label: 'Reviewer Approval',
      status: 
        responseCase.lifecycle_state === 'rejected' ? 'rejected' :
        ['approved', 'submitted', 'acknowledged', 'resolved'].includes(responseCase.lifecycle_state) ? 'completed' :
        responseCase.lifecycle_state === 'pending_approval' ? 'current' :
        responseCase.lifecycle_state === 'draft' ? 'current' :
        'pending',
      timestamp: responseCase.approved_at,
      actor: responseCase.approved_by,
      detail: responseCase.approved_by ? `Approved by ${responseCase.approved_by}` : 'Requires analyst review before submission',
    },
    {
      id: 'dispatch',
      label: 'Dispatched to Provider',
      status:
        ['submitted', 'acknowledged', 'resolved'].includes(responseCase.lifecycle_state) ? 'completed' :
        responseCase.lifecycle_state === 'approved' ? 'current' :
        'pending',
      timestamp: responseCase.dispatched_at,
      detail: responseCase.target_provider ? `Directed to ${responseCase.target_provider}` : 'External takedown notification',
    },
    {
      id: 'outcome',
      label: 'Outcome Confirmed',
      status: responseCase.lifecycle_state === 'resolved' ? 'completed' : 'pending',
      timestamp: responseCase.resolved_at,
      detail: responseCase.lifecycle_state === 'resolved' ? 'Abuse removed & case closed' : 'Awaiting host / registrar confirmation',
    },
  ];

  return (
    <div className="space-y-4 py-2">
      {steps.map((step, index) => (
        <div key={step.id} className="relative">
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                'absolute left-4 top-8 w-0.5 h-full',
                step.status === 'completed' ? 'bg-emerald-500/30' : 'bg-slate-800'
              )}
            />
          )}

          {/* Step Content */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 transition-colors',
                step.status === 'completed' && 'bg-emerald-500/10 border-emerald-500 text-emerald-400',
                step.status === 'current' && 'bg-cyan-500/10 border-cyan-500 text-cyan-400 animate-pulse',
                step.status === 'pending' && 'bg-slate-900 border-slate-700 text-slate-600',
                step.status === 'rejected' && 'bg-rose-500/10 border-rose-500 text-rose-400'
              )}
            >
              {step.status === 'completed' && <Check className="w-4 h-4" />}
              {step.status === 'current' && <Clock className="w-4 h-4" />}
              {step.status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-600" />}
              {step.status === 'rejected' && <X className="w-4 h-4" />}
            </div>

            {/* Details */}
            <div className="flex-1 pb-6 min-w-0">
              <div className="flex items-center justify-between mb-1 gap-2">
                <h4 className={cn(
                  'text-xs font-semibold uppercase tracking-wider',
                  step.status === 'completed' && 'text-emerald-400',
                  step.status === 'current' && 'text-cyan-300',
                  step.status === 'pending' && 'text-slate-500',
                  step.status === 'rejected' && 'text-rose-400'
                )}>
                  {step.label}
                </h4>
                {step.timestamp && (
                  <span suppressHydrationWarning className="text-[11px] text-slate-500 font-mono">
                    {formatRelativeTime(step.timestamp)}
                  </span>
                )}
              </div>
              
              <p className="text-xs text-slate-400">{step.detail}</p>
              
              {step.actor && (
                <p className="text-[11px] text-slate-500 mt-0.5">by {step.actor}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
