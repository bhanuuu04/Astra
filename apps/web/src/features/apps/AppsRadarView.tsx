'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Search,
  Plus,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Hash,
  Globe,
  FileDigit,
  Crosshair,
  Zap,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { listSightings, checkVirusTotal, type Sighting } from '@/lib/api';

const panel = 'rounded-xl border border-white/[0.075] bg-[#111a27]';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface AppEntry {
  id: string;
  appName: string;
  packageName: string;
  downloadUrl: string;
  sha256?: string;
  riskScore: number;
  status: 'active_threat' | 'takedown_submitted' | 'resolved' | 'monitoring';
  sourcePlatform: string;
  discoveredAt: string;
  impersonationDetails: string;
  vtResult?: { positives?: number; total?: number; permalink?: string } | null;
}

function riskMeta(score: number): { level: RiskLevel; label: string; style: string; bar: string } {
  if (score >= 90) return { level: 'critical', label: 'Critical', style: 'border-rose-500/40 bg-rose-500/10 text-rose-300', bar: 'bg-rose-500' };
  if (score >= 70) return { level: 'high', label: 'High', style: 'border-orange-500/40 bg-orange-500/10 text-orange-300', bar: 'bg-orange-400' };
  if (score >= 40) return { level: 'medium', label: 'Medium', style: 'border-amber-500/40 bg-amber-500/10 text-amber-200', bar: 'bg-amber-400' };
  return { level: 'low', label: 'Low', style: 'border-slate-600 bg-slate-800 text-slate-300', bar: 'bg-slate-500' };
}

