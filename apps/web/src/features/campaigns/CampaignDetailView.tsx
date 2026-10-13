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
import { QueryErrorState } from '@/components/ui/QueryErrorState';

interface CampaignDetailViewProps {
  campaignId: string;
}

export function CampaignDetailView({ campaignId }: CampaignDetailViewProps) {
  const queryClient = useQueryClient();
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const { data: campaignDetail, isLoading, isError, refetch } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => getCampaign(campaignId),
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ decision, reason }: { decision: string; reason: string }) => {
      return await submitCampaignDecision(campaignId, decision, reason);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      setDecisionError(null);
      setDecisionFeedback(`Campaign marked as '${variables.decision}' with analyst audit record.`);
      setTimeout(() => setDecisionFeedback(null), 4000);
    },
    onError: (error) => {
      setDecisionError(error instanceof Error ? error.message : 'Campaign decision could not be saved.');
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading campaign investigation graph...</div>;
  }

  if (isError) {
    return <div className="mx-auto max-w-3xl p-6"><QueryErrorState title="Campaign could not be loaded" message="The campaign details are unavailable right now. Retry to reload the investigation and its evidence." onRetry={() => { void refetch(); }} /></div>;
  }

  const campaign = campaignDetail?.campaign;

  if (!campaignDetail || !campaign) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">Campaign not found</p>
        <p className="text-sm text-slate-600">This campaign may have been removed or may not be available in the current workspace.</p>
        <Link href="/campaigns" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline"><ArrowLeft className="h-4 w-4" /> Back to campaigns</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f7f6f3]">
      {/* Top Bar Navigation & Actions */}
      <div className="p-4 px-6 border-b border-[#e3e2e0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1 text-xs text-[#787774] hover:text-[#37352f] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Campaigns</span>
            </Link>
            <span className="text-[#e3e2e0]">/</span>
            <span className="text-xs font-mono text-[#0f7b6c]">
              {campaignId.substring(0, 8)}...
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#37352f]">
              {campaign.title || 'Untitled campaign'}
            </h1>
            <span className="px-2 py-0.5 rounded-[4px] text-xs font-semibold uppercase bg-[#eb5757]/10 text-[#eb5757] border border-[#eb5757]/30 font-mono">
              {typeof campaign.risk_score === 'number' ? `Risk ${campaign.risk_score.toFixed(1)}` : 'Risk score unavailable'}
            </span>
            <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-medium uppercase bg-[#d97706]/10 text-[#d97706] border border-[#d97706]/20">
              {campaign.status || 'Status unavailable'}
            </span>
          </div>
        </div>

        {/* Analyst Decisions Bar */}
        <div className="flex items-center gap-2">
          {decisionFeedback && (
            <div className="text-xs text-[#0f7b6c] flex items-center gap-1 font-medium mr-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{decisionFeedback}</span>
            </div>
          )}

          {decisionError && <span role="alert" className="max-w-56 text-xs font-medium text-rose-700">{decisionError}</span>}

          <button
            onClick={() => decisionMutation.mutate({ decision: 'accept', reason: 'Confirmed multi-surface threat with shared pivot correlation' })}
            disabled={decisionMutation.isPending || !campaign}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f7b6c] hover:bg-[#0c6357] disabled:bg-[#e3e2e0] text-white rounded-[6px] text-xs font-medium shadow-xs transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirm Campaign</span>
          </button>

          <button
            onClick={() => decisionMutation.mutate({ decision: 'reject', reason: 'Analyst rejected cluster — insufficient correlation evidence' })}
            disabled={decisionMutation.isPending || !campaign}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eb5757] hover:bg-[#c93b3b] disabled:bg-[#e3e2e0] text-white rounded-[6px] text-xs font-medium shadow-xs transition cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>

          <Link
            href={`/campaigns/${campaignId}/response`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#37352f] hover:bg-[#201f1d] text-white rounded-[6px] text-xs font-medium shadow-xs transition"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Generate Response Packet</span>
          </Link>
        </div>
      </div>

      {/* Evidence summary */}
      <div className="px-6 py-2 bg-white/90 border-b border-[#e3e2e0] flex items-center justify-between text-xs text-[#787774] shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-[#37352f] flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#0f7b6c]" />
            Investigation evidence:
          </span>
          <span className="font-mono">{campaignDetail.signals?.length ?? 0} signals</span>
          <span className="text-[#e3e2e0]">•</span>
          <span className="font-mono">{campaignDetail.edges?.length ?? 0} relationships</span>
        </div>

        <div className="text-[11px] text-[#787774]">
          Click any edge in the graph to inspect pivot evidence and review relationships.
        </div>
      </div>

      {/* Interactive React Flow Canvas */}
      <div className="flex-1 min-h-0 relative">
        <CampaignGraphView campaignDetail={campaignDetail} onRefresh={refetch} />
      </div>
    </div>
  );
}
