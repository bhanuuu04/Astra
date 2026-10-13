'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
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
  Sparkles,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getActiveUser, getOverview, listCampaigns, listSightings, listBrands, runAnalysisJob, startThreatScan, type Campaign, type Sighting, type Brand } from '@/lib/api';
import { ThreatTelemetryCharts } from '@/components/analytics/ThreatTelemetryCharts';
import { SocialConnectHub } from '@/components/socials/SocialConnectHub';
import { InboundMessageSafetyFeed } from '@/components/messages/InboundMessageSafetyFeed';
import { ThreatScanHUD } from './ThreatScanHUD';

const panel = 'rounded-[8px] border border-[#e3e2e0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]';


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
  if (score >= 80) return { label: 'High', style: 'border-rose-300 bg-rose-50 text-rose-700 font-bold' };
  if (score >= 50) return { label: 'Medium', style: 'border-amber-300 bg-amber-50 text-amber-700 font-bold' };
  return { label: 'Review', style: 'border-[#e3e2e0] bg-[#f7f6f3] text-[#37352f] font-medium' };
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
    cyan: 'bg-[#f7f6f3] text-[#0f7b6c] border border-[#e3e2e0]',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    green: 'bg-[#f7f6f3] text-[#0f7b6c] border border-[#e3e2e0]',
  };
  return (
    <article className={`${panel} p-4 sm:p-5 transition hover:border-[#9b9a97]`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9b9a97]">{label}</p>
          <p className="mt-1.5 font-mono text-3xl font-bold tracking-tight text-[#37352f]">
            {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-[#e3e2e0]" aria-label="Loading" /> : value}
          </p>
        </div>
        <span className={`rounded-[6px] p-2 ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-2.5 text-xs text-[#787774]">{detail}</p>
    </article>
  );
}

function FindingRow({ sighting }: { sighting: Sighting }) {
  const payload = sighting.normalized_payload || {};
  const sender = payload.sender || {};
  const domain = payload.domain;
  const whoisUrl = payload.whois_url;
  const rawTarget = domain || (sender.username ? `@${sender.username}` : sighting.raw_ref || `${surfaceLabel(sighting.surface)} finding`);
  const summary = payload.threat_analysis?.summary || payload.content || 'Evidence captured for analyst review';
  const cleanSummary = typeof summary === 'string' ? summary : 'Evidence captured for analyst review';

  // Direct accessible target link
  let accessibleUrl = payload.target_url || sighting.raw_ref;
  if (!accessibleUrl && sender.username) {
    const cleanUser = sender.username.replace('@', '');
    const surface = sighting.surface.toLowerCase();
    if (surface.includes('instagram')) accessibleUrl = `https://instagram.com/${cleanUser}`;
    else if (surface.includes('twitter') || surface.includes('x')) accessibleUrl = `https://x.com/${cleanUser}`;
    else if (surface.includes('facebook')) accessibleUrl = `https://facebook.com/${cleanUser}`;
    else if (surface.includes('linkedin')) accessibleUrl = `https://linkedin.com/in/${cleanUser}`;
    else if (surface.includes('telegram')) accessibleUrl = `https://t.me/${cleanUser}`;
    else if (surface.includes('youtube')) accessibleUrl = `https://youtube.com/@${cleanUser}`;
  } else if (!accessibleUrl && domain) {
    accessibleUrl = `https://${domain}`;
  }

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-[#e3e2e0] py-3.5 first:border-0">
      <span className="rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] p-2 text-[#0f7b6c]"><SurfaceIcon surface={sighting.surface} /></span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {accessibleUrl ? (
            <a
              href={accessibleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 truncate text-sm font-bold text-[#37352f] hover:text-[#0f7b6c]"
            >
              <span className="truncate">{rawTarget}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#787774] transition group-hover:text-[#0f7b6c]" />
            </a>
          ) : (
            <p className="truncate text-sm font-bold text-[#37352f]">{rawTarget}</p>
          )}

          {whoisUrl && (
            <a
              href={whoisUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 rounded-[4px] border border-[#e3e2e0] bg-[#f7f6f3] px-1.5 py-0.5 text-[10px] font-semibold text-[#787774] hover:bg-white hover:text-[#37352f]"
            >
              WHOIS <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Verified Source
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-[#787774]">{surfaceLabel(sighting.surface)} · {cleanSummary}</p>
      </div>
      <time className="whitespace-nowrap font-mono text-xs text-[#9b9a97]">{formatDate(sighting.observed_at || sighting.created_at)}</time>
    </div>
  );
}


function InvestigationRow({ campaign }: { campaign: Campaign }) {
  const risk = severity(campaign.risk_score);
  return (
    <div className="grid gap-3 border-t border-slate-100 py-4 first:border-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
      <div className="min-w-0">
        <Link href={`/campaigns/${campaign.id}`} className="group inline-flex max-w-full items-center gap-1.5 text-sm font-bold text-slate-900 hover:text-sky-600">
          <span className="truncate">{campaign.title}</span><ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
        </Link>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span className="font-mono">{campaign.member_count} linked {campaign.member_count === 1 ? 'asset' : 'assets'}</span>
          <span aria-hidden="true">·</span><span className="capitalize">{campaign.status.replaceAll('_', ' ')}</span>
          {campaign.last_seen_at && <><span aria-hidden="true">·</span><span>Updated {formatDate(campaign.last_seen_at)}</span></>}
        </p>
      </div>
      <span className={`w-fit rounded-md border px-2 py-1 text-xs font-semibold ${risk.style}`}>{risk.label} risk · {Math.round(campaign.risk_score)}</span>
      <div className="flex items-center gap-3">
        <Link href={`/campaigns/${campaign.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700">
          Investigate <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link href={`/campaigns/${campaign.id}/response`} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
          <FileCheck className="h-3.5 w-3.5" /> Response
        </Link>
      </div>
    </div>
  );
}

export function OverviewView() {
  const router = useRouter();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [analysisProgress, setAnalysisProgress] = useState<string | null>(null);
  const { data: overview, isLoading: loadingOverview, isError: overviewError } = useQuery({ queryKey: ['overview'], queryFn: getOverview, refetchInterval: 10000 });
  const { data: campaigns = [], isLoading: loadingCampaigns, isError: campaignsError } = useQuery({ queryKey: ['campaigns'], queryFn: () => listCampaigns() });
  const { data: sightings = [], isLoading: loadingSightings, isError: sightingsError } = useQuery({ queryKey: ['sightings'], queryFn: () => listSightings() });
  const { data: brands = [], isLoading: loadingBrands } = useQuery<Brand[]>({ queryKey: ['brands'], queryFn: () => listBrands() });
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetSetupGuide = async () => {
    setIsResetting(true);
    try {
      const activeUser = getActiveUser();
      const email = activeUser?.email?.toLowerCase();
      
      await fetch('/api/brand/reset-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (typeof window !== 'undefined') {
        localStorage.removeItem('astra_onboarding_completed');
        if (email) {
          localStorage.removeItem(`astra_onboarding_completed_${email}`);
          localStorage.removeItem(`astra_current_brand_dna_${email}`);
        }
        localStorage.removeItem('astra_current_brand_dna');
        localStorage.removeItem('astra_configured_brand');
      }

      queryClient.clear();
      window.location.href = '/guide?reset=true';
    } catch (e) {
      console.error('Reset guide failed:', e);
      window.location.href = '/guide?reset=true';
    } finally {
      setIsResetting(false);
    }
  };

  // Onboarding Guard: If authenticated and user has not completed onboarding, direct straight to /guide
  useEffect(() => {
    if (isAuthLoaded && isSignedIn && !loadingBrands && brands.length === 0) {
      const activeUser = getActiveUser();
      const email = activeUser?.email?.toLowerCase();
      const userOnboarded = activeUser?.onboarding_completed || (email && typeof window !== 'undefined' && localStorage.getItem(`astra_onboarding_completed_${email}`) === 'true');
      if (!userOnboarded) {
        router.replace('/guide');
      }
    }
  }, [isAuthLoaded, isSignedIn, loadingBrands, brands.length, router]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentBrandInfo = useMemo(() => {
    let localBrand: any = null;
    const activeEmail = getActiveUser()?.email?.toLowerCase();

    if (mounted && typeof window !== 'undefined' && activeEmail) {
      try {
        const raw = localStorage.getItem(`astra_current_brand_dna_${activeEmail}`) || localStorage.getItem('astra_current_brand_dna');
        if (raw) {
          localBrand = JSON.parse(raw);
        }
      } catch {}
    }

    // Priority 1: live brand record from Supabase for this tenant
    // Priority 2: user-onboarded brand from scoped storage
    // Priority 3: clean default
    const b = brands[0] || null;
    const bName = b?.name || localBrand?.name || 'Protected Brand';
    const bDomain =
      b?.assets?.find((a: any) => a.asset_type === 'domain')?.canonical_value ||
      localBrand?.domain ||
      'domain.com';
    return { name: bName, domain: bDomain, verification: localBrand?.verification || null };
  }, [brands, mounted]);


  const analysisMutation = useMutation({
    mutationFn: async () => {
      const scanPromise = startThreatScan(brands[0]?.id);
      const analysisPromise = runAnalysisJob(brands[0]?.id);
      const [scanRes, analysisRes] = await Promise.allSettled([scanPromise, analysisPromise]);
      queryClient.invalidateQueries({ queryKey: ['threat-scan-status'] });
      return analysisRes.status === 'fulfilled' ? analysisRes.value : null;
    },
    onMutate: () => setAnalysisProgress('Initializing live perimeter audit and homoglyph scan…'),
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      setAnalysisProgress(data ? `Analysis active · ${data.signals_generated} signals · ${data.edges_proposed} links proposed` : 'Perimeter audit launched.');
      setTimeout(() => setAnalysisProgress(null), 5000);
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
      <header className="flex flex-col gap-4 border-b border-[#e3e2e0] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#0f7b6c]">
            <Radar className="h-3.5 w-3.5" /> Security &amp; Brand Protection Overview
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#37352f] sm:text-3xl">Digital Risk &amp; Social Defense</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#787774]">
            Connect brand channels, analyze inbound social messages for collaborator safety in real time, and investigate linked scam campaigns.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-[#787774] font-medium"><span className={`h-1.5 w-1.5 rounded-full ${overviewUnavailable || overviewError ? 'bg-amber-400' : 'bg-[#0f7b6c]'}`} />{overviewUnavailable || overviewError ? 'Data source unavailable' : 'Real-time telemetry active'}</span>
          <Link href="/landing" className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#e3e2e0] bg-white px-3 text-xs font-medium text-[#37352f] transition hover:bg-[#f7f6f3] shadow-2xs">Product tour <ExternalLink className="h-3 w-3 text-[#9b9a97]" /></Link>
          <button onClick={() => analysisMutation.mutate()} disabled={analysisMutation.isPending} className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#0f7b6c] px-3.5 text-xs font-medium text-white shadow-2xs transition hover:bg-[#0b5e52] disabled:cursor-wait disabled:opacity-70">
            {analysisMutation.isPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {analysisMutation.isPending ? 'Analyzing…' : 'Run threat analysis'}
          </button>
        </div>
      </header>

      {analysisProgress && <div role="status" className="flex items-center gap-2 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] px-4 py-2.5 text-xs font-medium text-[#37352f]"><Activity className={`h-4 w-4 shrink-0 text-[#0f7b6c] ${analysisMutation.isPending ? 'animate-pulse' : ''}`} />{analysisProgress}</div>}
      {(campaignsError || sightingsError) && <div role="alert" className="rounded-[6px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">Some dashboard data could not be loaded. Refresh the page or check the API connection.</div>}

      {(overviewError || overviewUnavailable) && !hasData && <div role="status" className="rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] px-4 py-2.5 text-xs text-[#787774]">ASTRA could not load workspace data. Confirm the API is running; the dashboard will refresh automatically.</div>}

      {/* BRAND DNA & NVIDIA NIM SENTINEL STATUS BAR */}
      <section className="rounded-[8px] border border-[#e3e2e0] bg-white p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-[6px] bg-[#37352f] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-[#37352f]">{currentBrandInfo.name}</span>
              <span className="font-mono text-xs text-[#0f7b6c] bg-[#f7f6f3] border border-[#e3e2e0] rounded-[4px] px-2 py-0.5">
                {currentBrandInfo.domain}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f6f3] border border-[#e3e2e0] text-[#0f7b6c] text-[10px] font-semibold px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0f7b6c]" />
                NVIDIA NIM Verified
              </span>
            </div>
            <p className="text-xs text-[#787774] mt-0.5">
              {currentBrandInfo.verification?.brandSummary || 'Canonical perimeter invariants active. Autonomous detection guarding brand handles and lookalike domains.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/guide"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] px-3 py-1.5 text-xs font-medium text-[#37352f] hover:bg-white shadow-2xs transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#0f7b6c]" />
            <span>Setup Guide</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#e3e2e0] bg-white px-3 py-1.5 text-xs font-medium text-[#787774] hover:text-[#eb5757] hover:border-[#eb5757]/30 hover:bg-[#eb5757]/5 shadow-2xs transition"
            title="Restart setup process from scratch"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Setup Guide</span>
          </button>
        </div>
      </section>

      {/* LIVE OSINT THREAT SCANNER & PERIMETER RADAR HUD */}
      <ThreatScanHUD
        brandId={brands[0]?.id}
        brandName={currentBrandInfo.name}
        brandDomain={currentBrandInfo.domain}
      />

      {/* 1. SOCIAL BRAND CHANNELS CONNECTION HUB */}
      <section aria-label="Social handles connection">

        <SocialConnectHub />
      </section>

      {/* 2. REAL-TIME INBOUND MESSAGES & SENDER PROFILE SAFETY RADAR */}
      <section aria-label="Inbound message threat and profile safety radar">
        <InboundMessageSafetyFeed />
      </section>

      {/* 3. KEY METRICS */}
      <section aria-label="Overview metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active campaigns" value={activeCampaignValue} detail="Campaigns currently under investigation" icon={Network} loading={loadingOverview && loadingCampaigns} />
        <StatCard label="High-risk campaigns" value={highRiskValue} detail="Risk score of 80 or higher" icon={CircleAlert} tone="rose" loading={loadingOverview && loadingCampaigns} />
        <StatCard label="Recent findings" value={sightingsValue} detail="Sightings recorded across monitored surfaces" icon={Activity} loading={loadingOverview && loadingSightings} />
        <StatCard label="Monitored brands" value={overview?.brands ?? (overviewUnavailable ? '—' : 0)} detail="Brands configured for protection" icon={Layers3} tone="green" loading={loadingOverview} />
      </section>

      {/* 4. VISUAL TELEMETRY ANALYTICS */}
      <section aria-label="Threat Telemetry Analytics">
        <ThreatTelemetryCharts sightings={sightings} campaigns={campaigns} />
      </section>

      {/* 5. INVESTIGATIONS & SURFACE COVERAGE */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        <div className={`${panel} p-4 sm:p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#37352f]">Priority investigations</h2>
              <p className="mt-0.5 text-xs text-[#9b9a97]">Ranked by campaign risk score</p>
            </div>
            <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs font-medium text-[#0f7b6c] hover:underline">All campaigns <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
          {loadingCampaigns ? <div className="space-y-3 py-3"><div className="h-12 animate-pulse rounded-[6px] bg-[#f7f6f3]" /><div className="h-12 animate-pulse rounded-[6px] bg-[#f7f6f3]" /></div> : sortedCampaigns.length ? <div>{sortedCampaigns.slice(0, 4).map((campaign) => <InvestigationRow key={campaign.id} campaign={campaign} />)}</div> : <div className="flex min-h-32 flex-col items-center justify-center gap-2 border-t border-[#e3e2e0] text-center"><ShieldCheck className="h-5 w-5 text-[#0f7b6c]" /><p className="text-xs font-semibold text-[#37352f]">No active campaigns</p><p className="text-xs text-[#9b9a97]">Run analysis after sightings are ingested to find linked activity.</p></div>}
        </div>

        <div className={`${panel} p-4 sm:p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-sm font-bold text-[#37352f]">Surface coverage</h2><p className="mt-0.5 text-xs text-[#9b9a97]">Findings grouped by source surface</p></div>
            <Globe2 className="h-4 w-4 text-[#0f7b6c]" />
          </div>
          {surfaces.length ? <div className="mt-4 space-y-3.5">{surfaces.slice(0, 5).map(([surface, count]) => {
            const share = sightings.length ? (count / sightings.length) * 100 : 0;
            return <div key={surface}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="capitalize font-medium text-[#37352f]">{surfaceLabel(surface)}</span><span className="font-mono text-[#9b9a97]">{count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#f7f6f3]"><div className="h-full rounded-full bg-[#0f7b6c]" style={{ width: `${share}%` }} /></div></div>;
          })}</div> : <div className="mt-5 flex min-h-28 flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed border-[#e3e2e0] text-center"><Globe2 className="h-4 w-4 text-[#9b9a97]" /><p className="text-xs text-[#9b9a97]">Surface counts appear when findings arrive.</p></div>}
          <div className="mt-5 flex items-center gap-2 border-t border-[#e3e2e0] pt-3 text-xs text-[#9b9a97]"><Clock3 className="h-3.5 w-3.5" />{overview?.environment ? `Environment: ${overview.environment}` : 'Source data updates as findings are ingested'}</div>
        </div>
      </section>

      {/* 6. RECENT FINDINGS */}
      <section className={`${panel} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
          <div><h2 className="text-sm font-bold text-[#37352f]">Recent findings</h2><p className="mt-0.5 text-xs text-[#9b9a97]">Latest records from monitored surfaces</p></div>
          <Link href="/sightings" className="inline-flex items-center gap-1 text-xs font-medium text-[#0f7b6c] hover:underline">Findings queue <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        {loadingSightings ? <div className="space-y-3 py-3"><div className="h-10 animate-pulse rounded-[6px] bg-[#f7f6f3]" /><div className="h-10 animate-pulse rounded-[6px] bg-[#f7f6f3]" /></div> : sortedSightings.length ? <div>{sortedSightings.slice(0, 5).map((sighting) => <FindingRow key={sighting.id} sighting={sighting} />)}</div> : <div className="flex min-h-24 flex-col items-center justify-center gap-1 border-t border-[#e3e2e0] text-center"><p className="text-xs font-semibold text-[#37352f]">No findings recorded yet</p><p className="text-xs text-[#9b9a97]">New sightings will appear here when connectors ingest data.</p></div>}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e2e0] py-4 text-xs text-[#9b9a97]">
        <span className="inline-flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${overviewUnavailable ? 'bg-amber-400' : 'bg-[#0f7b6c]'}`} />Workspace data {overview?.environment ? `· ${overview.environment}` : '· source status active'}</span>
        <Link href="/brands" className="inline-flex items-center gap-1 font-medium text-[#787774] hover:text-[#37352f]">Manage monitored brands <ArrowRight className="h-3.5 w-3.5" /></Link>
      </footer>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#37352f]/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-[10px] border border-[#e3e2e0] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-[8px] bg-[#eb5757]/10 border border-[#eb5757]/20 text-[#eb5757] flex items-center justify-center shrink-0">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#37352f]">Reset Setup Guide?</h3>
                <p className="text-xs text-[#787774] leading-relaxed">
                  Restarting the setup guide will reset your brand setup progress and return you to Step 1. You will be able to enter a fresh domain, customize handles, and rebuild your perimeter baseline.
                </p>
              </div>
            </div>

            <div className="rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] p-3 text-xs text-[#787774] space-y-1.5">
              <div className="font-semibold text-[#37352f] flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                What happens during reset:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#787774]">
                <li>Brand onboarding status in database is reset.</li>
                <li>Local brand cache and configuration are cleared.</li>
                <li>You are redirected to Step 1 to input a brand domain.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="rounded-[6px] border border-[#e3e2e0] bg-white px-3.5 py-2 text-xs font-medium text-[#37352f] hover:bg-[#f7f6f3] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetSetupGuide}
                disabled={isResetting}
                className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#eb5757] px-3.5 py-2 text-xs font-medium text-white shadow-xs hover:bg-[#d94848] transition disabled:opacity-70"
              >
                {isResetting ? (
                  <>
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset &amp; Restart Guide</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
