'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  BellOff,
  BellRing,
  ShieldAlert,
  ShieldCheck,
  Globe2,
  Smartphone,
  Fingerprint,
  Activity,
  Clock,
  ArrowRight,
  CheckCheck,
  Filter,
  Wifi,
  WifiOff,
  X,
  AlertCircle,
  Zap,
  Eye,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';
import { listSightings, listCampaigns, type Sighting, type Campaign } from '@/lib/api';

const panel = 'rounded-xl border border-white/[0.075] bg-[#111a27]';

type AlertLevel = 'critical' | 'high' | 'medium' | 'info';
type AlertKind = 'new_sighting' | 'high_risk_campaign' | 'status_change' | 'system';

interface AlertItem {
  id: string;
  kind: AlertKind;
  level: AlertLevel;
  title: string;
  body: string;
  surface?: string;
  href?: string;
  timestamp: string;
  read: boolean;
}

function levelMeta(level: AlertLevel) {
  switch (level) {
    case 'critical': return { style: 'border-rose-500/30 bg-rose-500/8 text-rose-300', dot: 'bg-rose-400', icon: ShieldAlert };
    case 'high': return { style: 'border-orange-500/30 bg-orange-500/8 text-orange-300', dot: 'bg-orange-400', icon: AlertCircle };
    case 'medium': return { style: 'border-amber-500/30 bg-amber-500/8 text-amber-200', dot: 'bg-amber-400', icon: Zap };
    case 'info': return { style: 'border-slate-700 bg-slate-800/50 text-slate-300', dot: 'bg-slate-500', icon: Activity };
  }
}

