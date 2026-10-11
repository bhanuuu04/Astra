'use client';

import React, { useState } from 'react';
import { X, CheckCircle, ShieldAlert, Link2, AlertCircle, HelpCircle, Fingerprint, ShieldCheck } from 'lucide-react';
import { CampaignEdge } from '@/lib/api';

interface EdgeReviewDrawerProps {
  edge: CampaignEdge | null;
  campaignId: string;
  onClose: () => void;
  onDecision: (edgeId: string, decision: 'confirm' | 'reject', reason: string) => Promise<void>;
}

export function EdgeReviewDrawer({
  edge,
  campaignId,
  onClose,
  onDecision,
}: EdgeReviewDrawerProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!edge) return null;

  const handleAction = async (decision: 'confirm' | 'reject') => {
    if (!reason.trim()) {
      setError('An analyst justification reason is required before modifying edge status.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onDecision(edge.id, decision, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record edge decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            Confirmed Link
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            Rejected Link
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            Proposed Correlation
          </span>
        );
    }
  };

  return (
    <div className="w-80 lg:w-96 border-l border-slate-800 bg-slate-900/95 text-slate-100 h-full flex flex-col shadow-2xl z-20 shrink-0 animate-fade-in backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">Why Are These Linked?</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Review Status</span>
          {getStatusBadge(edge.review_status)}
        </div>

        {/* Forensic Evidence Grounding Card */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-indigo-400 tracking-wider font-bold flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5" />
              Shared Pivot Invariant
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
              {Math.round(edge.confidence * 100)}% Confidence
            </span>
          </div>

          <div className="text-sm font-bold text-white font-mono bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            {edge.pivot_type.toUpperCase()}: <span className="text-indigo-300">{edge.from_endpoint}</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            The automated linker discovered identical cryptographic indicators across disparate threat surfaces.
          </p>
        </div>

        {/* Connected Endpoints */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold">
            Linked Graph Endpoints
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 break-all space-y-1">
            <div className="text-slate-500 text-[10px] font-bold">SOURCE ENDPOINT:</div>
            <div className="text-indigo-300">{edge.from_endpoint}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 break-all space-y-1">
            <div className="text-slate-500 text-[10px] font-bold">TARGET ENDPOINT:</div>
            <div className="text-indigo-300">{edge.to_endpoint}</div>
          </div>
        </div>

        {/* Supporting Evidence Manifest */}
        {edge.evidence_ids && edge.evidence_ids.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold">
              Supporting Evidence Objects
            </div>
            <div className="space-y-1.5">
              {edge.evidence_ids.map((ev, i) => (
                <div key={i} className="text-xs font-mono p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 truncate" title={ev}>
                  • {ev}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Action Form */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Analyst Justification Note *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Confirmed shared financial handle matches attacker UPI registry."
            rows={3}
            className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg focus:outline-none focus:border-indigo-500 placeholder-slate-600 font-sans"
          />

          {error && (
            <div className="p-2 rounded bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
        <button
          onClick={() => handleAction('confirm')}
          disabled={isSubmitting}
          className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Confirm Link
        </button>

        <button
          onClick={() => handleAction('reject')}
          disabled={isSubmitting}
          className="flex-1 py-2 px-3 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Unlink Edge
        </button>
      </div>
    </div>
  );
}
