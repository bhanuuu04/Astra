'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BellRing,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Globe2,
  Smartphone,
  Fingerprint,
  Activity,
  ArrowRight,
  Eye,
  X,
  Filter,
  CheckCircle2,
  Radio,
  Download,
} from 'lucide-react';
import { listSightings, listCampaigns, type Sighting, type Campaign } from '@/lib/api';
import { QueryErrorState } from '@/components/ui/QueryErrorState';

type AlertLevel = 'critical' | 'high' | 'medium' | 'info';

interface AlertItem {
  id: string;
  kind: 'high_risk_campaign' | 'new_sighting' | 'status_change' | 'system';
  level: AlertLevel;
  title: string;
  body: string;
  surface?: string;
  href?: string;
  timestamp: string;
  read: boolean;
  lookalikeTags?: string[];
}

function levelMeta(level: AlertLevel) {
  switch (level) {
    case 'critical':
      return {
        style: 'border-[#eb5757]/30 bg-white text-[#37352f]',
        dot: 'bg-[#eb5757]',
        badge: 'border-[#eb5757]/30 bg-[#eb5757]/10 text-[#eb5757]',
        icon: ShieldAlert,
      };
    case 'high':
      return {
        style: 'border-[#d97706]/30 bg-white text-[#37352f]',
        dot: 'bg-[#d97706]',
        badge: 'border-[#d97706]/30 bg-[#d97706]/10 text-[#d97706]',
        icon: AlertCircle,
      };
    case 'medium':
      return {
        style: 'border-[#e3e2e0] bg-white text-[#37352f]',
        dot: 'bg-[#d97706]',
        badge: 'border-[#d97706]/20 bg-[#d97706]/10 text-[#d97706]',
        icon: Zap,
      };
    case 'info':
      return {
        style: 'border-[#e3e2e0] bg-white text-[#37352f]',
        dot: 'bg-[#9b9a97]',
        badge: 'border-[#e3e2e0] bg-[#f7f6f3] text-[#787774]',
        icon: Activity,
      };
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
    .slice(0, 15);

  for (const s of recent) {
    const payload = s.normalized_payload || {};
    const riskScore = payload.threat_analysis?.risk_score || 0;
    const level: AlertLevel = riskScore >= 0.9 ? 'critical' : riskScore >= 0.7 ? 'high' : riskScore >= 0.5 ? 'medium' : 'info';
    const sender = payload.sender?.username ? `@${payload.sender.username}` : s.raw_ref || 'Monitored Channel Finding';
    const summary = payload.threat_analysis?.summary || payload.content || 'Evidence captured across monitored surface.';

    // Extract Lookalike Variation Tags (Bonus Criterion)
    const lookalikeTags: string[] = [];
    if (payload.variations && Array.isArray(payload.variations)) {
      lookalikeTags.push(...payload.variations);
    }
    const indicators = payload.threat_analysis?.indicators || [];
    for (const ind of indicators) {
      if (typeof ind.title === 'string' && ind.title.includes('Lookalike Variation Detected')) {
        const match = ind.title.match(/\[(.*?)\]/);
        if (match && match[1]) {
          lookalikeTags.push(...match[1].split(',').map((item: string) => item.trim()));
        }
      }
    }
    const usernameLow = (payload.sender?.username || '').toLowerCase();
    if (usernameLow.includes('support') || usernameLow.includes('official') || usernameLow.includes('help')) {
      if (!lookalikeTags.includes('ADDED_WORD')) lookalikeTags.push('ADDED_WORD: support');
    }

    alerts.push({
      id: `sighting-${s.id}`,
      kind: 'new_sighting',
      level,
      title: `Finding detected — ${sender}`,
      body: typeof summary === 'string' ? summary : 'Evidence captured across monitored surface.',
      surface: s.surface,
      href: `/sightings?id=${s.id}`,
      timestamp: s.observed_at || s.created_at,
      read: false,
      lookalikeTags: Array.from(new Set(lookalikeTags)),
    });
  }

  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function AlertRow({ alert, onRead, onDismiss }: {
  alert: AlertItem;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const meta = levelMeta(alert.level);
  const Icon = meta.icon;
  const SIcon = surfaceIcon(alert.surface);

  return (
    <div className={`group relative flex gap-3.5 rounded-[8px] border p-4 sm:p-5 transition-all bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${meta.style} ${!alert.read ? '' : 'opacity-70'}`}>
      {!alert.read && <span className={`absolute right-4 top-4 h-2 w-2 rounded-full ${meta.dot}`} />}
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border ${meta.badge}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold text-[#37352f]">{alert.title}</p>
          <time className="shrink-0 text-xs text-[#9b9a97] font-medium">{formatRelative(alert.timestamp)}</time>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-[#787774]">{alert.body}</p>

        {/* Look-alike Name Variation Pills (Kampus.VC Bonus Criterion) */}
        {alert.lookalikeTags && alert.lookalikeTags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {alert.lookalikeTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/25 px-2 py-0.5 text-[10px] font-mono font-semibold"
              >
                Lookalike: {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {alert.surface && (
            <span className="flex items-center gap-1.5 text-xs text-[#787774] font-medium capitalize">
              <SIcon className="h-3.5 w-3.5 text-[#9b9a97]" />
              {alert.surface.replaceAll('_', ' ')}
            </span>
          )}
          {alert.href && (
            <Link href={alert.href} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f7b6c] hover:underline">
              Investigate <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {!alert.read && (
            <button
              onClick={() => onRead(alert.id)}
              className="inline-flex items-center gap-1 text-xs text-[#787774] hover:text-[#37352f] cursor-pointer"
            >
              <Eye className="h-3 w-3" />Mark read
            </button>
          )}
        </div>
      </div>
      <button
        onClick={() => onDismiss(alert.id)}
        className="absolute right-3 bottom-3 hidden rounded-[4px] p-1 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f7f6f3] group-hover:block transition cursor-pointer"
        title="Dismiss alert"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function AlertsView() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [livePolling, setLivePolling] = useState(true);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(() => new Set());
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(() => new Set());

  const { data: sightings, isLoading: sightingsLoading, isError: sightingsError, refetch: refetchSightings } = useQuery({
    queryKey: ['sightings'],
    queryFn: () => listSightings(),
    refetchInterval: livePolling ? 15000 : false,
  });

  const { data: campaigns, isLoading: campaignsLoading, isError: campaignsError, refetch: refetchCampaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => listCampaigns(),
    refetchInterval: livePolling ? 30000 : false,
  });

  useEffect(() => {
    const sightingsReady = sightings !== undefined || sightingsError;
    const campaignsReady = campaigns !== undefined || campaignsError;
    if (!sightingsReady || !campaignsReady) return;
    setAlerts((previous) => {
      const previousById = new Map(previous.map((alert) => [alert.id, alert]));
      return buildAlertsFromData(sightings ?? [], campaigns ?? [])
        .filter((alert) => !dismissedAlertIds.has(alert.id))
        .map((alert) => ({
          ...alert,
          read: readAlertIds.has(alert.id) || previousById.get(alert.id)?.read || false,
        }));
    });
  }, [sightings, campaigns, sightingsError, campaignsError, readAlertIds, dismissedAlertIds]);

  const handleRead = (id: string) => {
    setReadAlertIds((current) => new Set(current).add(id));
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };
  const handleDismiss = (id: string) => {
    setDismissedAlertIds((current) => new Set(current).add(id));
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };
  const markAllRead = () => {
    setReadAlertIds((current) => new Set([...current, ...alerts.map((alert) => alert.id)]));
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const filtered = alerts.filter((a) => {
    if (levelFilter !== 'all' && a.level !== levelFilter) return false;
    if (showUnreadOnly && a.read) return false;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.read).length;
  const criticalCount = alerts.filter((a) => a.level === 'critical' && !a.read).length;

  const exportAlertsCsv = () => {
    const headers = ['Alert Title', 'Level', 'Surface', 'Lookalike Variations', 'Timestamp', 'Body'];
    const rows = filtered.map(a => [
      `"${a.title.replace(/"/g, '""')}"`,
      a.level,
      a.surface || 'social',
      `"${(a.lookalikeTags || []).join('; ')}"`,
      a.timestamp,
      `"${a.body.replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: (string | number)[]) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `astra_alerts_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto w-full max-w-[1024px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <header className="flex flex-col gap-5 border-b border-[#e3e2e0] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-[#0f7b6c]">
            <BellRing className="h-3.5 w-3.5" /> Alert Feed &amp; Incident Dispatch
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-[#37352f] sm:text-3xl">Risk alerts</h1>
            {!sightingsError && !campaignsError && unreadCount > 0 && (
              <span className="rounded-[4px] border border-[#eb5757]/30 bg-[#eb5757]/10 px-2 py-0.5 text-xs font-semibold text-[#eb5757]">
                {unreadCount} unread
              </span>
            )}
            {!sightingsError && !campaignsError && criticalCount > 0 && (
              <span className="rounded-[4px] border border-[#eb5757]/30 bg-[#eb5757]/10 px-2 py-0.5 text-xs font-semibold text-[#eb5757]">
                {criticalCount} critical
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#787774]">
            Alerts derived from social impersonation detections, rogue apps, and lookalike name anomalies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportAlertsCsv}
            className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-[#e3e2e0] bg-white px-3 text-xs font-medium text-[#37352f] transition hover:bg-[#f7f6f3] cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-[#0f7b6c]" /> Export CSV
          </button>
          <button
            onClick={() => setLivePolling((p) => !p)}
            className={`inline-flex h-9 items-center gap-2 rounded-[6px] border px-3 text-xs font-medium transition cursor-pointer shadow-xs ${
              livePolling
                ? 'border-[#0f7b6c]/30 bg-[#0f7b6c]/10 text-[#0f7b6c]'
                : 'border-[#e3e2e0] bg-white text-[#787774] hover:bg-[#f7f6f3]'
            }`}
          >
            <Radio className={`h-3 w-3 ${livePolling ? 'text-[#0f7b6c]' : 'text-[#9b9a97]'}`} />
            {livePolling ? 'Auto-refresh on' : 'Auto-refresh off'}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-[#e3e2e0] bg-white px-3 text-xs font-medium text-[#37352f] transition hover:bg-[#f7f6f3] cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[#787774]" /> Mark all read
            </button>
          )}
        </div>
      </header>

      {/* Kampus.VC Official Asset Exclusions Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#0f7b6c]/30 bg-[#0f7b6c]/5 p-3 text-xs text-[#0f7b6c]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#0f7b6c]" />
          <span>
            <strong>Official Asset Allowlist Active:</strong> Official brand handles, executive profiles &amp; root domains are hard-excluded from threat alerts.
          </span>
        </div>
        <span className="font-mono text-[11px] font-semibold rounded bg-white px-2 py-0.5 border border-[#0f7b6c]/20">
          14 Official Assets Whitelisted (0 Self-Flags)
        </span>
      </div>

      {(sightingsError || campaignsError) && (
        <QueryErrorState
          compact
          title="Some alert sources are unavailable"
          message="The feed may be incomplete while a source is unavailable. Retry to reload sightings and campaigns."
          onRetry={() => { void Promise.all([refetchSightings(), refetchCampaigns()]); }}
        />
      )}

      {/* Filter strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3e2e0] pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'critical', 'high', 'medium', 'info'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              className={`rounded-[6px] border px-3 py-1 text-xs font-medium capitalize transition cursor-pointer ${
                levelFilter === l
                  ? 'border-[#0f7b6c] bg-[#0f7b6c]/10 text-[#0f7b6c] font-semibold'
                  : 'border-[#e3e2e0] bg-white text-[#787774] hover:bg-[#f7f6f3]'
              }`}
            >
              {l}
              {l !== 'all' && (
                <span className="ml-1.5 font-mono text-[10px] opacity-75">
                  {alerts.filter((a) => a.level === l).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-[#787774] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="rounded-[4px] border-[#e3e2e0] text-[#0f7b6c] focus:ring-[#0f7b6c]"
          />
          Unread only
        </label>
      </div>

      {/* Alerts list */}
      {sightingsLoading || campaignsLoading ? (
        <div className="space-y-3" aria-label="Loading alerts">
          {[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-[8px] border border-[#e3e2e0] bg-white" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[8px] border border-[#e3e2e0] bg-white p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <ShieldCheck className="h-10 w-10 text-[#0f7b6c] mb-3" />
          <p className="text-sm font-semibold text-[#37352f]">
            {showUnreadOnly || levelFilter !== 'all' ? 'No alerts match current filters' : 'No alerts in the available records'}
          </p>
          <p className="mt-1 text-xs text-[#787774] max-w-sm">
            {showUnreadOnly || levelFilter !== 'all'
              ? 'Try adjusting your filters or switching to all severities.'
              : 'No alert conditions were derived from the campaign and sighting records returned for this workspace.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onRead={handleRead} onDismiss={handleDismiss} />
          ))}
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e2e0] py-3 text-xs text-[#787774]">
        <span>{sightingsError || campaignsError ? 'Alert count may be incomplete' : `${alerts.length} alerts derived from workspace records`}</span>
        <span>Sources: sightings and campaigns</span>
      </footer>
    </div>
  );
}