function statusMeta(status: AppEntry['status']) {
  switch (status) {
    case 'active_threat': return { label: 'Active threat', icon: ShieldAlert, style: 'text-rose-300 bg-rose-500/10 border-rose-500/30' };
    case 'takedown_submitted': return { label: 'Takedown submitted', icon: ShieldX, style: 'text-amber-200 bg-amber-500/10 border-amber-500/30' };
    case 'monitoring': return { label: 'Monitoring', icon: Crosshair, style: 'text-cyan-200 bg-cyan-500/10 border-cyan-500/30' };
    case 'resolved': return { label: 'Resolved', icon: ShieldCheck, style: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' };
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
      className="ml-1 rounded p-0.5 text-slate-500 transition hover:text-cyan-300"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function AppCard({ app, onStatusChange, onVtCheck }: {
  app: AppEntry;
  onStatusChange: (id: string, status: AppEntry['status']) => void;
  onVtCheck: (id: string, hash?: string, url?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const risk = riskMeta(app.riskScore);
  const status = statusMeta(app.status);
  const StatusIcon = status.icon;

  return (
    <article className={`${panel} overflow-hidden transition-shadow hover:shadow-lg hover:shadow-black/30`}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${risk.style}`}>
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-100">{app.appName}</h3>
              <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${status.style}`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500">{app.packageName}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${risk.style}`}>{risk.label} · {app.riskScore}</span>
              <div className="mt-1.5 h-1 w-20 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full rounded-full transition-all ${risk.bar}`} style={{ width: `${app.riskScore}%` }} />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-400">{app.impersonationDetails}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{app.sourcePlatform.replaceAll('_', ' ')}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Detected {formatDate(app.discoveredAt)}</span>
          {app.vtResult?.positives !== undefined && (
            <span className={`flex items-center gap-1 font-medium ${app.vtResult.positives > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
              <Zap className="h-3 w-3" />
              VT: {app.vtResult.positives}/{app.vtResult.total} engines flagged
            </span>
          )}
        </div>
      </div>

      {/* Expandable detail */}
      <div className="border-t border-white/[0.06]">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between px-5 py-2.5 text-xs text-slate-500 transition hover:text-slate-300"
        >
          <span>Evidence & indicators</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {expanded && (
          <div className="border-t border-white/[0.06] bg-[#0d1521] px-5 py-4 space-y-3">
            {app.downloadUrl && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">Download URL</p>
                <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-[#111a27] px-3 py-2 font-mono text-[11px] text-rose-300 break-all">
                  <span className="flex-1">{app.downloadUrl}</span>
                  <CopyButton text={app.downloadUrl} label="URL" />
                  <a href={app.downloadUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-slate-500 hover:text-cyan-300"><ExternalLink className="h-3 w-3" /></a>
                </div>
              </div>
            )}
            {app.sha256 && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">SHA-256</p>
                <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-[#111a27] px-3 py-2 font-mono text-[11px] text-slate-400 break-all">
                  <FileDigit className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                  <span className="flex-1">{app.sha256}</span>
                  <CopyButton text={app.sha256} label="hash" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] bg-[#0d1521] px-4 py-3">
        <button
          onClick={() => onVtCheck(app.id, app.sha256, app.downloadUrl)}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 text-[11px] text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-200"
        >
          <Zap className="h-3 w-3" />Scan VirusTotal
        </button>
        {app.status === 'active_threat' && (
          <button
            onClick={() => onStatusChange(app.id, 'takedown_submitted')}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-400/10 px-2.5 text-[11px] text-amber-200 transition hover:bg-amber-400/20"
          >
            <ShieldX className="h-3 w-3" />Submit takedown
          </button>
        )}
        {app.status === 'takedown_submitted' && (
          <button
            onClick={() => onStatusChange(app.id, 'resolved')}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2.5 text-[11px] text-emerald-200 transition hover:bg-emerald-400/20"
          >
            <ShieldCheck className="h-3 w-3" />Mark resolved
          </button>
        )}
        {app.status !== 'resolved' && app.status !== 'monitoring' && (
          <button
            onClick={() => onStatusChange(app.id, 'monitoring')}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 text-[11px] text-slate-400 transition hover:text-slate-200"
          >
            <Crosshair className="h-3 w-3" />Monitor
          </button>
        )}
      </div>
    </article>
  );
}

// Derive rogue apps from sightings that mention APK/mobile app threats
function parseSightingsToApps(sightings: Sighting[]): AppEntry[] {
  const appSightings = sightings.filter((s) => {
    const surface = s.surface.toLowerCase();
    const content = JSON.stringify(s.normalized_payload || '').toLowerCase();
    return surface.includes('apk') || surface.includes('app') || content.includes('.apk') || content.includes('mobile_app') || content.includes('rogue_app');
  });

  return appSightings.map((s) => {
    const payload = s.normalized_payload || {};
    const rogueApp = payload.rogue_app || {};
    return {
      id: s.id,
      appName: rogueApp.app_name || payload.title || `Suspected app — ${s.surface}`,
      packageName: rogueApp.package_name || 'com.unknown.suspected',
      downloadUrl: rogueApp.download_url || payload.download_url || '',
      sha256: rogueApp.sha256 || payload.sha256,
      riskScore: Math.round((payload.threat_analysis?.risk_score || 75) * 100),
      status: (rogueApp.status as AppEntry['status']) || 'active_threat',
      sourcePlatform: s.surface,
      discoveredAt: s.observed_at || s.created_at,
      impersonationDetails: rogueApp.impersonation_details || payload.threat_analysis?.summary || 'Suspected mobile app impersonating brand assets.',
    };
  });
}

// Static demo entries shown when no live data
const DEMO_APPS: AppEntry[] = [
  {
    id: 'demo-app-01',
    appName: 'Astra Mobile Security Patch v4.2.1',
    packageName: 'com.astra.security.patch.updater',
    sourcePlatform: 'instagram_dm',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    downloadUrl: 'https://astra-mobile-update.top/downloads/AstraSecurity_Patch_v4.2.1.apk',
    sha256: '9f83e204c3210b4105aef89d1b702ec45819024f2b1c8a147e83492750e26d83',
    riskScore: 98,
    status: 'active_threat',
    impersonationDetails: 'Trojanized Android APK mimicking official Astra Shield Mobile. Employs SMS intercept & overlay credential theft permissions. Distributed via compromised Instagram DMs.',
  },
  {
    id: 'demo-app-02',
    appName: 'Astra Token Claim Companion',
    packageName: 'org.astra.foundation.airdrop',
    sourcePlatform: 'telegram_dm',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    downloadUrl: 'https://astra-token-distribution.xyz/mobile/claim-app.apk',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    riskScore: 94,
    status: 'takedown_submitted',
    impersonationDetails: 'Fraudulent crypto wallet harvester masquerading as official Web3 utility app. Harvests seed phrases via fake "verify wallet" flow.',
  },
  {
    id: 'demo-app-03',
    appName: 'Astra Authenticator Pro (Modded)',
    packageName: 'com.astra.authenticator.cloned',
    sourcePlatform: 'third_party_apk_store',
    discoveredAt: new Date(Date.now() - 1000 * 3600 * 48).toISOString(),
    downloadUrl: 'https://apk-fast-mirror.cam/store/astra-auth-cloned.apk',
    sha256: '3a7bd3e2360a3d29eea436fcfb7e44c735d117fcb0d099354830471981e28a5f',
    riskScore: 89,
    status: 'active_threat',
    impersonationDetails: 'Modified clone of official Astra 2FA app extracting private TOTP seeds to malicious C2 server at 185.220.101.x.',
  },
  {
    id: 'demo-app-04',
    appName: 'AstraVPN Lite (Fake)',
    packageName: 'com.astravpn.free.unofficial',
    sourcePlatform: 'third_party_apk_store',
    discoveredAt: new Date(Date.now() - 1000 * 3600 * 72).toISOString(),
    downloadUrl: 'https://free-vpn-download.xyz/astravpn-lite.apk',
    sha256: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
    riskScore: 71,
    status: 'monitoring',
    impersonationDetails: 'Fake VPN app using Astra branding. Routes all user traffic through attacker-controlled proxy for MITM interception.',
  },
];

export function AppsRadarView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppEntry['status'] | 'all'>('all');
  const [apps, setApps] = useState<AppEntry[]>(DEMO_APPS);
  const [vtLoading, setVtLoading] = useState<string | null>(null);

  // Try to load live app sightings
  const { data: sightings = [] } = useQuery({
    queryKey: ['sightings'],
    queryFn: () => listSightings(),
    onSuccess: (data: Sighting[]) => {
      const liveApps = parseSightingsToApps(data);
      if (liveApps.length > 0) {
        setApps(liveApps);
      }
    },
  } as any);

  const handleStatusChange = (id: string, status: AppEntry['status']) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const handleVtCheck = async (id: string, hash?: string, url?: string) => {
    setVtLoading(id);
    try {
      const result = await checkVirusTotal(url, hash);
      if (result) {
        setApps((prev) => prev.map((a) => (a.id === id ? { ...a, vtResult: result } : a)));
      }
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

  const avgRisk = apps.length ? Math.round(apps.reduce((s, a) => s + a.riskScore, 0) / apps.length) : 0;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
            <Smartphone className="h-3.5 w-3.5" /> Mobile App Radar
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">Rogue app tracker</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Track fake, cloned, and trojanized apps impersonating your brand across app stores, APK mirrors, and social channels.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['sightings'] })}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />Refresh
          </button>
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Active threats', value: counts.active_threat, style: 'text-rose-300' },
          { label: 'Takedown pending', value: counts.takedown_submitted, style: 'text-amber-200' },
          { label: 'Monitoring', value: counts.monitoring, style: 'text-cyan-300' },
          { label: 'Avg risk score', value: avgRisk, style: avgRisk >= 70 ? 'text-rose-300' : 'text-slate-300' },
        ].map(({ label, value, style }) => (
          <div key={label} className={`${panel} p-4`}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`mt-1 font-mono text-2xl font-semibold ${style}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            placeholder="Search app name, package, URL…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.025] pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'active_threat', 'takedown_submitted', 'monitoring', 'resolved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`h-8 rounded-md border px-3 text-xs font-medium transition ${
                statusFilter === s
                  ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                  : 'border-white/[0.07] text-slate-500 hover:border-white/15 hover:text-slate-300'
              }`}
            >
              {s === 'all' ? 'All' : s === 'active_threat' ? 'Active' : s === 'takedown_submitted' ? 'Takedown' : s === 'monitoring' ? 'Monitoring' : 'Resolved'}
              <span className="ml-1.5 font-mono text-[10px] opacity-60">{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* App list */}
      {filtered.length === 0 ? (
        <div className={`${panel} flex min-h-[200px] items-center justify-center`}>
          <div className="text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-emerald-400" />
            <p className="mt-3 text-sm font-medium text-slate-300">No apps match your filters</p>
            <p className="mt-1 text-xs text-slate-500">Adjust filters or clear the search to see all tracked apps.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <AppCard
              key={app.id}
              app={vtLoading === app.id ? { ...app, vtResult: undefined } : app}
              onStatusChange={handleStatusChange}
              onVtCheck={handleVtCheck}
            />
          ))}
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 py-2 text-xs text-slate-600">
        <span>{apps.length} total apps tracked · Demo workspace data</span>
        <span>Sources: Social DMs, third-party APK stores, analyst reports</span>
      </footer>
    </div>
  );
}
