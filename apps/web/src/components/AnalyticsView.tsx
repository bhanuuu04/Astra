'use client';

import React from 'react';
import { SocialMessage, RogueAppListing, ConnectorCredential } from '@/types/threat';
import { 
  BarChart3, 
  ShieldAlert, 
  Smartphone, 
  UserX, 
  Activity, 
  TrendingUp,
  Zap,
  Globe
} from 'lucide-react';

interface AnalyticsViewProps {
  messages: SocialMessage[];
  rogueApps: RogueAppListing[];
  connectors: ConnectorCredential[];
}

export function AnalyticsView({
  messages,
  rogueApps,
  connectors
}: AnalyticsViewProps) {
  const criticalThreats = messages.filter(m => m.analysis.severity === 'critical');
  const impersonators = messages.filter(m => m.analysis.impersonationScore >= 50);
  const phishingLinks = messages.filter(m => m.analysis.maliciousPayloadDetected);
  const rogueAppDms = messages.filter(m => m.analysis.fakeMobileAppDetected);

  const totalIngested = connectors.reduce((acc, c) => acc + c.metrics.messagesIngested, 0) + messages.length;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-700 uppercase tracking-wider font-bold">
          <BarChart3 className="w-4 h-4" />
          Threat Intelligence & SOC Analytics
        </div>
        <h1 className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
          Brand Exposure & Social Attack Surface Telemetry
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Aggregated risk indicators across all connected social channels, rogue APK distributions, and executive impersonation vectors.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 uppercase font-semibold">Total Messages Scanned</span>
            <Activity className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalIngested.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-mono font-bold">
            <TrendingUp className="w-3 h-3" />
            +14% inbound volume
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-red-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-red-700 uppercase font-semibold">Critical Threats</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-700 font-mono">
            {criticalThreats.length}
          </div>
          <div className="text-[11px] text-red-600 font-mono font-medium">
            Immediate Takedown Required
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-amber-800 uppercase font-semibold">Impersonators Blocked</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800 font-mono">
            {impersonators.length}
          </div>
          <div className="text-[11px] text-amber-700 font-mono font-medium">
            Homoglyph & Profile Clones
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-purple-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-purple-700 uppercase font-semibold">Rogue Mobile APKs</span>
            <Smartphone className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">
            {rogueApps.length}
          </div>
          <div className="text-[11px] text-purple-600 font-mono font-medium">
            Monitored APK Signatures
          </div>
        </div>
      </div>

      {/* Vector Distribution and Platform Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Categories Matrix */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-600" />
            Detected Attack Vectors
          </h3>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-700 mb-1.5 font-medium">
                <span>Brand Name & Homoglyph Impersonation</span>
                <span className="text-amber-800 font-bold">{impersonators.length} incidents</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (impersonators.length / (messages.length || 1)) * 100)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1.5 font-medium">
                <span>Counterfeit Mobile App APK Downloads</span>
                <span className="text-red-700 font-bold">{rogueAppDms.length} incidents</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-red-600 h-full rounded-full" style={{ width: `${Math.min(100, (rogueAppDms.length / (messages.length || 1)) * 100)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1.5 font-medium">
                <span>Phishing URLs & Masked Shorteners</span>
                <span className="text-purple-700 font-bold">{phishingLinks.length} incidents</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min(100, (phishingLinks.length / (messages.length || 1)) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-600" />
            Social Channel Risk Surface
          </h3>

          <div className="space-y-3 font-mono text-xs">
            {connectors.map((c) => (
              <div key={c.platform} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-bold uppercase">{c.platform.replace('_', ' ')}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                    c.status === 'connected' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-red-700 font-bold">{c.metrics.threatsDetected}</span>
                  <span className="text-slate-500 text-[11px]"> threats flagged</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
