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
      <div className="flex flex-col gap-4 border-b border-[#e3e2e0] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-wide text-[#0f7b6c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0f7b6c]" /> Digital risk intelligence <span className="text-[#9b9a97]">/</span> Evidence queue
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#37352f] sm:text-3xl">Findings &amp; Exposure</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#787774]">Review observed brand risks across monitored digital surfaces and inspect their source evidence.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-[6px] border border-[#e3e2e0] bg-white px-3 py-1.5 text-xs font-medium text-[#787774] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className={`h-1.5 w-1.5 rounded-full ${isError ? 'bg-[#eb5757]' : 'bg-[#0f7b6c]'}`} />
            {isError ? 'Source unavailable' : 'Workspace records'}
          </span>
          <span suppressHydrationWarning className="rounded-[6px] border border-[#0f7b6c]/20 bg-[#0f7b6c]/10 px-3 py-1.5 font-mono text-xs font-semibold text-[#0f7b6c]">
            {mounted ? filteredSightings.length : '—'} findings
          </span>
        </div>
      </div>

      <section aria-label="Featured finding filters" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { key: 'all', label: 'All findings', value: candidateSightings.length, color: 'text-[#37352f]', dot: 'bg-[#37352f]' },
          { key: 'high-risk', label: 'High risk · score ≥ 80', value: highRiskCount, color: 'text-[#eb5757]', dot: 'bg-[#eb5757]' },
          { key: 'needs-review', label: 'Needs analyst review', value: reviewCount, color: 'text-[#d97706]', dot: 'bg-[#d97706]' },
          { key: 'benign', label: 'Marked benign', value: benignCount, color: 'text-[#0f7b6c]', dot: 'bg-[#0f7b6c]' },
        ].map((metric) => (
          <button
            type="button"
            key={metric.key}
            onClick={() => updateFilter('triage', metric.key)}
            aria-pressed={selectedQuickFilter === metric.key}
            className={`rounded-[8px] border p-4 text-left transition ${
              selectedQuickFilter === metric.key
                ? 'border-[#0f7b6c] bg-[#0f7b6c]/5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                : 'border-[#e3e2e0] bg-white hover:border-[#9b9a97] hover:bg-[#f7f6f3] shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
            }`}
          >
            <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-[#787774]">
              <i className={`h-1.5 w-1.5 rounded-full ${metric.dot}`} />
              {metric.label}
            </div>
            <div className={`mt-2 font-mono text-2xl font-bold tracking-tight ${metric.color}`}>
              {isLoading || isError ? '—' : metric.value}
            </div>
          </button>
        ))}
      </section>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-[8px] border border-[#e3e2e0] bg-white p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] xl:flex-row xl:items-center xl:justify-between">
        {/* Surface Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#787774]">
            <Filter className="h-3.5 w-3.5" /> Surface
          </span>
          {surfaceFilters.map((sfc) => (
            <button
              key={sfc}
              onClick={() => updateFilter('surface', sfc)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition cursor-pointer capitalize ${
                selectedSurface === sfc
                  ? 'border border-[#0f7b6c] bg-[#0f7b6c]/10 text-[#0f7b6c] font-semibold'
                  : 'border border-[#e3e2e0] bg-white text-[#787774] hover:bg-[#f7f6f3] hover:text-[#37352f]'
              }`}
            >
              {sfc === 'all' ? 'All surfaces' : sfc.replaceAll('_', ' ')}
            </button>
          ))}
        </div>

        {/* Classification Filters */}
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold text-[#787774]">Class</span>
          {['all', 'malicious', 'benign'].map((t) => (
            <button
              key={t}
              onClick={() => updateFilter('type', t)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition cursor-pointer capitalize ${
                selectedType === t
                  ? 'border border-[#0f7b6c] bg-[#0f7b6c]/10 text-[#0f7b6c] font-semibold'
                  : 'border border-[#e3e2e0] bg-white text-[#787774] hover:bg-[#f7f6f3] hover:text-[#37352f]'
              }`}
            >
              {t === 'benign' ? 'Benign (Fan Match)' : t}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] xl:w-[280px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#9b9a97]" />
          <input
            type="text"
            placeholder="Search payload, URL, or sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] py-1.5 pl-8 pr-3 text-xs text-[#37352f] placeholder-[#9b9a97] transition focus:border-[#0f7b6c] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Sightings List */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Findings table */}
        <div className="min-w-0 overflow-hidden rounded-[8px] border border-[#e3e2e0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between border-b border-[#e3e2e0] px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-[#37352f]">Observed Findings</h2>
              <p className="mt-0.5 text-xs text-[#787774]">Select a row to inspect its evidence and source</p>
            </div>
            <span className="rounded-[4px] border border-[#e3e2e0] bg-[#f7f6f3] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#787774]">
              {filteredSightings.length} records
            </span>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-5">{[0, 1, 2, 3].map((row) => <div key={row} className="h-12 animate-pulse rounded-[6px] bg-[#f7f6f3]" />)}</div>
          ) : isError ? (
            <div role="alert" className="m-4 rounded-[6px] border border-[#eb5757]/30 bg-[#eb5757]/10 p-5 text-sm text-[#eb5757]">
              Could not load findings. {error instanceof Error ? error.message : 'Check the API connection and try again.'}
            </div>
          ) : filteredSightings.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-2 px-5 text-center">
              <Bell className="h-5 w-5 text-[#9b9a97]" />
              <p className="text-sm font-semibold text-[#37352f]">No findings match these filters.</p>
              <p className="text-xs text-[#787774]">Try another surface or classification.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[84px_minmax(220px,1.5fr)_minmax(100px,.75fr)_minmax(126px,.8fr)_minmax(120px,.8fr)] gap-3 border-b border-[#e3e2e0] bg-[#f7f6f3] px-4 py-2.5 text-[11px] font-semibold text-[#787774] sm:px-5">
                  <button type="button" onClick={() => toggleSort('risk')} className="inline-flex items-center gap-1 text-left hover:text-[#37352f]" aria-label="Sort by risk">Risk <ArrowDownUp className="h-3 w-3" /></button>
                  <span>Target / evidence</span>
                  <span>Surface</span>
                  <button type="button" onClick={() => toggleSort('observed')} className="inline-flex items-center gap-1 text-left hover:text-[#37352f]" aria-label="Sort by first observed">First observed <ArrowDownUp className="h-3 w-3" /></button>
                  <span>Classification</span>
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
                      className={`grid w-full grid-cols-[84px_minmax(220px,1.5fr)_minmax(100px,.75fr)_minmax(126px,.8fr)_minmax(120px,.8fr)] items-center gap-3 border-b border-[#e3e2e0] px-4 py-3.5 text-left transition sm:px-5 ${
                        isSelected
                          ? 'bg-[#f7f6f3] shadow-[inset_3px_0_0_#0f7b6c]'
                          : 'hover:bg-[#f7f6f3]/60'
                      }`}
                    >
                      <span className={`inline-flex w-fit items-center gap-1.5 rounded-[4px] border px-2 py-0.5 font-mono text-xs font-semibold ${
                        score === null 
                          ? 'border-[#e3e2e0] bg-[#f7f6f3] text-[#9b9a97]' 
                          : score >= 80 
                          ? 'border-[#eb5757]/30 bg-[#eb5757]/10 text-[#eb5757]' 
                          : score >= 50 
                          ? 'border-[#d97706]/30 bg-[#d97706]/10 text-[#d97706]' 
                          : 'border-[#0f7b6c]/30 bg-[#0f7b6c]/10 text-[#0f7b6c]'
                      }`}>
                        {score === null ? '—' : score}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-[#37352f]">{sighting.raw_ref || 'Unresolved target'}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-[#787774]">{sighting.source_kind.replaceAll('_', ' ')} · {sighting.normalized_payload?.evidence_text || 'Evidence captured for review'}</span>
                      </span>
                      <span className="flex min-w-0 items-center gap-2 text-xs text-[#37352f]">
                        <span className="rounded-[4px] border border-[#e3e2e0] bg-[#f7f6f3] p-1 text-[#787774]">{getSurfaceIcon(sighting.surface)}</span>
                        <span className="truncate capitalize">{sighting.surface.replaceAll('_', ' ')}</span>
                      </span>
                      <span className="flex min-w-0 flex-col items-start gap-1">
                        <TriageStatusBadge status={((sighting as any).triage_status as any) || (isBenign ? 'false_positive' : 'pending')} />
                        <DataModeBadge mode="live" size="sm" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sighting Detail Inspector */}
        <div className="space-y-4">
          {activeSighting ? (
            <div className="sticky top-4 space-y-4 rounded-[8px] border border-[#e3e2e0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between pb-3 border-b border-[#e3e2e0] flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20">
                    {getSurfaceIcon(activeSighting.surface)}
                  </span>
                  <h3 className="text-sm font-semibold text-[#37352f] capitalize">
                    {activeSighting.surface} Inspector
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <DataModeBadge mode="live" size="sm" />
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
                <span className="text-[11px] font-semibold text-[#787774] tracking-wide uppercase">Target Endpoint</span>
                <div className="space-y-1 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] p-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#787774]">URI / Handle:</span>
                    <span className="max-w-[200px] truncate font-mono font-medium text-[#0f7b6c]">{activeSighting.raw_ref}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#787774]">Surface:</span>
                    <span className="text-[#37352f] font-medium capitalize">{activeSighting.surface}</span>
                  </div>
                </div>
              </div>

              {/* Raw Evidence Text */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#787774] tracking-wide uppercase">Raw Sighting Telemetry</span>
                <div className="max-h-48 overflow-y-auto rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] p-3 font-mono text-xs leading-relaxed text-[#37352f]">
                  {activeSighting.normalized_payload?.evidence_text || activeSighting.raw_ref}
                </div>
              </div>

              {/* Shared Pivots */}
              {activeSighting.normalized_payload?.sharedPivots && activeSighting.normalized_payload.sharedPivots.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#787774] tracking-wide uppercase">Clustered Pivots</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSighting.normalized_payload.sharedPivots.map((p: string, idx: number) => (
                      <span key={idx} className="rounded-[4px] border border-[#0f7b6c]/30 bg-[#0f7b6c]/10 px-2 py-0.5 font-mono text-xs font-medium text-[#0f7b6c]">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Finding Provenance & Evidence ID */}
              <FindingSourceInfo
                finding={{
                  data_mode: 'live',
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
                    className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#0f7b6c] px-3 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0c6357]"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>View in Campaign Graph</span>
                  </Link>
                </div>
              )}

              {activeSighting.normalized_payload?.isBenign && (
                <div className="p-3 rounded-[6px] bg-[#0f7b6c]/10 border border-[#0f7b6c]/20 text-xs text-[#0f7b6c]">
                  <strong>Ablation Rule Proof:</strong> This fan page explicitly disclaims brand affiliation. Because Brand DNA is active, ASTRA accurately classifies it as Benign and keeps it outside Campaign Alpha.
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-[8px] bg-white border border-[#e3e2e0] text-center text-[#787774] text-xs shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              Select a sighting on the left to inspect raw indicators and extracted threat pivots.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
