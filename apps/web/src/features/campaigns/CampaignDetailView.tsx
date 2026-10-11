'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Network, 
  ArrowLeft, 
  FileCheck, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Flame, 
  Layers, 
  Info,
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCampaign, submitCampaignDecision, CampaignDetail } from '@/lib/api';
import { CampaignGraphView } from '@/components/graph/CampaignGraphView';

interface CampaignDetailViewProps {
  campaignId: string;
}

export function CampaignDetailView({ campaignId }: CampaignDetailViewProps) {
  const queryClient = useQueryClient();
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);

  const { data: campaignDetail, isLoading, refetch } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => getCampaign(campaignId),
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ decision, reason }: { decision: string; reason: string }) => {
      return await submitCampaignDecision(campaignId, decision, reason);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      setDecisionFeedback(`Campaign marked as '${variables.decision}' with analyst audit record.`);
      setTimeout(() => setDecisionFeedback(null), 4000);
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading campaign investigation graph...</div>;
  }

  const campaign = campaignDetail?.campaign;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Top Bar Navigation & Actions */}
      <div className="p-4 px-6 border-b border-slate-800 bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Campaigns</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-indigo-300">
              {campaignId.substring(0, 8)}...
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-white">
              {campaign?.title || 'Brand Impersonation Campaign'}
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
              Risk {campaign?.risk_score?.toFixed(1) || '94.0'}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {campaign?.status || 'Proposed'}
            </span>
          </div>
        </div>

        {/* Analyst Decisions Bar */}
        <div className="flex items-center gap-2">
          {decisionFeedback && (
            <div className="text-xs text-emerald-400 flex items-center gap-1 font-medium mr-2 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{decisionFeedback}</span>
            </div>
          )}

          <button
            onClick={() => decisionMutation.mutate({ decision: 'confirmed', reason: 'Confirmed multi-surface threat with shared UPI payee' })}
            disabled={decisionMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirm Campaign</span>
          </button>

          <button
            onClick={() => decisionMutation.mutate({ decision: 'rejected', reason: 'Analyst rejected cluster — insufficient evidence' })}
            disabled={decisionMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>

          <Link
            href={`/campaigns/${campaignId}/response`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Generate Response Packet</span>
          </Link>
        </div>
      </div>

      {/* Formula & Explainability Pill Bar */}
      <div className="px-6 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            Score Formula Breakdown:
          </span>
          <span className="font-mono text-rose-300">Identity: 35% (0.96)</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-orange-300">Harm: 30% (0.98)</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-amber-300">Exposure: 20% (0.82)</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-blue-300">Freshness: 15% (1.00)</span>
        </div>

        <div className="text-[11px] text-slate-400">
          Click any edge in the graph to inspect pivot evidence and accept/reject relationships.
        </div>
      </div>

      {/* Interactive React Flow Canvas */}
      <div className="flex-1 min-h-0 relative">
        <CampaignGraphView campaignDetail={campaignDetail} onRefresh={refetch} />
      </div>
    </div>
  );
}
