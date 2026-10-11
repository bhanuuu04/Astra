'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileCheck,
  Fingerprint,
  Globe2,
  Layers3,
  LoaderCircle,
  Network,
  Play,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getOverview, listCampaigns, listSightings, runAnalysisJob, type Campaign, type Sighting } from '@/lib/api';
import { ThreatTelemetryCharts } from '@/components/analytics/ThreatTelemetryCharts';
const panel = 'rounded-xl border border-white/[0.075] bg-[#111a27]';

function formatDate(value?: string | null) {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Time unavailable'
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function surfaceLabel(surface: string) {
  const normalized = surface.toLowerCase();
  if (normalized.includes('instagram')) return 'Social profile';
  if (normalized.includes('telegram')) return 'Messaging';
  if (normalized.includes('apk') || normalized.includes('app')) return 'Mobile app';
  if (normalized.includes('web') || normalized.includes('domain')) return 'Web / domain';
  return surface.replaceAll('_', ' ');
}

function SurfaceIcon({ surface }: { surface: string }) {
  const normalized = surface.toLowerCase();
  if (normalized.includes('apk') || normalized.includes('app')) return <Smartphone className="h-4 w-4" />;
  if (normalized.includes('web') || normalized.includes('domain')) return <Globe2 className="h-4 w-4" />;
  if (normalized.includes('telegram') || normalized.includes('instagram') || normalized.includes('social')) return <Fingerprint className="h-4 w-4" />;
  return <ShieldAlert className="h-4 w-4" />;
}

function severity(score: number) {
  if (score >= 80) return { label: 'High', style: 'border-rose-500/30 bg-rose-500/10 text-rose-300' };
  if (score >= 50) return { label: 'Medium', style: 'border-amber-500/30 bg-amber-500/10 text-amber-200' };
  return { label: 'Review', style: 'border-slate-600 bg-slate-800 text-slate-300' };
}

function StatCard({ label, value, detail, icon: Icon, tone = 'cyan', loading = false }: {
  label: string;
  value: number | string;
  detail: string;
  icon: typeof Activity;
  tone?: 'cyan' | 'rose' | 'amber' | 'green';
  loading?: boolean;
}) {
  const tones = {
    cyan: 'bg-cyan-400/10 text-cyan-300',
    rose: 'bg-rose-400/10 text-rose-300',
    amber: 'bg-amber-400/10 text-amber-200',
    green: 'bg-emerald-400/10 text-emerald-300',
  };
  return (
    <article className={`${panel} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-slate-50">
            {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-700" aria-label="Loading" /> : value}
          </p>
        </div>
        <span className={`rounded-lg p-2.5 ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function FindingRow({ sighting }: { sighting: Sighting }) {
  const payload = sighting.normalized_payload || {};
  const sender = payload.sender || {};
  const target = sender.username ? `@${sender.username}` : sighting.raw_ref || `${surfaceLabel(sighting.surface)} finding`;
  const summary = payload.threat_analysis?.summary || payload.content || 'Evidence captured for analyst review';
  const cleanSummary = typeof summary === 'string' ? summary : 'Evidence captured for analyst review';
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-slate-800/80 py-3 first:border-0">
      <span className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300"><SurfaceIcon surface={sighting.surface} /></span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">{target}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{surfaceLabel(sighting.surface)} · {cleanSummary}</p>
      </div>
      <time className="whitespace-nowrap text-xs text-slate-500">{formatDate(sighting.observed_at || sighting.created_at)}</time>
    </div>
  );
}

function InvestigationRow({ campaign }: { campaign: Campaign }) {
  const risk = severity(campaign.risk_score);
  return (
    <div className="grid gap-3 border-t border-slate-800/80 py-4 first:border-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
      <div className="min-w-0">
        <Link href={`/campaigns/${campaign.id}`} className="group inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-slate-100 hover:text-cyan-200">
          <span className="truncate">{campaign.title}</span><ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
        </Link>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span className="font-mono">{campaign.member_count} linked {campaign.member_count === 1 ? 'asset' : 'assets'}</span>
          <span aria-hidden="true">·</span><span className="capitalize">{campaign.status.replaceAll('_', ' ')}</span>
          {campaign.last_seen_at && <><span aria-hidden="true">·</span><span>Updated {formatDate(campaign.last_seen_at)}</span></>}
        </p>
      </div>
      <span className={`w-fit rounded-md border px-2 py-1 text-xs font-medium ${risk.style}`}>{risk.label} risk · {Math.round(campaign.risk_score)}</span>
      <div className="flex items-center gap-3">
        <Link href={`/campaigns/${campaign.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200">
          Investigate <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link href={`/campaigns/${campaign.id}/response`} className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
          <FileCheck className="h-3.5 w-3.5" /> Response
        </Link>
      </div>
    </div>
  );
}

export function OverviewView() {
  const queryClient = useQueryClient();
  const [analysisProgress, setAnalysisProgress] = useState<string | null>(null);
  const { data: overview, isLoading: loadingOverview, isError: overviewError } = useQuery({ queryKey: ['overview'], queryFn: getOverview, refetchInterval: 10000 });
  const { data: campaigns = [], isLoading: loadingCampaigns, isError: campaignsError } = useQuery({ queryKey: ['campaigns'], queryFn: () => listCampaigns() });
  const { data: sightings = [], isLoading: loadingSightings, isError: sightingsError } = useQuery({ queryKey: ['sightings'], queryFn: () => listSightings() });

  const analysisMutation = useMutation({
    mutationFn: () => runAnalysisJob(),
    onMutate: () => setAnalysisProgress('Analyzing current sightings and proposing campaign links…'),
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      setAnalysisProgress(data ? `Analysis complete · ${data.signals_generated} signals · ${data.edges_proposed} links proposed` : 'Analysis completed, but no result details were returned.');
      setTimeout(() => setAnalysisProgress(null), 6000);
    },
    onError: () => {
      setAnalysisProgress('Analysis could not reach the API. Check the service connection and try again.');
      setTimeout(() => setAnalysisProgress(null), 5000);
    },
  });

  const sortedCampaigns = useMemo(() => [...campaigns].sort((a, b) => b.risk_score - a.risk_score), [campaigns]);
  const sortedSightings = useMemo(() => [...sightings].sort((a, b) => new Date(b.observed_at || b.created_at).getTime() - new Date(a.observed_at || a.created_at).getTime()), [sightings]);
  const highRiskCount = campaigns.filter((campaign) => campaign.risk_score >= 80).length;
  const surfaces = useMemo(() => {
    const counts = new Map<string, number>();
    sightings.forEach((sighting) => counts.set(sighting.surface, (counts.get(sighting.surface) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [sightings]);
  const hasData = Boolean(overview || campaigns.length || sightings.length);
  const overviewUnavailable = !loadingOverview && !overview;
  const activeCampaignValue = overview?.active_campaigns ?? (campaigns.length ? campaigns.filter((campaign) => campaign.status === 'active').length : overviewUnavailable ? '—' : 0);
  const highRiskValue = overview?.high_risk_campaigns ?? (campaigns.length ? highRiskCount : overviewUnavailable ? '—' : 0);
  const sightingsValue = overview?.sightings ?? (sightings.length || overviewUnavailable ? (sightings.length ? sightings.length : '—') : 0);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
            <Radar className="h-3.5 w-3.5" /> Security overview
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">Digital risk landscape</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Review active campaigns, recent findings, and the evidence behind suspected brand abuse.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-2 text-xs text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${overviewUnavailable || overviewError ? 'bg-amber-400' : 'bg-emerald-400'}`} />{overviewUnavailable || overviewError ? 'Data source unavailable' : 'Auto-refresh · 10 sec'}</span>
          <Link href="/landing" className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">Product tour <ExternalLink className="h-3.5 w-3.5" /></Link>
          <button onClick={() => analysisMutation.mutate()} disabled={analysisMutation.isPending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-cyan-500 px-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-70">
            {analysisMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {analysisMutation.isPending ? 'Analyzing…' : 'Run analysis'}
          </button>
        </div>
      </header>

      {analysisProgress && <div role="status" className="flex items-center gap-2 rounded-lg border border-cyan-900 bg-cyan-950/50 px-4 py-3 text-sm text-cyan-100"><Activity className={`h-4 w-4 shrink-0 text-cyan-300 ${analysisMutation.isPending ? 'animate-pulse' : ''}`} />{analysisProgress}</div>}
      {(campaignsError || sightingsError) && <div role="alert" className="rounded-lg border border-rose-900/70 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">Some dashboard data could not be loaded. Refresh the page or check the API connection; unavailable data is not shown as zero.</div>}

      {(overviewError || overviewUnavailable) && !hasData && <div role="status" className="rounded-lg border border-amber-300/10 bg-amber-300/[0.035] px-4 py-3 text-sm text-amber-100">ASTRA could not load workspace data. Confirm the API is running; the dashboard will refresh automatically.</div>}

      <section aria-label="Overview metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active campaigns" value={activeCampaignValue} detail="Campaigns currently under investigation" icon={Network} loading={loadingOverview && loadingCampaigns} />
        <StatCard label="High-risk campaigns" value={highRiskValue} detail="Risk score of 80 or higher" icon={CircleAlert} tone="rose" loading={loadingOverview && loadingCampaigns} />
        <StatCard label="Recent findings" value={sightingsValue} detail="Sightings recorded across monitored surfaces" icon={Activity} loading={loadingOverview && loadingSightings} />
        <StatCard label="Monitored brands" value={overview?.brands ?? (overviewUnavailable ? '—' : 0)} detail="Brands configured for protection" icon={Layers3} tone="green" loading={loadingOverview} />
      </section>

      {/* Visual Threat Intelligence & Telemetry Analytics */}
      <section aria-label="Threat Telemetry Analytics">
        <ThreatTelemetryCharts sightings={sightings} campaigns={campaigns} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        <div className={`${panel} p-4 sm:p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Priority investigations</h2>
              <p className="mt-1 text-xs text-slate-500">Ranked by campaign risk score</p>
            </div>
            <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200">All campaigns <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
          {loadingCampaigns ? <div className="space-y-3 py-3"><div className="h-12 animate-pulse rounded bg-slate-800" /><div className="h-12 animate-pulse rounded bg-slate-800" /></div> : sortedCampaigns.length ? <div>{sortedCampaigns.slice(0, 4).map((campaign) => <InvestigationRow key={campaign.id} campaign={campaign} />)}</div> : <div className="flex min-h-32 flex-col items-center justify-center gap-2 border-t border-slate-800 text-center"><ShieldCheck className="h-5 w-5 text-emerald-400" /><p className="text-sm font-medium text-slate-300">No active campaigns</p><p className="text-xs text-slate-500">Run analysis after sightings are ingested to find linked activity.</p></div>}
        </div>

        <div className={`${panel} p-4 sm:p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-base font-semibold text-slate-100">Surface coverage</h2><p className="mt-1 text-xs text-slate-500">Findings grouped by source surface</p></div>
            <Globe2 className="h-4 w-4 text-cyan-300" />
          </div>
          {surfaces.length ? <div className="mt-5 space-y-4">{surfaces.slice(0, 5).map(([surface, count]) => {
            const share = sightings.length ? (count / sightings.length) * 100 : 0;
            return <div key={surface}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="capitalize text-slate-300">{surfaceLabel(surface)}</span><span className="font-mono text-slate-400">{count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${share}%` }} /></div></div>;
          })}</div> : <div className="mt-5 flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 text-center"><Globe2 className="h-4 w-4 text-slate-500" /><p className="text-xs text-slate-500">Surface counts appear when findings arrive.</p></div>}
          <div className="mt-5 flex items-center gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" />{overview?.environment ? `Environment: ${overview.environment}` : 'Source data updates as findings are ingested'}</div>
        </div>
      </section>

      <section className={`${panel} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
          <div><h2 className="text-base font-semibold text-slate-100">Recent findings</h2><p className="mt-1 text-xs text-slate-500">Latest records from monitored surfaces</p></div>
          <Link href="/sightings" className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200">Findings queue <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        {loadingSightings ? <div className="space-y-3 py-3"><div className="h-10 animate-pulse rounded bg-slate-800" /><div className="h-10 animate-pulse rounded bg-slate-800" /></div> : sortedSightings.length ? <div>{sortedSightings.slice(0, 5).map((sighting) => <FindingRow key={sighting.id} sighting={sighting} />)}</div> : <div className="flex min-h-24 flex-col items-center justify-center gap-1 border-t border-slate-800 text-center"><p className="text-sm font-medium text-slate-300">No findings recorded yet</p><p className="text-xs text-slate-500">New sightings will appear here when connectors ingest data.</p></div>}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 py-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${overviewUnavailable ? 'bg-amber-400' : 'bg-slate-500'}`} />Workspace data {overview?.environment ? `· ${overview.environment}` : '· source status unavailable'}</span>
        <Link href="/brands" className="inline-flex items-center gap-1 hover:text-slate-300">Manage monitored brands <ArrowRight className="h-3.5 w-3.5" /></Link>
      </footer>
    </div>
  );
}
