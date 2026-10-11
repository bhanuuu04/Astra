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
import { listCampaigns, runAnalysisJob } from '@/lib/api';

export function CampaignListView() {
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading, isError, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => listCampaigns(),
  });

  const analysisMutation = useMutation({
    mutationFn: () => runAnalysisJob(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1">
            <span>Threat Intelligence Clusters</span>
            <span>•</span>
            <span className="text-slate-400">Cross-Surface Linking</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Active Campaigns &amp; Investigations
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Correlated threat clusters linking suspicious social profiles, malicious landing pages, and sideloaded APKs via infrastructure invariants.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => analysisMutation.mutate()}
            disabled={analysisMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-semibold shadow transition cursor-pointer"
          >
            <Play className={`w-4 h-4 ${analysisMutation.isPending ? 'animate-spin' : ''}`} />
            {analysisMutation.isPending ? 'Clustering Pivots...' : 'Re-Run Campaign Clustering'}
          </button>
        </div>
      </div>

      {/* Campaign Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading campaigns...</div>
        ) : isError ? (
          <div role="alert" className="rounded-xl border border-rose-900/70 bg-rose-950/30 p-5 text-sm text-rose-200">
            Could not load campaigns. {error instanceof Error ? error.message : 'Check the API connection and try again.'}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/50 rounded-xl border border-slate-800">
            <p className="text-sm text-slate-400 mb-2">No active campaigns.</p>
            <p className="text-xs text-slate-400">Click &quot;Reset Demo (NilaPay)&quot; on the sidebar to seed the NilaPay synthetic fraud campaign.</p>
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp.id}
              className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white">
                      {camp.title}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                      Risk {camp.risk_score.toFixed(1)} / 100
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {camp.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Campaign UUID: {camp.id} • Created: {new Date(camp.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/campaigns/${camp.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                  >
                    <Network className="w-4 h-4" />
                    <span>Open Interactive Graph</span>
                  </Link>
                  <Link
                    href={`/campaigns/${camp.id}/response`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                  >
                    <FileCheck className="w-4 h-4 text-indigo-400" />
                    <span>Response Packet</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60">
                  <span className="text-slate-400 block text-[11px]">Member Sightings</span>
                  <span className="font-bold text-slate-200 text-sm">{camp.member_count} nodes</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60">
                  <span className="text-slate-400 block text-[11px]">Primary Invariant Pivots</span>
                  <span className="font-bold text-indigo-300 text-sm">UPI, Phone &amp; Logo Hash</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60">
                  <span className="text-slate-400 block text-[11px]">Surfaces Compromised</span>
                  <span className="font-bold text-slate-200 text-sm">Instagram, Web, APK, Telegram</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
