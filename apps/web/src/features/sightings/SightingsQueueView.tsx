'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { 
  Bell, 
  Search, 
  Filter, 
  ArrowDownUp,
  Smartphone, 
  Globe, 
  Share2, 
  Network 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listSightings, Sighting } from '@/lib/api';
import { DataModeBadge } from '@/components/ui/DataModeBadge';
import { TriageStatusBadge } from '@/components/ui/TriageStatusBadge';
import { FindingSourceInfo } from '@/components/findings/FindingSourceInfo';

export function SightingsQueueView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedSurface = searchParams.get('surface') || 'all';
  const selectedType = searchParams.get('type') || 'all';
  const selectedQuickFilter = searchParams.get('triage') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSighting, setActiveSighting] = useState<Sighting | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sort, setSort] = useState<{ key: 'risk' | 'observed'; direction: 'asc' | 'desc' }>({ key: 'observed', direction: 'desc' });

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

  const getRiskScore = (sighting: Sighting) => {
    const rawScore = sighting.normalized_payload?.threat_analysis?.risk_score;
    if (typeof rawScore !== 'number') return null;
    return rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);
  };

  const candidateSightings = sightings.filter((s) => {
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

  const filteredSightings = candidateSightings.filter((sighting) => {
    const isBenign = sighting.normalized_payload?.isBenign === true;
    const status = (sighting as any).triage_status || sighting.normalized_payload?.triage_status;
    if (selectedQuickFilter === 'high-risk') return (getRiskScore(sighting) ?? 0) >= 80;
    if (selectedQuickFilter === 'needs-review') return !isBenign && (!status || ['pending', 'investigating', 'needs_evidence'].includes(status));
    if (selectedQuickFilter === 'benign') return isBenign || status === 'false_positive';
    return true;
  });
  const highRiskCount = candidateSightings.filter((sighting) => (getRiskScore(sighting) ?? 0) >= 80).length;
  const reviewCount = candidateSightings.filter((sighting) => {
    const isBenign = sighting.normalized_payload?.isBenign === true;
    const status = (sighting as any).triage_status || sighting.normalized_payload?.triage_status;
    return !isBenign && (!status || ['pending', 'investigating', 'needs_evidence'].includes(status));
  }).length;
  const benignCount = candidateSightings.filter((sighting) => sighting.normalized_payload?.isBenign === true || (sighting as any).triage_status === 'false_positive' || sighting.normalized_payload?.triage_status === 'false_positive').length;
  const sortedSightings = [...filteredSightings].sort((first, second) => {
    const firstValue = sort.key === 'risk' ? (getRiskScore(first) ?? -1) : new Date(first.observed_at || first.created_at).getTime();
    const secondValue = sort.key === 'risk' ? (getRiskScore(second) ?? -1) : new Date(second.observed_at || second.created_at).getTime();
    return (firstValue - secondValue) * (sort.direction === 'asc' ? 1 : -1);
  });
  const toggleSort = (key: 'risk' | 'observed') => setSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }));
  const availableSurfaces = [...new Set(sightings.map((sighting) => sighting.surface))];
  if (selectedSurface !== 'all' && !availableSurfaces.includes(selectedSurface)) availableSurfaces.push(selectedSurface);
  const surfaceFilters = ['all', ...availableSurfaces];

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
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.07] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-300" /> Digital risk intelligence <span className="text-slate-600">/</span> Evidence queue
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Findings &amp; exposure</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-400">Review observed brand risks across monitored digital surfaces and inspect their source evidence.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[11px] text-slate-400"><span className={`h-1.5 w-1.5 rounded-full ${isError ? 'bg-rose-400' : 'bg-emerald-400'}`} />{isError ? 'Source unavailable' : 'Workspace records'}</span>
          <span suppressHydrationWarning className="rounded-lg border border-violet-300/15 bg-violet-300/[0.07] px-3 py-2 font-mono text-[11px] text-violet-200">{mounted ? filteredSightings.length : '—'} findings</span>
        </div>
      </div>

      <section aria-label="Featured finding filters" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
            { key: 'all', label: 'All findings', value: candidateSightings.length, color: 'text-white', dot: 'bg-violet-300' },
            { key: 'high-risk', label: 'High risk · score ≥ 80', value: highRiskCount, color: 'text-rose-300', dot: 'bg-rose-400' },
            { key: 'needs-review', label: 'Needs analyst review', value: reviewCount, color: 'text-amber-200', dot: 'bg-amber-300' },
            { key: 'benign', label: 'Marked benign', value: benignCount, color: 'text-emerald-300', dot: 'bg-emerald-300' },
        ].map((metric) => <button type="button" key={metric.key} onClick={() => updateFilter('triage', metric.key)} aria-pressed={selectedQuickFilter === metric.key} className={`rounded-xl border px-4 py-3.5 text-left transition ${selectedQuickFilter === metric.key ? 'border-violet-300/25 bg-violet-300/[0.08]' : 'border-white/[0.07] bg-[#111a27] hover:border-white/[0.13] hover:bg-white/[0.035]'}`}><div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.11em] text-slate-500"><i className={`h-1.5 w-1.5 rounded-full ${metric.dot}`} />{metric.label}</div><div className={`mt-2 font-mono text-2xl font-semibold tracking-tight ${metric.color}`}>{isLoading || isError ? '—' : metric.value}</div></button>)}
      </section>

      {/* Filters & Search Toolbar (G7 URL State) */}
      <div className="flex flex-col gap-3 rounded-xl border border-white/[0.075] bg-[#111a27] p-3.5 sm:p-4 xl:flex-row xl:items-center xl:justify-between">
        {/* Surface Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            <Filter className="h-3.5 w-3.5" /> Surface
          </span>
          {surfaceFilters.map((sfc) => (
            <button
              key={sfc}
              onClick={() => updateFilter('surface', sfc)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer capitalize ${
                selectedSurface === sfc
                  ? 'border border-violet-300/20 bg-violet-300/[0.12] text-violet-100'
                  : 'border border-transparent bg-white/[0.035] text-slate-400 hover:bg-white/[0.07] hover:text-slate-200'
              }`}
            >
              {sfc === 'all' ? 'All surfaces' : sfc.replaceAll('_', ' ')}
            </button>
          ))}
        </div>

        {/* Classification Filters */}
        <div className="flex items-center gap-2">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Class</span>
          {['all', 'malicious', 'benign'].map((t) => (
            <button
              key={t}
              onClick={() => updateFilter('type', t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer capitalize ${
                selectedType === t
                  ? 'border border-cyan-300/20 bg-cyan-300/[0.1] text-cyan-100'
                  : 'border border-transparent bg-white/[0.035] text-slate-400 hover:bg-white/[0.07] hover:text-slate-200'
              }`}
            >
              {t === 'benign' ? 'Benign (Fan Match)' : t}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] xl:w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search payload, URL, or sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-white/[0.09] bg-[#0b1119] py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-violet-400/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Sightings List */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Findings table */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-white/[0.075] bg-[#111a27]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
            <div><h2 className="text-sm font-semibold text-slate-100">Observed findings</h2><p className="mt-0.5 text-[11px] text-slate-500">Select a row to inspect its evidence and source</p></div>
            <span className="rounded-md border border-white/[0.08] bg-white/[0.025] px-2 py-1 font-mono text-[10px] text-slate-400">{filteredSightings.length} records</span>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-5">{[0, 1, 2, 3].map((row) => <div key={row} className="h-12 animate-pulse rounded-lg bg-white/[0.035]" />)}</div>
          ) : isError ? (
            <div role="alert" className="m-4 rounded-xl border border-rose-900/70 bg-rose-950/30 p-5 text-sm text-rose-200">
              Could not load findings. {error instanceof Error ? error.message : 'Check the API connection and try again.'}
            </div>
          ) : filteredSightings.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-2 px-5 text-center">
              <Bell className="h-5 w-5 text-slate-600" /><p className="text-sm text-slate-300">No findings match these filters.</p><p className="text-xs text-slate-500">Try another surface or classification.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[84px_minmax(220px,1.5fr)_minmax(100px,.75fr)_minmax(126px,.8fr)_minmax(120px,.8fr)] gap-3 border-b border-white/[0.06] bg-white/[0.018] px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-500 sm:px-5">
                  <button type="button" onClick={() => toggleSort('risk')} className="inline-flex items-center gap-1 text-left hover:text-slate-200" aria-label="Sort by risk">Risk <ArrowDownUp className="h-3 w-3" /></button><span>Target / evidence</span><span>Surface</span><button type="button" onClick={() => toggleSort('observed')} className="inline-flex items-center gap-1 text-left hover:text-slate-200" aria-label="Sort by first observed">First observed <ArrowDownUp className="h-3 w-3" /></button><span>Classification</span>
                </div>
                {sortedSightings.map((sighting) => {
              const isBenign = sighting.normalized_payload?.isBenign === true;
              const isSelected = activeSighting?.id === sighting.id;
              const score = getRiskScore(sighting);

              return (
                <button
                  type="button"
                  key={sighting.id}
                  onClick={() => setActiveSighting(sighting)}
                  className={`grid w-full grid-cols-[84px_minmax(220px,1.5fr)_minmax(100px,.75fr)_minmax(126px,.8fr)_minmax(120px,.8fr)] items-center gap-3 border-b border-white/[0.055] px-4 py-3.5 text-left transition sm:px-5 ${
                    isSelected
                      ? 'bg-violet-400/[0.07] shadow-[inset_2px_0_0_#9e8cff]'
                      : 'hover:bg-white/[0.025]'
                  }`}
                >
                  <span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] font-semibold ${score === null ? 'border-white/[0.08] bg-white/[0.025] text-slate-500' : score >= 80 ? 'border-rose-400/20 bg-rose-400/[0.08] text-rose-300' : score >= 50 ? 'border-amber-300/20 bg-amber-300/[0.07] text-amber-200' : 'border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200'}`}>{score === null ? '—' : score}</span>
                  <span className="min-w-0"><span className="block truncate text-xs font-medium text-slate-200">{sighting.raw_ref || 'Unresolved target'}</span><span className="mt-1 block truncate text-[10px] text-slate-500">{sighting.source_kind.replaceAll('_', ' ')} · {sighting.normalized_payload?.evidence_text || 'Evidence captured for review'}</span></span>
                  <span className="flex min-w-0 items-center gap-2 text-[11px] text-slate-300"><span className="rounded-md border border-white/[0.07] bg-white/[0.035] p-1.5">{getSurfaceIcon(sighting.surface)}</span><span className="truncate capitalize">{sighting.surface.replaceAll('_', ' ')}</span></span>
                  <time className="text-[11px] text-slate-400">{new Date(sighting.observed_at || sighting.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                  <span className="flex min-w-0 flex-col items-start gap-1"><TriageStatusBadge status={((sighting as any).triage_status as any) || (isBenign ? 'false_positive' : 'pending')} /><DataModeBadge mode={((sighting as any).data_mode || (sighting.source_kind === 'demo_generator' ? 'synthetic_demo' : 'live')) as any} size="sm" /></span>
                </button>
              );
            })
              }
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sighting Detail Inspector */}
        <div className="space-y-4">
          {activeSighting ? (
            <div className="sticky top-4 space-y-4 rounded-xl border border-white/[0.075] bg-[#111a27] p-5">
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
                  <div className="space-y-1 rounded-lg border border-white/[0.07] bg-[#0b1119] p-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">URI / Handle:</span>
                    <span className="max-w-[200px] truncate font-mono font-medium text-violet-200">{activeSighting.raw_ref}</span>
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
                <div className="max-h-48 overflow-y-auto rounded-lg border border-white/[0.07] bg-[#0b1119] p-3 font-mono text-xs leading-relaxed text-slate-300">
                  {activeSighting.normalized_payload?.evidence_text || activeSighting.raw_ref}
                </div>
              </div>

              {/* Shared Pivots (G5 story) */}
              {activeSighting.normalized_payload?.sharedPivots && activeSighting.normalized_payload.sharedPivots.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clustered Pivots</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSighting.normalized_payload.sharedPivots.map((p: string, idx: number) => (
                      <span key={idx} className="rounded border border-violet-400/20 bg-violet-400/[0.08] px-2 py-1 font-mono text-xs text-violet-200">
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-300/15 bg-violet-400/[0.13] px-3 py-2 text-xs font-semibold text-violet-100 shadow transition hover:bg-violet-400/[0.2]"
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
