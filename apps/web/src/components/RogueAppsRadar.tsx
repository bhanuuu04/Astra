'use client';

import React, { useState } from 'react';
import { RogueAppListing, BrandAssetRegistry } from '@/types/threat';
import { 
  Smartphone, 
  ShieldAlert, 
  ExternalLink, 
  CheckCircle2, 
  Search, 
  Plus, 
  Copy, 
  Check 
} from 'lucide-react';

interface RogueAppsRadarProps {
  rogueApps: RogueAppListing[];
  brand: BrandAssetRegistry;
  onUpdateAppStatus: (id: string, status: RogueAppListing['status']) => void;
  onAddRogueApp: (app: Partial<RogueAppListing>) => void;
}

export function RogueAppsRadar({
  rogueApps,
  brand,
  onUpdateAppStatus,
  onAddRogueApp
}: RogueAppsRadarProps) {
  const [search, setSearch] = useState('');
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newPackage, setNewPackage] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const filteredApps = rogueApps.filter((app) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      app.appName.toLowerCase().includes(q) ||
      app.packageName.toLowerCase().includes(q) ||
      app.downloadUrl.toLowerCase().includes(q) ||
      app.impersonationDetails.toLowerCase().includes(q)
    );
  });

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSha(id);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const handleCreateRogueApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim() || !newPackage.trim()) return;

    onAddRogueApp({
      appName: newAppName,
      packageName: newPackage,
      downloadUrl: newUrl || 'https://malicious-apk-mirror.top/download.apk',
      impersonationDetails: newNotes || 'Manual threat feed submission',
      riskScore: 92,
      status: 'active_threat',
      sourcePlatform: 'third_party_apk',
      discoveredAt: new Date().toISOString()
    });

    setNewAppName('');
    setNewPackage('');
    setNewUrl('');
    setNewNotes('');
    setIsAddingNew(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-700 uppercase tracking-wider font-bold">
            <Smartphone className="w-4 h-4" />
            Counterfeit Mobile Apps & Rogue APK Radar
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
            Brand Impersonation in Mobile App Ecosystems
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Astra continuously scans direct messages, web mirrors, and underground APK repositories to detect trojanized Android & iOS applications masquerading as your brand.
          </p>
        </div>

        <button
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Report Rogue APK
        </button>
      </div>

      {/* Official Legitimate Apps Reference Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
        <div className="text-xs font-mono font-semibold text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Authorized Official Mobile Applications for {brand.brandName}
          </span>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Baseline Identity Verification</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {brand.officialMobileApps.map((app, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-900 font-bold">{app.name}</span>
                <span className="text-slate-500 ml-2">({app.platform.toUpperCase()})</span>
                <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">{app.identifier}</div>
              </div>
              <a
                href={app.storeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Submission Form */}
      {isAddingNew && (
        <form onSubmit={handleCreateRogueApp} className="p-5 rounded-2xl bg-white border border-red-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            Manual Rogue App / APK Investigation Submission
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-700 font-semibold">Counterfeit App Display Name</label>
              <input
                type="text"
                required
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                placeholder="e.g. Astra Security Update APK"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-700 font-semibold">Spoofed Package Identifier</label>
              <input
                type="text"
                required
                value={newPackage}
                onChange={(e) => setNewPackage(e.target.value)}
                placeholder="e.g. com.astra.security.patch.updater"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-mono text-slate-700 font-semibold">Distribution URL / Download Link</label>
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://malicious-domain.top/download/app.apk"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-mono text-slate-700 font-semibold">Threat Behavior / Impersonation Context</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Observed pretending to be official customer service on Telegram..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition shadow-xs"
            >
              Ingest & Trigger Forensics
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by package name, app title, or payload domain..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-600 shadow-xs"
        />
      </div>

      {/* Rogue Apps List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredApps.map((app) => (
          <div
            key={app.id}
            className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 hover:border-slate-300 transition shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {app.appName}
                    </h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      app.status === 'active_threat'
                        ? 'bg-red-50 text-red-700 border-red-200 font-bold'
                        : app.status === 'takedown_submitted'
                        ? 'bg-amber-50 text-amber-800 border-amber-200 font-bold'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                    }`}>
                      {app.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-red-700 font-mono font-semibold mt-0.5">
                    Package: {app.packageName}
                  </div>
                </div>
              </div>

              {/* Threat Risk Meter */}
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase font-semibold">Malware Risk Score</div>
                  <div className="text-2xl font-black text-red-700 font-mono">
                    {app.riskScore}<span className="text-xs text-slate-400 font-normal">/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Context & Description */}
            <p className="text-xs text-slate-700 leading-relaxed font-mono bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {app.impersonationDetails}
            </p>

            {/* Technical Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Distribution URL</div>
                <div className="text-slate-800 truncate mt-0.5 font-medium">{app.downloadUrl}</div>
              </div>

              {app.sha256 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">SHA-256 Checksum</div>
                    <div className="text-slate-600 truncate mt-0.5 text-[11px]">{app.sha256}</div>
                  </div>
                  <button
                    onClick={() => copyText(app.sha256!, app.id)}
                    className="p-1 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                    title="Copy SHA-256"
                  >
                    {copiedSha === app.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <div className="text-[11px] text-slate-500 font-mono">
                Source: <span className="text-slate-800 uppercase font-semibold">{app.sourcePlatform.replace('_', ' ')}</span> | Discovered: {new Date(app.discoveredAt).toLocaleString()}
              </div>

              <div className="flex items-center gap-2">
                {app.status === 'active_threat' && (
                  <button
                    onClick={() => onUpdateAppStatus(app.id, 'takedown_submitted')}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-semibold hover:bg-amber-100 transition"
                  >
                    Mark Takedown Filed
                  </button>
                )}

                {app.status !== 'removed' && (
                  <button
                    onClick={() => onUpdateAppStatus(app.id, 'removed')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold hover:bg-emerald-100 transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Mark Removed
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
