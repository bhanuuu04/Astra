'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Search,
  ExternalLink,
  Copy,
  Check,
  Crosshair,
  RefreshCw,
} from 'lucide-react';
import { listSightings, listMobileAppRadar, checkVirusTotal, type Sighting, type MobileAppFinding } from '@/lib/api';
import { DataModeBadge, type DataMode } from '@/components/ui/DataModeBadge';
import { QueryErrorState } from '@/components/ui/QueryErrorState';

const panel = 'rounded-[8px] border border-[#e3e2e0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
type AppStatus = 'needs_review' | 'active_threat' | 'takedown_submitted' | 'resolved' | 'monitoring';

interface AppEntry {
  id: string;
  appName: string;
  packageName: string;
  downloadUrl: string;
  sha256?: string;
  riskScore: number | null;
  status: AppStatus;
  sourcePlatform: string;
  discoveredAt: string;
  impersonationDetails: string;
  dataMode: DataMode;
  vtResult?: { positives?: number | null; total?: number | null; permalink?: string; status?: string } | null;
}

function riskMeta(score: number): { level: RiskLevel; label: string; style: string; bar: string } {
  if (score >= 90) return { level: 'critical', label: 'Critical', style: 'border-[#eb5757]/30 bg-[#eb5757]/10 text-[#eb5757] font-semibold', bar: 'bg-[#eb5757]' };
  if (score >= 70) return { level: 'high', label: 'High', style: 'border-[#d97706]/30 bg-[#d97706]/10 text-[#d97706] font-semibold', bar: 'bg-[#d97706]' };
  if (score >= 40) return { level: 'medium', label: 'Medium', style: 'border-[#d97706]/20 bg-[#d97706]/5 text-[#d97706] font-medium', bar: 'bg-[#d97706]' };
  return { level: 'low', label: 'Low', style: 'border-[#e3e2e0] bg-[#f7f6f3] text-[#787774] font-medium', bar: 'bg-[#9b9a97]' };
}

