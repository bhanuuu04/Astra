'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { 
  Bell, 
  Search, 
  Filter, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  Globe, 
  Share2, 
  Hash, 
  Layers, 
  Eye, 
  Network 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listSightings, Sighting } from '@/lib/api';
import { DataModeBadge } from '@/components/ui/DataModeBadge';
import { TriageStatusBadge } from '@/components/ui/TriageStatusBadge';
import { DemoDataWarning } from '@/components/ui/DemoDataWarning';
import { FindingSourceInfo } from '@/components/findings/FindingSourceInfo';

export function SightingsQueueView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedSurface = searchParams.get('surface') || 'all';
  const selectedType = searchParams.get('type') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSighting, setActiveSighting] = useState<Sighting | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: sightings = [], isLoading, isError, error } = useQuery({
    queryKey: ['sightings'],
    queryFn: () => listSightings(),
  });

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const filteredSightings = sightings.filter((s) => {
    if (selectedSurface !== 'all' && s.surface.toLowerCase() !== selectedSurface.toLowerCase()) {
      return false;
    }
    const isBenign = s.normalized_payload?.isBenign === true;
    if (selectedType === 'malicious' && isBenign) return false;
    if (selectedType === 'benign' && !isBenign) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const content = (s.normalized_payload?.evidence_text || s.raw_ref || '').toLowerCase();
      const sender = JSON.stringify(s.normalized_payload?.sender || {}).toLowerCase();
      return content.includes(q) || sender.includes(q);
    }
    return true;
  });

  const getSurfaceIcon = (surface: string) => {
    switch (surface.toLowerCase()) {
      case 'instagram':
        return <Share2 className="w-4 h-4 text-pink-400" />;
      case 'web':
        return <Globe className="w-4 h-4 text-blue-400" />;
      case 'apk':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'telegram':
        return <Share2 className="w-4 h-4 text-sky-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1">
            <span>Evidence Intake &amp; Triage</span>
            <span>•</span>
            <span className="text-slate-400">Queue State Sync</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Threat Sightings Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Raw sightings across monitored social, domain, APK sideload, and messaging surfaces.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span suppressHydrationWarning className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
            {mounted ? filteredSightings.length : 0} Sightings Displayed
          </span>
        </div>
      </div>

      {/* Filters & Search Toolbar (G7 URL State) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        {/* Surface Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Surface:
          </span>
          {['all', 'instagram', 'web', 'apk', 'telegram'].map((sfc) => (
            <button
              key={sfc}
              onClick={() => updateFilter('surface', sfc)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer capitalize ${
                selectedSurface === sfc
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {sfc}
            </button>
          ))}
        </div>

        {/* Classification Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1">Class:</span>
          {['all', 'malicious', 'benign'].map((t) => (
            <button
              key={t}
              onClick={() => updateFilter('type', t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer capitalize ${
                selectedType === t
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'benign' ? 'Benign (Fan Match)' : t}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search payload, URL, or sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Sightings List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sighting Cards */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading sightings from database...</div>
          ) : isError ? (
            <div role="alert" className="rounded-xl border border-rose-900/70 bg-rose-950/30 p-5 text-sm text-rose-200">
              Could not load findings. {error instanceof Error ? error.message : 'Check the API connection and try again.'}
            </div>
          ) : filteredSightings.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800">
              <p className="text-sm text-slate-400">No sightings match current filter criteria.</p>
            </div>
          ) : (
            filteredSightings.map((sighting) => {
              const isBenign = sighting.normalized_payload?.isBenign === true;
              const isSelected = activeSighting?.id === sighting.id;

              return (
                <div
                  key={sighting.id}
                  onClick={() => setActiveSighting(sighting)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                        {getSurfaceIcon(sighting.surface)}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {sighting.surface} Sighting
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {sighting.source_kind}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <DataModeBadge mode={((sighting as any).data_mode || (sighting.source_kind === 'demo_generator' ? 'synthetic_demo' : 'live')) as any} size="sm" />
                      <TriageStatusBadge 
                        status={
                          ((sighting as any).triage_status as any) ||
                          (isBenign ? 'false_positive' : 'pending')
                        } 
                      />
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 line-clamp-2 mb-2 font-mono text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    {sighting.normalized_payload?.evidence_text || sighting.raw_ref}
                  </p>

                  {((sighting as any).data_mode === 'synthetic_demo' || sighting.source_kind === 'demo_generator') && (
                    <DemoDataWarning className="mb-2" />
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-2">
                      {sighting.normalized_payload?.sharedPivots && sighting.normalized_payload.sharedPivots.length > 0 && (
                        <span className="text-[11px] text-indigo-300 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                          {sighting.normalized_payload.sharedPivots.length} Pivots
                        </span>
                      )}
                      <span className="text-[11px] truncate max-w-[200px]">
                        Ref: {sighting.raw_ref}
                      </span>
                    </div>
                    <span className="text-indigo-400 font-semibold hover:underline flex items-center gap-1">
                      Inspect &rarr;
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Sighting Detail Inspector */}
        <div className="space-y-4">
          {activeSighting ? (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 sticky top-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {getSurfaceIcon(activeSighting.surface)}
                  <h3 className="text-sm font-bold text-white capitalize">
                    {activeSighting.surface} Inspector
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <DataModeBadge mode={((activeSighting as any).data_mode || (activeSighting.source_kind === 'demo_generator' ? 'synthetic_demo' : 'live')) as any} size="sm" />
                  <TriageStatusBadge 
                    status={
                      ((activeSighting as any).triage_status as any) ||
                      (activeSighting.normalized_payload?.isBenign ? 'false_positive' : 'pending')
                    } 
                  />
                </div>
              </div>

              {/* Sender Details */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Endpoint</span>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">URI / Handle:</span>
                    <span className="text-indigo-300 font-mono font-medium truncate max-w-[200px]">{activeSighting.raw_ref}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Surface:</span>
                    <span className="text-slate-200 capitalize">{activeSighting.surface}</span>
                  </div>
                </div>
              </div>

              {/* Raw Evidence Text */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Raw Sighting Telemetry</span>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                  {activeSighting.normalized_payload?.evidence_text || activeSighting.raw_ref}
                </div>
              </div>

              {/* Shared Pivots (G5 story) */}
              {activeSighting.normalized_payload?.sharedPivots && activeSighting.normalized_payload.sharedPivots.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clustered Pivots</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSighting.normalized_payload.sharedPivots.map((p: string, idx: number) => (
                      <span key={idx} className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 font-mono">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Finding Provenance & Evidence ID */}
              <FindingSourceInfo
                finding={{
                  data_mode: (activeSighting as any).data_mode || (activeSighting.source_kind === 'demo_generator' ? 'synthetic_demo' : 'live'),
                  observed_at: activeSighting.observed_at || activeSighting.created_at,
                  collected_at: activeSighting.created_at,
                  raw_evidence_id: activeSighting.normalized_payload?.sha256 || activeSighting.normalized_payload?.evidence_hash,
                }}
              />

              {/* Campaign Link CTA */}
              {!activeSighting.normalized_payload?.isBenign && (
                <div className="pt-2">
                  <Link
                    href="/campaigns"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>View in Campaign Graph</span>
                  </Link>
                </div>
              )}

              {activeSighting.normalized_payload?.isBenign && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300">
                  <strong>Ablation Rule Proof:</strong> This fan page explicitly disclaims brand affiliation. Because Brand DNA is active, ASTRA accurately classifies it as Benign and keeps it outside Campaign Alpha.
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800/80 text-center text-slate-400 text-xs">
              Select a sighting on the left to inspect raw indicators and extracted threat pivots.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
