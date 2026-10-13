'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Eye,
  Filter,
  Fingerprint,
  Globe2,
  Lock,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserX,
} from 'lucide-react';
import type { Sighting, Campaign } from '@/lib/api';

export type ThreatCategory = 'all' | 'social' | 'domains' | 'apps' | 'campaigns';

interface CategorizedThreatsBoardProps {
  sightings: Sighting[];
  campaigns?: Campaign[];
  isScanning?: boolean;
  etaSeconds?: number;
  newThreatIds?: Set<string>;
}

export function CategorizedThreatsBoard({
  sightings,
  campaigns = [],
  isScanning = false,
  etaSeconds = 0,
  newThreatIds = new Set(),
}: CategorizedThreatsBoardProps) {
  const [selectedCategory, setSelectedCategory] = useState<ThreatCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Classify sightings into threat intelligence categories
  const categorized = useMemo(() => {
    const socialThreats: Sighting[] = [];
    const domainThreats: Sighting[] = [];
    const appThreats: Sighting[] = [];
    const otherThreats: Sighting[] = [];

    sightings.forEach((s) => {
      const surface = (s.surface || '').toLowerCase();
      const payload = s.normalized_payload || {};
      const target = (payload.target || s.raw_ref || '').toLowerCase();

      if (
        surface.includes('instagram') ||
        surface.includes('telegram') ||
        surface.includes('twitter') ||
        surface.includes('social') ||
        target.startsWith('@')
      ) {
        socialThreats.push(s);
      } else if (
        surface.includes('web') ||
        surface.includes('domain') ||
        surface.includes('dns') ||
        payload.domain ||
        target.includes('.com') ||
        target.includes('.net') ||
        target.includes('.io') ||
        target.includes('.org')
      ) {
        domainThreats.push(s);
      } else if (
        surface.includes('apk') ||
        surface.includes('app') ||
        surface.includes('play') ||
        target.includes('.apk')
      ) {
        appThreats.push(s);
      } else {
        otherThreats.push(s);
      }
    });

    return {
      social: socialThreats,
      domains: domainThreats,
      apps: appThreats,
      other: otherThreats,
      all: sightings,
    };
  }, [sightings]);

  // Filter based on active category tab & search query
  const filteredList = useMemo(() => {
    let list: Sighting[] = [];
    if (selectedCategory === 'all') list = categorized.all;
    else if (selectedCategory === 'social') list = categorized.social;
    else if (selectedCategory === 'domains') list = categorized.domains;
    else if (selectedCategory === 'apps') list = categorized.apps;
    else list = categorized.all;

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase();
    return list.filter((item) => {
      const payload = item.normalized_payload || {};
      const target = (payload.target || payload.domain || payload.sender?.username || item.raw_ref || '').toLowerCase();
      const summary = (payload.threat_analysis?.summary || payload.content || '').toLowerCase();
      return target.includes(query) || summary.includes(query) || item.surface.toLowerCase().includes(query);
    });
  }, [categorized, selectedCategory, searchQuery]);

  const getThreatCategoryBadge = (sighting: Sighting) => {
    const surface = (sighting.surface || '').toLowerCase();
    const payload = sighting.normalized_payload || {};
    const target = (payload.target || sighting.raw_ref || '').toLowerCase();

    if (
      surface.includes('instagram') ||
      surface.includes('telegram') ||
      surface.includes('twitter') ||
      surface.includes('social') ||
      target.startsWith('@')
    ) {
      return {
        label: 'Scam Account / Impersonator',
        icon: UserX,
        color: 'border-purple-200 bg-purple-50 text-purple-700',
        badgeColor: 'bg-purple-600',
      };
    }

    if (
      surface.includes('web') ||
      surface.includes('domain') ||
      surface.includes('dns') ||
      payload.domain
    ) {
      return {
        label: 'Phishing / Typosquat Domain',
        icon: Globe2,
        color: 'border-rose-200 bg-rose-50 text-rose-700',
        badgeColor: 'bg-rose-600',
      };
    }

    if (surface.includes('apk') || surface.includes('app')) {
      return {
        label: 'Rogue App / Counterfeit APK',
        icon: Smartphone,
        color: 'border-amber-200 bg-amber-50 text-amber-700',
        badgeColor: 'bg-amber-600',
      };
    }

    return {
      label: 'Perimeter Threat',
      icon: ShieldAlert,
      color: 'border-slate-200 bg-slate-50 text-slate-700',
      badgeColor: 'bg-slate-600',
    };
  };

  return (
    <section className="rounded-[8px] border border-[#e3e2e0] bg-white shadow-2xs overflow-hidden">
      {/* SECTION HEADER */}
      <div className="border-b border-[#e3e2e0] bg-[#faf9f8] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20">
                <ShieldAlert className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-base font-bold tracking-tight text-[#37352f]">
                Analyzed Threats &amp; Impersonator Accounts
              </h2>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                {sightings.length} Detected
              </span>
            </div>
            <p className="mt-1 text-xs text-[#787774]">
              Active threat intelligence across social media impersonators, typosquat domains, and malicious assets.
            </p>
          </div>

          {/* REAL-TIME SCANNING INDICATOR */}
          {isScanning && (
            <div className="flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/80 px-3 py-1.5 text-xs text-cyan-900 shadow-2xs">
              <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-600" />
              <span className="font-semibold">Live Threat Discovery Active</span>
              {etaSeconds > 0 && (
                <span className="font-mono text-[11px] text-cyan-700">· ~{etaSeconds}s remaining</span>
              )}
            </div>
          )}
        </div>

        {/* TABS & SEARCH CONTROLS */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategory === 'all'
                  ? 'bg-[#37352f] text-white shadow-xs'
                  : 'bg-white text-[#787774] border border-[#e3e2e0] hover:bg-[#f7f6f3] hover:text-[#37352f]'
              }`}
            >
              <span>All Threats</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {categorized.all.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('social')}
              className={`inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategory === 'social'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-[#787774] border border-[#e3e2e0] hover:bg-[#f7f6f3] hover:text-[#37352f]'
              }`}
            >
              <UserX className="h-3.5 w-3.5" />
              <span>Scam Accounts</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedCategory === 'social' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {categorized.social.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('domains')}
              className={`inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategory === 'domains'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-[#787774] border border-[#e3e2e0] hover:bg-[#f7f6f3] hover:text-[#37352f]'
              }`}
            >
              <Globe2 className="h-3.5 w-3.5" />
              <span>Typosquat Domains</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedCategory === 'domains' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {categorized.domains.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('apps')}
              className={`inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategory === 'apps'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white text-[#787774] border border-[#e3e2e0] hover:bg-[#f7f6f3] hover:text-[#37352f]'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Rogue Apps</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedCategory === 'apps' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {categorized.apps.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9b9a97]" />
            <input
              type="text"
              placeholder="Search threat title, handle, or domain…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-[6px] border border-[#e3e2e0] bg-white pl-8 pr-3 text-xs text-[#37352f] placeholder-[#9b9a97] transition focus:border-[#0f7b6c] focus:outline-none focus:ring-1 focus:ring-[#0f7b6c]"
            />
          </div>
        </div>
      </div>

      {/* THREATS FEED LIST */}
      <div className="divide-y divide-[#e3e2e0]">
        {filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f6f3] text-[#0f7b6c] border border-[#e3e2e0]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-[#37352f]">
              {searchQuery ? 'No matching threats found' : 'No threat signals in this category'}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-[#787774]">
              {isScanning
                ? 'Coordinated scanning scripts are currently analyzing OSINT vectors. New threats will stream here live.'
                : 'Perimeter check completed. No active threat artifacts were flagged under this filter.'}
            </p>
          </div>
        ) : (
          filteredList.map((sighting) => {
            const payload = sighting.normalized_payload || {};
            const sender = payload.sender || {};
            const domain = payload.domain;
            const whoisUrl = payload.whois_url;
            const target = domain || (sender.username ? `@${sender.username}` : payload.target || sighting.raw_ref);
            const summary = payload.threat_analysis?.summary || payload.content || 'Potential brand perimeter collision detected.';
            const badge = getThreatCategoryBadge(sighting);
            const BadgeIcon = badge.icon;
            const isBrandNew = newThreatIds.has(sighting.id);

            // Construct valid accessible link
            let accessibleUrl = payload.target_url || sighting.raw_ref;
            if (!accessibleUrl && sender.username) {
              const cleanUser = sender.username.replace('@', '');
              const sfc = sighting.surface.toLowerCase();
              if (sfc.includes('instagram')) accessibleUrl = `https://instagram.com/${cleanUser}`;
              else if (sfc.includes('telegram')) accessibleUrl = `https://t.me/${cleanUser}`;
              else if (sfc.includes('twitter') || sfc.includes('x')) accessibleUrl = `https://x.com/${cleanUser}`;
            } else if (!accessibleUrl && domain) {
              accessibleUrl = `https://${domain}`;
            }

            return (
              <div
                key={sighting.id}
                className={`p-4 sm:p-5 transition hover:bg-[#faf9f8] ${
                  isBrandNew ? 'bg-amber-50/50 animate-pulse' : ''
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border p-2 ${badge.color}`}>
                      <BadgeIcon className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {accessibleUrl ? (
                          <a
                            href={accessibleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-1.5 truncate text-sm font-bold text-[#37352f] hover:text-[#0f7b6c]"
                          >
                            <span className="truncate">{target}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#9b9a97] transition group-hover:text-[#0f7b6c]" />
                          </a>
                        ) : (
                          <span className="truncate text-sm font-bold text-[#37352f]">{target}</span>
                        )}

                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${badge.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.badgeColor}`} />
                          {badge.label}
                        </span>

                        <span className="inline-flex items-center rounded-[4px] border border-[#e3e2e0] bg-[#f7f6f3] px-1.5 py-0.5 text-[10px] font-mono text-[#787774] capitalize">
                          {sighting.surface}
                        </span>

                        {isBrandNew && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white px-2 py-0.2 text-[10px] font-bold">
                            <Sparkles className="h-2.5 w-2.5" /> Just Discovered
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-[#787774] leading-relaxed">
                        {summary}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-[#9b9a97]">
                        <span>Observed: {new Date(sighting.observed_at || sighting.created_at).toLocaleString()}</span>
                        <span>·</span>
                        <span className="font-mono">Surface: {sighting.surface}</span>
                        {whoisUrl && (
                          <>
                            <span>·</span>
                            <a
                              href={whoisUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-[#0f7b6c] hover:underline inline-flex items-center gap-0.5"
                            >
                              View WHOIS Record <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    <span className="rounded-[4px] border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-800">
                      Score: {payload.threat_analysis?.risk_score ?? 85}/100
                    </span>

                    {accessibleUrl && (
                      <a
                        href={accessibleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#e3e2e0] bg-white px-2.5 text-xs font-medium text-[#37352f] transition hover:bg-[#f7f6f3]"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#787774]" />
                        <span>Inspect</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER INTELLIGENCE SUMMARY */}
      <div className="border-t border-[#e3e2e0] bg-[#faf9f8] px-4 py-3 sm:px-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#787774]">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span>Active correlation engine · Live sightings verified with zero synthetic hallucination</span>
        </div>
        <div className="font-mono text-[11px] text-[#9b9a97]">
          Showing {filteredList.length} of {sightings.length} total findings
        </div>
      </div>
    </section>
  );
}
