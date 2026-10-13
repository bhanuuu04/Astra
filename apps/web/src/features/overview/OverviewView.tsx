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
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getActiveUser, getOverview, listCampaigns, listSightings, listBrands, runAnalysisJob, resetBrandProfile, type Campaign, type Sighting, type Brand } from '@/lib/api';
import { ThreatTelemetryCharts } from '@/components/analytics/ThreatTelemetryCharts';
import { ThreatScanHUD } from './ThreatScanHUD';
import { CategorizedThreatsBoard } from './CategorizedThreatsBoard';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { useDemoSafe } from '@/providers/DemoProvider';

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

          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            {sighting.source_kind.replaceAll('_', ' ')}
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
  const demo = useDemoSafe();
  const isDemoMode = demo?.isDemoMode ?? false;

  const [analysisProgress, setAnalysisProgress] = useState<string | null>(null);
  const { data: realBrands = [], isLoading: loadingBrands, isError: brandsError, refetch: refetchBrands } = useQuery<Brand[]>({ queryKey: ['brands'], queryFn: () => listBrands(), enabled: !isDemoMode });
  const brands = isDemoMode ? (demo?.brands as any[]) : realBrands;
  const currentBrandId = brands[0]?.id;

  const { data: realOverview, isLoading: loadingOverview, isError: overviewError, refetch: refetchOverview } = useQuery({ queryKey: ['overview'], queryFn: getOverview, enabled: !isDemoMode, refetchInterval: 30000 });
  const { data: realCampaigns = [], isLoading: loadingCampaigns, isError: campaignsError, refetch: refetchCampaigns } = useQuery({ queryKey: ['campaigns', currentBrandId], queryFn: () => listCampaigns(currentBrandId), enabled: !isDemoMode });
  const { data: realSightings = [], isLoading: loadingSightings, isError: sightingsError, refetch: refetchSightings } = useQuery({ queryKey: ['sightings', currentBrandId], queryFn: () => listSightings(currentBrandId), enabled: !isDemoMode });

  const overview = isDemoMode ? (demo?.overview as any) : realOverview;
  const campaigns = isDemoMode ? (demo?.campaigns as any[]) : realCampaigns;
  const sightings = isDemoMode ? (demo?.sightings as any[]) : realSightings;

  // Onboarding Guard: If authenticated and no brand has been registered for this user, direct straight to /guide
  useEffect(() => {
    if (isDemoMode) return;
    if (isAuthLoaded && isSignedIn && !loadingBrands && !brandsError && brands.length === 0) {
      const activeUser = getActiveUser();
      const email = activeUser?.email?.toLowerCase();
      const userOnboarded = activeUser?.onboarding_completed || (email && typeof window !== 'undefined' && localStorage.getItem(`astra_onboarding_completed_${email}`) === 'true');
      if (!userOnboarded) {
        router.replace('/guide');
      }
    }
  }, [isAuthLoaded, isSignedIn, loadingBrands, brandsError, brands.length, router, isDemoMode]);

  const currentBrandInfo = useMemo(() => {
    const b = brands[0] || null;
    const domainAsset = b?.assets?.find((asset: any) => asset.asset_type === 'domain');
    return {
      name: b?.name || null,
      domain: domainAsset?.canonical_value || null,
      domainVerified: domainAsset?.verification_status === 'verified',
    };
  }, [brands]);


  const analysisMutation = useMutation({
    mutationFn: () => {
      if (isDemoMode) {
        demo?.addSimulatedAction('run_analysis');
        return Promise.resolve({
          run_id: 'demo-run-' + Date.now(),
          status: 'completed',
          brand_id: brands[0]?.id || 'demo-brand',
          sightings_processed: 15,
          signals_generated: 12,
          edges_proposed: 4,
          campaigns_updated: 2,
          created_at: new Date().toISOString(),
        });
      }
      const bId = brands[0]?.id;
      if (!bId) {
        throw new Error('Please enroll a brand before running analysis.');
      }
      return runAnalysisJob(bId);
    },
    onMutate: () => setAnalysisProgress('Starting analysis…'),
    onSuccess: (data: any) => {
      void queryClient.invalidateQueries({ queryKey: ['overview'] });
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      void queryClient.invalidateQueries({ queryKey: ['sightings'] });
      setAnalysisProgress(data ? `Analysis completed · ${data.signals_generated} signals · ${data.edges_proposed} proposed links` : 'Analysis completed.');
      setTimeout(() => setAnalysisProgress(null), 5000);
    },
    onError: (err: any) => {
      setAnalysisProgress(err?.message || 'Analysis failed. Check your connection and try again.');
      setTimeout(() => setAnalysisProgress(null), 5000);
    },
  });

  const [isResettingBrand, setIsResettingBrand] = useState(false);

  const handleResetBrand = async () => {
    const brandName = currentBrandInfo.name || 'this brand';
    const confirmed = window.confirm(
      `Are you sure you want to reset the brand profile for "${brandName}"?\n\nThis will remove this brand profile and all associated scan data from the database so you can start fresh.`
    );
    if (!confirmed) return;

    setIsResettingBrand(true);
    try {
      await resetBrandProfile();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('astra_onboarding_completed');
        localStorage.removeItem('astra_user_role');
        localStorage.removeItem('astra_intended_account_type');
        localStorage.removeItem('astra_current_brand_dna');
        localStorage.removeItem('astra_configured_brand');
        localStorage.removeItem('brand_onboarding_v1');
        localStorage.removeItem('brand_onboarding_v2');
        const activeUser = getActiveUser();
        if (activeUser?.email) {
          localStorage.removeItem(`astra_onboarding_completed_${activeUser.email.toLowerCase()}`);
        }
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('astra_onboarding_completed_') || k.startsWith('astra_current_brand_dna_'))) {
            localStorage.removeItem(k);
          }
        }
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['brands'] }),
        queryClient.invalidateQueries({ queryKey: ['overview'] }),
        queryClient.invalidateQueries({ queryKey: ['sightings'] }),
        queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
        queryClient.invalidateQueries({ queryKey: ['mobile_apps_radar'] }),
      ]);
      router.push('/guide?reset=true');
    } catch (err: any) {
      alert(err?.message || 'Failed to reset brand profile. Please try again.');
    } finally {
      setIsResettingBrand(false);
    }
  };

  const sortedCampaigns = useMemo(() => [...campaigns].sort((a, b) => b.risk_score - a.risk_score), [campaigns]);
  const sortedSightings = useMemo(() => [...sightings].sort((a, b) => new Date(b.observed_at || b.created_at).getTime() - new Date(a.observed_at || a.created_at).getTime()), [sightings]);
  const highRiskCount = campaigns.filter((campaign) => campaign.risk_score >= 80).length;
  const surfaces = useMemo(() => {
    const counts = new Map<string, number>();
    sightings.forEach((sighting) => counts.set(sighting.surface, (counts.get(sighting.surface) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [sightings]);
  const overviewUnavailable = overviewError || (!loadingOverview && !overview);
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Brand risk overview</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#787774]">
            Review ingested findings, supporting evidence, and campaigns for your enrolled brands.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600"><span className={`h-2 w-2 rounded-full ${overviewUnavailable || campaignsError || sightingsError ? 'bg-amber-500' : 'bg-emerald-500'}`} />{overviewUnavailable || campaignsError || sightingsError ? 'Some workspace data unavailable' : overview?.environment ? `${overview.environment} environment` : 'Workspace data'}</span>
          <Link href="/landing" className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#e3e2e0] bg-white px-3 text-xs font-medium text-[#37352f] transition hover:bg-[#f7f6f3] shadow-2xs">Product tour <ExternalLink className="h-3 w-3 text-[#9b9a97]" /></Link>
          <button onClick={() => analysisMutation.mutate()} disabled={analysisMutation.isPending} className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#0f7b6c] px-3.5 text-xs font-medium text-white shadow-2xs transition hover:bg-[#0b5e52] disabled:cursor-wait disabled:opacity-70">
            {analysisMutation.isPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {analysisMutation.isPending ? 'Analyzing…' : 'Run analysis'}
          </button>
        </div>
      </header>

      {analysisProgress && <div role="status" className="flex items-center gap-2 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] px-4 py-2.5 text-xs font-medium text-[#37352f]"><Activity className={`h-4 w-4 shrink-0 text-[#0f7b6c] ${analysisMutation.isPending ? 'animate-pulse' : ''}`} />{analysisProgress}</div>}
      {(campaignsError || sightingsError || overviewError || brandsError) && (
        <QueryErrorState
          compact
          title="Some workspace data could not be loaded"
          message="Unavailable data is kept separate from empty results. Retry the affected dashboard queries."
          onRetry={() => { void Promise.all([refetchOverview(), refetchCampaigns(), refetchSightings(), refetchBrands()]); }}
        />
      )}

      {/* Enrolled brand context */}
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{currentBrandInfo.name || 'No brand enrolled'}</span>
              {currentBrandInfo.domain && <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700">{currentBrandInfo.domain}</span>}
              {currentBrandInfo.name && <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${currentBrandInfo.domainVerified ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${currentBrandInfo.domainVerified ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                {currentBrandInfo.domainVerified ? 'Domain verified' : currentBrandInfo.domain ? 'Verification pending' : 'No domain enrolled'}
              </span>}
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {currentBrandInfo.name ? 'Brand reference data is used to provide context for findings and analysis.' : 'Enroll a brand and its official assets to establish a reference for investigations.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={currentBrandInfo.name ? '/brands' : '/guide'}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>{currentBrandInfo.name ? 'Manage brand' : 'Set up a brand'}</span>
          </Link>
          {currentBrandInfo.name && (
            <button
              type="button"
              onClick={handleResetBrand}
              disabled={isResettingBrand}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-3 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:opacity-50"
              title="Clear this brand profile from the database and restart onboarding"
            >
              {isResettingBrand ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 text-rose-600" />
              )}
              <span>{isResettingBrand ? 'Resetting…' : 'Reset brand profile'}</span>
            </button>
          )}
        </div>
      </section>

      {/* LIVE OSINT THREAT SCANNER & PERIMETER RADAR HUD */}
      <div data-tour="threat-hud">
        <ThreatScanHUD
          brandId={brands[0]?.id}
          brandName={currentBrandInfo.name || 'No brand enrolled'}
          brandDomain={currentBrandInfo.domain || ''}
        />
      </div>

      {/* CATEGORIZED LIVE THREAT INTELLIGENCE & SCAM ACCOUNTS BOARD */}
      <CategorizedThreatsBoard
        sightings={sortedSightings}
        campaigns={campaigns}
        onThreatUpdated={() => {
          void refetchSightings();
          void refetchOverview();
        }}
      />

      {/* 3. KEY METRICS */}
      <section data-tour="stat-cards" aria-label="Overview metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        <div data-tour="priority-campaigns" className={`${panel} p-4 sm:p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#37352f]">Priority investigations</h2>
              <p className="mt-0.5 text-xs text-[#9b9a97]">Ranked by campaign risk score</p>
            </div>
            <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs font-medium text-[#0f7b6c] hover:underline">All campaigns <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
          {loadingCampaigns ? <div className="space-y-3 py-3"><div className="h-12 animate-pulse rounded-lg bg-slate-100" /><div className="h-12 animate-pulse rounded-lg bg-slate-100" /></div> : campaignsError ? <QueryErrorState compact title="Campaigns unavailable" message="Retry to load priority investigations." onRetry={() => { void refetchCampaigns(); }} /> : sortedCampaigns.length ? <div>{sortedCampaigns.slice(0, 4).map((campaign) => <InvestigationRow key={campaign.id} campaign={campaign} />)}</div> : <div className="flex min-h-32 flex-col items-center justify-center gap-2 border-t border-slate-200 text-center"><ShieldCheck className="h-5 w-5 text-teal-700" /><p className="text-xs font-semibold text-slate-900">No campaigns in this workspace</p><p className="text-xs text-slate-500">Run analysis after findings are available to look for related activity.</p></div>}
        </div>

        <div className={`${panel} p-4 sm:p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-sm font-bold text-[#37352f]">Surface coverage</h2><p className="mt-0.5 text-xs text-[#9b9a97]">Findings grouped by source surface</p></div>
            <Globe2 className="h-4 w-4 text-[#0f7b6c]" />
          </div>
          {sightingsError ? <div className="mt-4"><QueryErrorState compact title="Surface data unavailable" onRetry={() => { void refetchSightings(); }} /></div> : surfaces.length ? <div className="mt-4 space-y-3.5">{surfaces.slice(0, 5).map(([surface, count]) => {
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
          {loadingSightings ? <div className="space-y-3 py-3"><div className="h-10 animate-pulse rounded-lg bg-slate-100" /><div className="h-10 animate-pulse rounded-lg bg-slate-100" /></div> : sightingsError ? <QueryErrorState compact title="Recent findings unavailable" onRetry={() => { void refetchSightings(); }} /> : sortedSightings.length ? <div>{sortedSightings.slice(0, 5).map((sighting) => <FindingRow key={sighting.id} sighting={sighting} />)}</div> : <div className="flex min-h-24 flex-col items-center justify-center gap-1 border-t border-slate-200 text-center"><p className="text-xs font-semibold text-slate-900">No findings recorded yet</p><p className="text-xs text-slate-500">Findings appear here after an authorized source or analyst adds them.</p></div>}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e2e0] py-4 text-xs text-[#9b9a97]">
        <span className="inline-flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${overviewUnavailable || campaignsError || sightingsError ? 'bg-amber-500' : 'bg-emerald-500'}`} />{overviewUnavailable || campaignsError || sightingsError ? 'Some workspace data is unavailable' : `Workspace data${overview?.environment ? ` · ${overview.environment}` : ''}`}</span>
        <Link href="/brands" className="inline-flex items-center gap-1 font-medium text-[#787774] hover:text-[#37352f]">Manage monitored brands <ArrowRight className="h-3.5 w-3.5" /></Link>
      </footer>
    </div>
  );
}
