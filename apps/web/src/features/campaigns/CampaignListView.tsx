'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Network, 
  Flame, 
  ExternalLink, 
  CheckCircle2, 
  FileCheck, 
  ArrowUpRight, 
  Layers, 
  ShieldAlert,
  Play
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCampaigns, listBrands, runAnalysisJob, type Brand } from '@/lib/api';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { useDemoSafe } from '@/providers/DemoProvider';

export function CampaignListView() {
  const queryClient = useQueryClient();
  const demo = useDemoSafe();
  const isDemoMode = demo?.isDemoMode ?? false;

  const { data: realBrands = [] } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: () => listBrands(),
    enabled: !isDemoMode,
  });
  const currentBrandId = realBrands[0]?.id;

  const { data: realCampaigns = [], isLoading: realLoading, isError: realError, error, refetch } = useQuery({
    queryKey: ['campaigns', currentBrandId],
    queryFn: () => listCampaigns(currentBrandId),
    enabled: !isDemoMode,
  });

  const campaigns = isDemoMode ? (demo?.campaigns as any[]) : realCampaigns;
  const isLoading = isDemoMode ? false : realLoading;
  const isError = isDemoMode ? false : realError;

  const analysisMutation = useMutation({
    mutationFn: () => {
      if (isDemoMode) {
        demo?.addSimulatedAction('run_clustering');
        return Promise.resolve({} as any);
      }
      return runAnalysisJob(currentBrandId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e3e2e0]">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0f7b6c] tracking-wider uppercase mb-1">
            <span>Threat Intelligence Clusters</span>
            <span>•</span>
            <span className="text-[#9b9a97]">Cross-Surface Linking</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#37352f] tracking-tight">
            Active Campaigns &amp; Investigations
          </h1>
          <p className="text-sm text-[#787774] mt-1 max-w-2xl leading-relaxed">
            Correlated threat clusters linking suspicious social profiles, malicious landing pages, and sideloaded APKs via infrastructure invariants.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => analysisMutation.mutate()}
            disabled={analysisMutation.isPending}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0f7b6c] hover:bg-[#0b5e52] disabled:bg-[#f7f6f3] disabled:text-[#9b9a97] text-white rounded-[6px] text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${analysisMutation.isPending ? 'animate-spin' : ''}`} />
            {analysisMutation.isPending ? 'Clustering Pivots...' : 'Re-Run Campaign Clustering'}
          </button>
        </div>
      </div>

      {/* Campaign Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-[#9b9a97] text-xs">Loading campaigns...</div>
        ) : isError ? (
          <QueryErrorState title="Campaigns could not be loaded" message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-[8px] border border-[#e3e2e0] shadow-2xs">
            <ShieldAlert className="w-7 h-7 text-[#9b9a97] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#37352f] mb-1">No active campaigns detected</p>
            <p className="text-xs text-[#9b9a97]">Connect brand channels or ingest new findings to correlate threat infrastructure clusters.</p>
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp.id}
              className="p-5 rounded-[8px] bg-white border border-[#e3e2e0] hover:border-[#9b9a97] shadow-2xs transition space-y-3.5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-sm font-bold text-[#37352f]">
                      {camp.title}
                    </h2>
                    <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                      Risk {camp.risk_score.toFixed(1)} / 100
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase bg-[#f7f6f3] text-[#787774] border border-[#e3e2e0]">
                      {camp.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9b9a97] font-mono">
                    Campaign UUID: {camp.id} • Created: {new Date(camp.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    href={`/campaigns/${camp.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f7b6c] hover:bg-[#0b5e52] text-white rounded-[6px] text-xs font-medium shadow-2xs transition"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>Open Interactive Graph</span>
                  </Link>
                  <Link
                    href={`/campaigns/${camp.id}/response`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f7f6f3] hover:bg-white text-[#37352f] rounded-[6px] text-xs font-medium border border-[#e3e2e0] transition shadow-2xs"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-[#0f7b6c]" />
                    <span>Response Packet</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#e3e2e0] text-xs">
                <div className="p-2.5 rounded-[6px] bg-[#f7f6f3] border border-[#e3e2e0]">
                  <span className="text-[#9b9a97] block text-[10px] uppercase font-semibold">Member Sightings</span>
                  <span className="font-bold text-[#37352f] text-xs">{camp.member_count} nodes</span>
                </div>
                <div className="p-2.5 rounded-[6px] bg-[#f7f6f3] border border-[#e3e2e0]">
                  <span className="text-[#9b9a97] block text-[10px] uppercase font-semibold">Primary Invariant Pivots</span>
                  <span className="font-bold text-[#0f7b6c] text-xs">UPI, Phone &amp; Logo Hash</span>
                </div>
                <div className="p-2.5 rounded-[6px] bg-[#f7f6f3] border border-[#e3e2e0]">
                  <span className="text-[#9b9a97] block text-[10px] uppercase font-semibold">Surfaces Compromised</span>
                  <span className="font-bold text-[#37352f] text-xs">Instagram, Web, APK, Telegram</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