function surfaceIcon(surface?: string) {
  if (!surface) return Activity;
  const s = surface.toLowerCase();
  if (s.includes('apk') || s.includes('app')) return Smartphone;
  if (s.includes('web') || s.includes('domain')) return Globe2;
  return Fingerprint;
}

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function buildAlertsFromData(sightings: Sighting[], campaigns: Campaign[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  // High-risk campaigns → alerts
  for (const c of campaigns) {
    if (c.risk_score >= 80) {
      alerts.push({
        id: `campaign-${c.id}`,
        kind: 'high_risk_campaign',
        level: c.risk_score >= 90 ? 'critical' : 'high',
        title: `High-risk campaign: ${c.title}`,
        body: `Risk score ${Math.round(c.risk_score)} — ${c.member_count} linked sightings detected.`,
        href: `/campaigns/${c.id}`,
        timestamp: c.last_seen_at || c.created_at,
        read: false,
      });
    }
  }

  // Recent sightings → alerts
  const recent = [...sightings]
    .sort((a, b) => new Date(b.observed_at || b.created_at).getTime() - new Date(a.observed_at || a.created_at).getTime())
    .slice(0, 10);

  for (const s of recent) {
    const payload = s.normalized_payload || {};
    const riskScore = payload.threat_analysis?.risk_score || 0;
    const level: AlertLevel = riskScore >= 0.9 ? 'critical' : riskScore >= 0.7 ? 'high' : riskScore >= 0.5 ? 'medium' : 'info';
    const sender = payload.sender?.username ? `@${payload.sender.username}` : s.raw_ref || 'Unknown source';
    const summary = payload.threat_analysis?.summary || 'New evidence captured for review';
    alerts.push({
      id: `sighting-${s.id}`,
      kind: 'new_sighting',
      level,
      title: `New finding — ${sender}`,
      body: typeof summary === 'string' ? summary : 'New evidence captured for review',
      surface: s.surface,
      href: `/sightings?id=${s.id}`,
      timestamp: s.observed_at || s.created_at,
      read: false,
    });
  }

  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Demo alerts when no live data
const DEMO_ALERTS: AlertItem[] = [
  {
    id: 'demo-1',
    kind: 'high_risk_campaign',
    level: 'critical',
    title: 'Critical campaign escalated: Social Impersonation Ring',
    body: 'Risk score 94 — 7 linked accounts detected across Instagram and Telegram, coordinating credential harvest.',
    href: '/campaigns',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    read: false,
  },
  {
    id: 'demo-2',
    kind: 'new_sighting',
    level: 'critical',
    title: 'New finding — @astra.supportt',
    body: 'Trojanized APK link distributed via Instagram DM. Mimics Astra Shield Mobile v4.2.1. 98/100 risk score.',
    surface: 'instagram_dm',
    href: '/sightings',
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    read: false,
  },
  {
    id: 'demo-3',
    kind: 'new_sighting',
    level: 'high',
    title: 'New finding — @astrà_support_desk',
    body: 'Homoglyph username on X/Twitter sending trademark infringement scam via URL shortener bit.ly. Urgency triggers detected.',
    surface: 'x_twitter',
    href: '/sightings',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
  },
  {
    id: 'demo-4',
    kind: 'new_sighting',
    level: 'high',
    title: 'New finding — AstraToken_Official_Airdrop',
    body: 'Crypto wallet harvester on Telegram. ETH address 0x71C9... linked to known scam cluster. Seed phrase extraction flow detected.',
    surface: 'telegram',
    href: '/sightings',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: true,
  },
  {
    id: 'demo-5',
    kind: 'status_change',
    level: 'medium',
    title: 'Takedown submitted: Astra Token Claim Companion',
    body: 'Takedown request submitted to astra-token-distribution.xyz registrar via UDRP channel. Awaiting registrar response.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    read: true,
  },
  {
    id: 'demo-6',
    kind: 'new_sighting',
    level: 'critical',
    title: 'VIP impersonation — Alex Mercer (CISO)',
    body: 'LinkedIn account "alex-mercer-astra9283" impersonating CISO. Requesting document access via social engineering.',
    surface: 'linkedin',
    href: '/sightings',
    timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    read: true,
  },
  {
    id: 'demo-7',
    kind: 'system',
    level: 'info',
    title: 'Meta webhook connected and verified',
    body: 'Instagram Business webhook for brand "Astra Security" is active. Events are being ingested in real-time.',
    timestamp: new Date(Date.now() - 1000 * 3600 * 6).toISOString(),
    read: true,
  },
];

function AlertRow({ alert, onRead, onDismiss }: {
  alert: AlertItem;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const meta = levelMeta(alert.level);
  const Icon = meta.icon;
  const SIcon = surfaceIcon(alert.surface);

  return (
    <div className={`group relative flex gap-3 rounded-xl border p-4 transition-all ${meta.style} ${!alert.read ? 'shadow-sm shadow-black/30' : 'opacity-70 hover:opacity-90'}`}>
      {!alert.read && <span className={`absolute right-3 top-3 h-2 w-2 rounded-full ${meta.dot} animate-pulse`} />}
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.style}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-100">{alert.title}</p>
          <time className="shrink-0 text-[11px] text-slate-500">{formatRelative(alert.timestamp)}</time>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{alert.body}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {alert.surface && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <SIcon className="h-3 w-3" />
              {alert.surface.replaceAll('_', ' ')}
            </span>
          )}
          {alert.href && (
            <Link href={alert.href} className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-cyan-200">
              Investigate <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {!alert.read && (
            <button
              onClick={() => onRead(alert.id)}
              className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300"
            >
              <Eye className="h-3 w-3" />Mark read
            </button>
          )}
        </div>
      </div>
      <button
        onClick={() => onDismiss(alert.id)}
        className="absolute right-3 bottom-3 hidden rounded p-0.5 text-slate-600 hover:text-slate-300 group-hover:block"
        title="Dismiss alert"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function AlertsView() {
  const [alerts, setAlerts] = useState<AlertItem[]>(DEMO_ALERTS);
  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [livePolling, setLivePolling] = useState(true);
  const prevSightingIds = useRef<Set<string>>(new Set());

  const { data: sightings = [] } = useQuery({
    queryKey: ['sightings'],
    queryFn: () => listSightings(),
    refetchInterval: livePolling ? 15000 : false,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => listCampaigns(),
    refetchInterval: livePolling ? 30000 : false,
  });

  // Merge live alerts when new sightings arrive
  useEffect(() => {
    if (!sightings.length && !campaigns.length) return;
    const liveAlerts = buildAlertsFromData(sightings, campaigns);
    if (liveAlerts.length > 0) {
      // Only replace demo data once real data arrives
      setAlerts((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const merged = [
          ...liveAlerts.filter((a) => !existingIds.has(a.id)),
          ...prev.filter((a) => !a.id.startsWith('demo-')),
        ];
        return merged.length > 0 ? merged : prev;
      });
    }
  }, [sightings, campaigns]);

  const handleRead = (id: string) => setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  const handleDismiss = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));
  const markAllRead = () => setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));

  const filtered = alerts.filter((a) => {
    if (levelFilter !== 'all' && a.level !== levelFilter) return false;
    if (showUnreadOnly && a.read) return false;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.read).length;
  const criticalCount = alerts.filter((a) => a.level === 'critical' && !a.read).length;

  return (
    <div className="mx-auto w-full max-w-[1024px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
            <BellRing className="h-3.5 w-3.5" /> Alert feed
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">Real-time alerts</h1>
            {unreadCount > 0 && (
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Live feed of brand threats, new sightings, and campaign escalations. Auto-refreshes every 15 seconds.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
            >
              <CheckCheck className="h-3.5 w-3.5" />Mark all read
            </button>
          )}
          <button
            onClick={() => setLivePolling((v) => !v)}
            className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition ${
              livePolling
                ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {livePolling ? <Wifi className="h-3.5 w-3.5 animate-pulse" /> : <WifiOff className="h-3.5 w-3.5" />}
            {livePolling ? 'Live' : 'Paused'}
          </button>
        </div>
      </header>

      {/* Critical banner */}
      {criticalCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/[0.07] px-4 py-3">
          <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
          <p className="text-sm text-rose-200">
            <strong>{criticalCount} critical {criticalCount === 1 ? 'alert' : 'alerts'}</strong> require immediate analyst review.
          </p>
          <button onClick={() => setLevelFilter('critical')} className="ml-auto text-xs text-rose-300 hover:text-rose-100">
            View critical →
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'critical', 'high', 'medium', 'info'] as const).map((l) => {
            const count = l === 'all' ? alerts.length : alerts.filter((a) => a.level === l).length;
            return (
              <button
                key={l}
                onClick={() => setLevelFilter(l)}
                className={`h-8 rounded-md border px-3 text-xs font-medium capitalize transition ${
                  levelFilter === l
                    ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                    : 'border-white/[0.07] text-slate-500 hover:border-white/15 hover:text-slate-300'
                }`}
              >
                {l}
                <span className="ml-1.5 font-mono text-[10px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="rounded accent-cyan-400"
          />
          Unread only
        </label>
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div className={`${panel} flex min-h-[200px] items-center justify-center`}>
          <div className="text-center">
            <BellOff className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm font-medium text-slate-400">No alerts match your filters</p>
            <p className="mt-1 text-xs text-slate-600">Try changing the level filter or showing all alerts.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onRead={handleRead} onDismiss={handleDismiss} />
          ))}
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 py-2 text-xs text-slate-600">
        <span className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${livePolling ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          {livePolling ? 'Auto-refreshing every 15 seconds' : 'Live refresh paused'}
        </span>
        <span>{alerts.length} total alerts</span>
      </footer>
    </div>
  );
}