function statusMeta(status: AppEntry['status']) {
  switch (status) {
    case 'needs_review': return { label: 'Needs review', icon: Crosshair, style: 'text-amber-800 bg-amber-50 border-amber-200' };
    case 'active_threat': return { label: 'Active threat', icon: ShieldAlert, style: 'text-[#eb5757] bg-[#eb5757]/10 border-[#eb5757]/30' };
    case 'takedown_submitted': return { label: 'Takedown submitted', icon: ShieldX, style: 'text-[#d97706] bg-[#d97706]/10 border-[#d97706]/30' };
    case 'monitoring': return { label: 'Monitoring', icon: Crosshair, style: 'text-[#0f7b6c] bg-[#0f7b6c]/10 border-[#0f7b6c]/30' };
    case 'resolved': return { label: 'Resolved', icon: ShieldCheck, style: 'text-[#0f7b6c] bg-[#0f7b6c]/10 border-[#0f7b6c]/20' };
  }
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      title={`Copy ${label}`}
      className="ml-1 rounded p-0.5 text-slate-400 transition hover:text-slate-700 cursor-pointer"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function AppCard({ app, onVtCheck, isChecking, checkError }: {
  app: AppEntry;
  onVtCheck: (id: string, hash?: string, url?: string) => void;
  isChecking: boolean;
  checkError?: string | null;
}) {
  const risk = riskMeta(app.riskScore ?? 0);
  const status = statusMeta(app.status);
  const StatusIcon = status.icon;

  return (
    <article className={`${panel} overflow-hidden transition-shadow hover:shadow-md`}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${risk.style}`}>
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="truncate text-sm font-semibold text-slate-900">{app.appName}</h3>
              <DataModeBadge mode={app.dataMode} size="sm" />
              <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${status.style}`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500">{app.packageName}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${risk.style}`}>{app.riskScore === null ? 'Not scored' : `${risk.label} · ${app.riskScore}`}</span>
              <div className="mt-1.5 h-1 w-20 overflow-hidden rounded-full bg-slate-100">
                {app.riskScore !== null && <div className={`h-full rounded-full transition-all ${risk.bar}`} style={{ width: `${app.riskScore}%` }} />}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-600">{app.impersonationDetails}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
          <span>Observed: <strong>{formatDate(app.discoveredAt)}</strong></span>
          <span>Surface: <strong className="capitalize">{app.sourcePlatform.replaceAll('_', ' ')}</strong></span>
          {app.sha256 && (
            <span className="flex items-center font-mono text-[10px]">
              SHA256: {app.sha256.slice(0, 12)}…
              <CopyButton text={app.sha256} label="SHA-256" />
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite" className="min-w-0 text-xs">
            {checkError ? <span className="text-rose-700">{checkError}</span> : app.vtResult ? (
              <span className="text-slate-700">
                Reputation result: {app.vtResult.status || `${app.vtResult.positives ?? '—'} of ${app.vtResult.total ?? '—'} engines flagged`}
                {app.vtResult.permalink && <a className="ml-2 font-semibold text-teal-800 underline underline-offset-2" href={app.vtResult.permalink} target="_blank" rel="noopener noreferrer">View provider report</a>}
              </span>
            ) : <span className="text-slate-500">Provider reputation checks require a URL or file hash and a configured connector.</span>}
          </div>
          <button
            type="button"
            onClick={() => onVtCheck(app.id, app.sha256, app.downloadUrl)}
            disabled={isChecking || (!app.sha256 && !app.downloadUrl)}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isChecking ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
            {isChecking ? 'Checking…' : 'Check reputation'}
          </button>
        </div>
      </div>
    </article>
  );
}

function normalizedDataMode(value?: string | null): DataMode {
  return value === 'live' || value === 'synthetic_demo' || value === 'manual_upload' ? value : 'unknown';
}

function normalizedAppStatus(value?: string | null): AppEntry['status'] {
  if (value === 'confirmed_threat' || value === 'active_threat') return 'active_threat';
  if (value === 'takedown_submitted') return 'takedown_submitted';
  if (value === 'resolved' || value === 'false_positive') return 'resolved';
  if (value === 'monitoring' || value === 'investigating') return 'monitoring';
  return 'needs_review';
}

function parseSightingsToApps(sightings: Sighting[]): AppEntry[] {
  const appSightings = sightings.filter(
    (s) =>
      s.surface.toLowerCase().includes('apk') ||
      s.surface.toLowerCase().includes('app') ||
      (s.normalized_payload && (s.normalized_payload as any).rogue_app)
  );

  return appSightings.map((s, idx) => {
    const payload = s.normalized_payload || {};
    const rogueApp = (payload as any).rogue_app || {};
    return {
      id: s.id || `app-${idx}`,
      appName: rogueApp.app_name || rogueApp.name || s.raw_ref || 'Unknown Mobile App Package',
      packageName: rogueApp.package_name || rogueApp.bundle_id || 'Package ID unavailable',
      downloadUrl: rogueApp.download_url || s.raw_ref || '',
      sha256: rogueApp.sha256 || payload.sha256,
      riskScore: typeof payload.threat_analysis?.risk_score === 'number'
        ? Math.round(payload.threat_analysis.risk_score <= 1 ? payload.threat_analysis.risk_score * 100 : payload.threat_analysis.risk_score)
        : null,
      status: normalizedAppStatus(rogueApp.status || payload.threat_analysis?.triage_status),
      sourcePlatform: s.surface,
      discoveredAt: s.observed_at || s.created_at,
      impersonationDetails: rogueApp.impersonation_details || payload.threat_analysis?.summary || 'Evidence captured for analyst review.',
      dataMode: normalizedDataMode(payload.data_mode || (s.source_kind === 'fixture' ? 'synthetic_demo' : s.source_kind === 'manual_upload' ? 'manual_upload' : undefined)),
    };
  });
}

export function AppsRadarView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppEntry['status'] | 'all'>('all');
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [vtLoading, setVtLoading] = useState<string | null>(null);
  const [vtErrors, setVtErrors] = useState<Record<string, string>>({});

  const { data: radarData, isLoading: radarLoading, isError: radarError, refetch: refetchRadar } = useQuery({
    queryKey: ['mobile_apps_radar'],
    queryFn: () => listMobileAppRadar(),
  });

  const { data: sightings = [], isLoading: sightingsLoading, isError: sightingsError, refetch: refetchSightings } = useQuery({
    queryKey: ['sightings'],
    queryFn: () => listSightings(),
  });

  React.useEffect(() => {
    if (radarData && radarData.apps && radarData.apps.length > 0) {
      const liveRadarApps: AppEntry[] = radarData.apps.map((a: MobileAppFinding) => ({
        id: a.finding_id || a.id,
        appName: a.app_title,
        packageName: a.package_name,
        downloadUrl: a.store_url || '',
        sha256: a.apk_sha256 || undefined,
        riskScore: typeof (a.triage_priority ?? a.risk_score) === 'number'
          ? Math.round((a.triage_priority ?? a.risk_score) <= 1 ? (a.triage_priority ?? a.risk_score) * 100 : (a.triage_priority ?? a.risk_score))
          : null,
        status: normalizedAppStatus(a.triage_status),
        sourcePlatform: a.store_platform || a.store_source || 'google_play',
        discoveredAt: a.observed_at || a.created_at,
        impersonationDetails: a.official_cert_match === false
          ? 'Certificate signature mismatch: Unauthorized APK signature does NOT match verified brand certificate.'
          : (a.impersonation_evidence ? JSON.stringify(a.impersonation_evidence) : `Forensic status: ${a.malware_status || 'analyzed'}, permissions risk: ${a.permissions_risk || 'medium'}`),
        dataMode: normalizedDataMode(a.data_mode),
      }));
      setApps(liveRadarApps);
    } else if (sightings && sightings.length > 0) {
      const liveApps = parseSightingsToApps(sightings);
      if (liveApps.length > 0) {
        setApps(liveApps);
      }
    } else {
      setApps([]);
    }
  }, [radarData, sightings]);

  const handleVtCheck = async (id: string, hash?: string, url?: string) => {
    setVtLoading(id);
    setVtErrors((current) => ({ ...current, [id]: '' }));
    try {
      const result = await checkVirusTotal(url, hash);
      if (result) {
        setApps((prev) => prev.map((a) => (a.id === id ? { ...a, vtResult: result } : a)));
      }
    } catch (err) {
      setVtErrors((current) => ({ ...current, [id]: err instanceof Error ? err.message : 'Reputation lookup failed.' }));
    } finally {
      setVtLoading(null);
    }
  };

  const filtered = apps.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        app.appName.toLowerCase().includes(q) ||
        app.packageName.toLowerCase().includes(q) ||
        app.downloadUrl.toLowerCase().includes(q) ||
        app.impersonationDetails.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: apps.length,
    active_threat: apps.filter((a) => a.status === 'active_threat').length,
    takedown_submitted: apps.filter((a) => a.status === 'takedown_submitted').length,
    monitoring: apps.filter((a) => a.status === 'monitoring').length,
    resolved: apps.filter((a) => a.status === 'resolved').length,
  };

  const scoredApps = apps.filter((app) => app.riskScore !== null);
  const avgRisk = scoredApps.length ? Math.round(scoredApps.reduce((acc, app) => acc + (app.riskScore || 0), 0) / scoredApps.length) : null;
  const anySourceError = radarError || sightingsError;
  const bothSourcesFailed = radarError && sightingsError;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-5 border-b border-[#e3e2e0] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-[#0f7b6c]">
            <Smartphone className="h-3.5 w-3.5" /> Mobile App Radar
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#37352f] sm:text-3xl">Rogue Mobile App Radar</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#787774]">
            Review mobile-app findings captured by configured providers or recorded in your workspace. Store discovery is not continuous unless a supported source is configured.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['sightings'] });
              queryClient.invalidateQueries({ queryKey: ['mobile_apps_radar'] });
            }}
            className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-[#e3e2e0] bg-white px-3 text-xs font-medium text-[#37352f] shadow-xs transition hover:bg-[#f7f6f3] cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />Refresh
          </button>
        </div>
      </header>

      {anySourceError && (
        <QueryErrorState
          compact
          title={bothSourcesFailed ? 'Mobile-app data is unavailable' : 'Some mobile-app data is unavailable'}
          message="An unavailable source is not treated as an empty result. Retry the provider radar and sightings queries."
          onRetry={() => { void Promise.all([refetchRadar(), refetchSightings()]); }}
        />
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Confirmed threats', value: anySourceError ? '—' : counts.active_threat, style: 'text-[#eb5757]' },
          { label: 'Takedown pending', value: anySourceError ? '—' : counts.takedown_submitted, style: 'text-[#d97706]' },
          { label: 'Needs review', value: anySourceError ? '—' : apps.filter((app) => app.status === 'needs_review').length, style: 'text-amber-700' },
          { label: 'Mean triage score', value: anySourceError ? '—' : avgRisk ?? '—', style: (avgRisk ?? 0) >= 70 ? 'text-[#eb5757]' : 'text-slate-900' },
        ].map(({ label, value, style }) => (
          <div key={label} className={`${panel} p-4`}>
            <p className="text-xs font-medium text-[#787774]">{label}</p>
            <p className={`mt-1 font-mono text-2xl font-bold ${style}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9b9a97]" />
          <input
            type="search"
            placeholder="Search app name, package, URL…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] pl-9 pr-3 text-xs text-[#37352f] placeholder:text-[#9b9a97] focus:bg-white focus:border-[#0f7b6c] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'active_threat', 'takedown_submitted', 'monitoring', 'resolved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`h-8 rounded-[6px] border px-3 text-xs font-medium transition cursor-pointer ${
                statusFilter === s
                  ? 'border-[#0f7b6c] bg-[#0f7b6c]/10 text-[#0f7b6c] font-semibold'
                  : 'border-[#e3e2e0] bg-white text-[#787774] hover:bg-[#f7f6f3]'
              }`}
            >
              {s === 'all' ? 'All' : s === 'active_threat' ? 'Active' : s === 'takedown_submitted' ? 'Takedown' : s === 'monitoring' ? 'Monitoring' : 'Resolved'}
              <span className="ml-1.5 font-mono text-[10px] opacity-75">{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* App list */}
      {(radarLoading || sightingsLoading) ? (
        <div aria-label="Loading mobile app findings" className="space-y-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
        </div>
      ) : bothSourcesFailed ? null : filtered.length === 0 ? (
        <div className={`${panel} flex min-h-[220px] items-center justify-center p-8 text-center`}>
          <div>
            <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-teal-700" />
            <p className="text-sm font-semibold text-slate-900">No mobile-app findings in the available records</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
              Configure an authorized provider or add a finding to begin reviewing app-related evidence.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <AppCard
              key={app.id}
              app={vtLoading === app.id ? { ...app, vtResult: undefined } : app}
              onVtCheck={handleVtCheck}
              isChecking={vtLoading === app.id}
              checkError={vtErrors[app.id] || null}
            />
          ))}
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e2e0] py-3 text-xs text-[#787774]">
        <span>{apps.length} total mobile applications tracked</span>
        <span>Findings reflect the sources configured for this workspace.</span>
      </footer>
    </div>
  );
}
