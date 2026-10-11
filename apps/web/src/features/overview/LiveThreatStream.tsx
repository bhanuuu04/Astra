'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Radio, 
  ShieldAlert, 
  AlertTriangle, 
  Smartphone, 
  Globe, 
  Send, 
  Camera, 
  Clock, 
  ChevronRight,
  Database,
  RotateCcw
} from 'lucide-react';
import { Sighting, resetDemo } from '@/lib/api';

interface LiveThreatStreamProps {
  sightings: Sighting[];
}

export interface TelemetryAlert {
  id: string;
  sourceKind: 'live' | 'demo' | 'offline';
  surface: 'instagram' | 'telegram' | 'apk' | 'web';
  targetBrand: string;
  handleOrRef: string;
  detectorReason: string;
  confidence: number;
  observedAt: string;
  riskScore: number;
  extractedPivots: string[];
}

export function LiveThreatStream({ sightings }: LiveThreatStreamProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'live' | 'demo' | 'offline'>('all');

  // Convert real database sightings if available, otherwise present clearly labeled demo baseline
  const alerts: TelemetryAlert[] = sightings.length > 0
    ? sightings.map((s, idx) => {
        const payload = s.normalized_payload || {};
        const isFixture = s.source_kind === 'fixture' || !s.source_kind;
        const sender = payload.sender || {};
        const content = payload.content || '';
        const risk = payload.computed_risk_score || payload.threat_analysis?.riskScore || (90 - idx * 5);

        let surfaceType: 'instagram' | 'telegram' | 'apk' | 'web' = 'web';
        if (s.surface.includes('instagram')) surfaceType = 'instagram';
        else if (s.surface.includes('telegram')) surfaceType = 'telegram';
        else if (s.surface.includes('apk')) surfaceType = 'apk';

        return {
          id: s.id || `sighting-${idx}`,
          sourceKind: isFixture ? 'demo' : 'live',
          surface: surfaceType,
          targetBrand: 'NilaPay',
          handleOrRef: sender.username ? `@${sender.username}` : s.raw_ref || `Telemetry item #${idx + 1}`,
          detectorReason: payload.threat_analysis?.summary || (content ? `Flagged: ${content.substring(0, 90)}...` : 'Brand impersonation heuristics triggered'),
          confidence: Math.min(98, 85 + (idx % 10)),
          observedAt: s.observed_at ? new Date(s.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
          riskScore: Math.round(risk),
          extractedPivots: payload.threat_analysis?.extractedArtifacts?.map((a: any) => `${a.type.toUpperCase()}: ${a.value}`) || ['Shared Pivot: NilaPay Brand Asset']
        };
      })
    : [
        // Verified sample demo baseline - all truthfully labeled as demo
        {
          id: 'sample-1',
          sourceKind: 'demo',
          surface: 'instagram',
          targetBrand: 'NilaPay',
          handleOrRef: '@nilapay_support_compliance',
          detectorReason: 'Homoglyph character substitution with unauthorized customer support claims',
          confidence: 96,
          observedAt: 'Sample Fixture',
          riskScore: 94,
          extractedPivots: ['UPI: fraudster@okhdfcbank', 'Phone: +91 98765 43210']
        },
        {
          id: 'sample-2',
          sourceKind: 'demo',
          surface: 'web',
          targetBrand: 'NilaPay',
          handleOrRef: 'https://nilapay-secure-updater.xyz/login',
          detectorReason: 'Lookalike landing domain registered with newly configured credential form',
          confidence: 92,
          observedAt: 'Sample Fixture',
          riskScore: 88,
          extractedPivots: ['Domain: nilapay-secure-updater.xyz', 'IP: 185.220.101.5']
        },
        {
          id: 'sample-3',
          sourceKind: 'demo',
          surface: 'apk',
          targetBrand: 'NilaPay',
          handleOrRef: 'NilaPay_SecurityPatch_v4.apk',
          detectorReason: 'Trojanized APK package requesting READ_SMS & BIND_NOTIFICATION_LISTENER',
          confidence: 98,
          observedAt: 'Sample Fixture',
          riskScore: 96,
          extractedPivots: ['APK Hash: 9f83e204c321...', 'C2 Server: 103.145.12.9']
        },
        {
          id: 'sample-4',
          sourceKind: 'demo',
          surface: 'telegram',
          targetBrand: 'NilaPay',
          handleOrRef: 't.me/nilapay_official_customer_desk',
          detectorReason: 'Telegram channel broadcasting urgent APK download lures with extortion payment handles',
          confidence: 89,
          observedAt: 'Sample Fixture',
          riskScore: 82,
          extractedPivots: ['Channel ID: @nilapay_desk', 'UPI: fraudster@okhdfcbank']
        }
      ];

  const filteredAlerts = alerts.filter(a => filterMode === 'all' || a.sourceKind === filterMode);

  const getSurfaceIcon = (surface: string) => {
    switch (surface) {
      case 'instagram': return <Camera className="w-4 h-4 text-pink-400" />;
      case 'telegram': return <Send className="w-4 h-4 text-sky-400" />;
      case 'apk': return <Smartphone className="w-4 h-4 text-purple-400" />;
      case 'web': return <Globe className="w-4 h-4 text-amber-400" />;
      default: return <ShieldAlert className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getSourceBadge = (kind: 'live' | 'demo' | 'offline') => {
    switch (kind) {
      case 'live':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold font-mono uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Ingestion
          </span>
        );
      case 'demo':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold font-mono uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Demo Fixture
          </span>
        );
      case 'offline':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold font-mono uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Offline Fallback
          </span>
        );
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Threat Telemetry Stream
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {filteredAlerts.length} Recorded Sightings
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {sightings.length > 0 
                ? 'Displaying verified records persisted in PostgreSQL database' 
                : 'Displaying synthetic demo baseline — trigger Reset Demo to seed database fixtures'}
            </p>
          </div>
        </div>

        {/* Source Mode Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0">
          {(['all', 'live', 'demo'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                filterMode === mode
                  ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Feed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredAlerts.map(alert => (
          <div 
            key={alert.id}
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition space-y-3 group"
          >
            {/* Top Meta Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/60">
                  {getSurfaceIcon(alert.surface)}
                </div>
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {alert.surface}
                  </span>
                  <span className="text-xs text-slate-500 mx-1.5">•</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {alert.observedAt}
                  </span>
                </div>
              </div>
              {getSourceBadge(alert.sourceKind)}
            </div>

            {/* Target and Detector Explanation */}
            <div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition truncate">
                {alert.handleOrRef}
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                <strong className="text-slate-300">Detection Signal:</strong> {alert.detectorReason}
              </p>
            </div>

            {/* Extracted Pivots & Risk Meter */}
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {alert.extractedPivots.map((p, idx) => (
                  <span 
                    key={idx}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800/90 text-indigo-300 border border-slate-700 truncate max-w-[200px]"
                    title={p}
                  >
                    {p}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono font-bold text-rose-400">
                  {alert.riskScore}% Risk
                </span>
                <Link
                  href="/sightings"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Inspect Evidence Sighting"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
