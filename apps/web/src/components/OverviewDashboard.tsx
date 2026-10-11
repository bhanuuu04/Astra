'use client';

import React, { useState } from 'react';
import { 
  Shield, 
  Link as LinkIcon, 
  Package, 
  ArrowDownRight, 
  ArrowRight, 
  ChevronDown, 
  Globe, 
  Smartphone
} from 'lucide-react';

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const YoutubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
    <polygon points="10 15 15 12 10 9 10 15" fill="currentColor"/>
  </svg>
);

interface OverviewDashboardProps {
  onSelectThreat: (threatId?: string) => void;
  onOpenTakedown: (threat: any) => void;
  onNavigateToTab: (tab: string) => void;
}

export function OverviewDashboard({
  onSelectThreat,
  onOpenTakedown,
  onNavigateToTab
}: OverviewDashboardProps) {
  const [threatTimeFilter, setThreatTimeFilter] = useState('All Threat Types');

  // Recent threats data matching the uploaded design
  const recentThreats = [
    {
      id: 'rt-1',
      type: 'Fake Profile',
      typeIcon: 'mask',
      title: '@acme.supportt',
      subtitle: 'Impersonating official support',
      source: 'instagram',
      risk: 'High',
      riskColor: 'bg-red-50 text-red-600 border-red-200',
      time: '2 hours ago',
      platformIcon: 'instagram'
    },
    {
      id: 'rt-2',
      type: 'Scam Link',
      typeIcon: 'link',
      title: 'acme-offer.com',
      subtitle: 'Phishing campaign',
      source: 'x_twitter',
      risk: 'High',
      riskColor: 'bg-red-50 text-red-600 border-red-200',
      time: '4 hours ago',
      platformIcon: 'x_twitter'
    },
    {
      id: 'rt-3',
      type: 'Fake App',
      typeIcon: 'package',
      title: 'Acme Wallet Pro',
      subtitle: 'Malicious Android app',
      source: 'playstore',
      risk: 'High',
      riskColor: 'bg-red-50 text-red-600 border-red-200',
      time: '6 hours ago',
      platformIcon: 'playstore'
    },
    {
      id: 'rt-4',
      type: 'Fake Profile',
      typeIcon: 'mask',
      title: 'Acme Global',
      subtitle: 'Using similar logo and name',
      source: 'facebook',
      risk: 'Medium',
      riskColor: 'bg-amber-50 text-amber-600 border-amber-200',
      time: '8 hours ago',
      platformIcon: 'facebook'
    },
    {
      id: 'rt-5',
      type: 'Scam Link',
      typeIcon: 'link',
      title: 'acme-giveaway.net',
      subtitle: 'Fake reward campaign',
      source: 'tiktok',
      risk: 'Medium',
      riskColor: 'bg-amber-50 text-amber-600 border-amber-200',
      time: '12 hours ago',
      platformIcon: 'tiktok'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Hero Greeting Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
            Good morning <span className="text-base">👋</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Your brand is <span className="text-[#4F46E5] bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">protected.</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            We monitor the internet for threats, impersonation, and fraud — so you can focus on what matters.
          </p>
        </div>

        {/* Hero Curved 3D Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-white border border-indigo-100/80 p-4 sm:p-5 flex items-center justify-between gap-6 shadow-xs min-w-[280px] lg:min-w-[340px]">
          <div className="absolute right-12 -top-6 w-36 h-36 bg-gradient-to-br from-indigo-300/30 to-purple-400/20 rounded-full blur-2xl pointer-events-none" />
          <svg className="absolute right-16 top-1/2 -translate-y-1/2 w-32 h-20 opacity-40 pointer-events-none" viewBox="0 0 140 80" fill="none">
            <path d="M10 60 C 40 10, 80 80, 130 20" stroke="url(#hero-gradient)" strokeWidth="12" strokeLinecap="round" />
            <defs>
              <linearGradient id="hero-gradient" x1="0" y1="0" x2="140" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#A855F7" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative z-10">
            <div className="text-sm font-bold text-slate-800 leading-tight">
              Detect.<br />Take action.<br />Stay ahead.
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('threats')}
            className="relative z-10 w-10 h-10 rounded-full bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-100 shadow-sm flex items-center justify-center transition hover:scale-105 active:scale-95 shrink-0"
            title="View Active Threats"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Threats Detected */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Shield className="w-5 h-5 fill-indigo-100" />
            </div>
            <svg className="w-20 h-8" viewBox="0 0 80 30" fill="none">
              <path d="M2 22 Q 18 28, 30 16 T 50 14 T 70 8 T 78 12" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          <div className="mt-4">
            <div className="text-xs font-medium text-slate-500">Total Threats Detected</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">248</div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-2">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>32%</span>
              <span className="text-slate-400 font-normal ml-0.5">vs previous 30 days</span>
            </div>
          </div>
        </div>

        {/* Card 2: Fake Profiles */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
              <span className="text-lg">🎭</span>
            </div>
            <svg className="w-20 h-8" viewBox="0 0 80 30" fill="none">
              <path d="M2 20 Q 20 8, 35 22 T 55 12 T 78 20" stroke="#F87171" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          <div className="mt-4">
            <div className="text-xs font-medium text-slate-500">Fake Profiles</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">96</div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-2">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>18%</span>
              <span className="text-slate-400 font-normal ml-0.5">vs previous 30 days</span>
            </div>
          </div>
        </div>

        {/* Card 3: Scam Links */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <LinkIcon className="w-5 h-5" />
            </div>
            <svg className="w-20 h-8" viewBox="0 0 80 30" fill="none">
              <path d="M2 24 Q 15 12, 35 24 T 55 10 T 78 18" stroke="#34D399" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          <div className="mt-4">
            <div className="text-xs font-medium text-slate-500">Scam Links</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">71</div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-2">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>41%</span>
              <span className="text-slate-400 font-normal ml-0.5">vs previous 30 days</span>
            </div>
          </div>
        </div>

        {/* Card 4: Fake Apps */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Package className="w-5 h-5" />
            </div>
            <svg className="w-20 h-8" viewBox="0 0 80 30" fill="none">
              <path d="M2 22 Q 18 26, 32 14 T 52 18 T 78 10" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          <div className="mt-4">
            <div className="text-xs font-medium text-slate-500">Fake Apps</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">34</div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-2">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>27%</span>
              <span className="text-slate-400 font-normal ml-0.5">vs previous 30 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Threats Over Time & Threats by Source */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Threats Over Time Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Threats Over Time</h2>
              <p className="text-xs text-slate-500 mt-0.5">Total threats detected across all sources</p>
            </div>

            <div className="relative">
              <select
                value={threatTimeFilter}
                onChange={(e) => setThreatTimeFilter(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 pr-8 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer focus:outline-none focus:border-indigo-500"
              >
                <option>All Threat Types</option>
                <option>Impersonation Profiles</option>
                <option>Counterfeit Mobile APKs</option>
                <option>Phishing Domains</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Interactive SVG Area Chart */}
          <div className="relative w-full h-56 pt-2">
            {/* Tooltip on Sep 12 */}
            <div className="absolute left-[36%] top-3 -translate-x-1/2 bg-white rounded-xl px-3 py-1.5 shadow-md border border-slate-200/80 z-20 pointer-events-none flex flex-col items-center">
              <div className="text-[10px] text-slate-400 font-medium">Sep 12</div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                62 threats
              </div>
              <div className="w-2 h-2 bg-white border-r border-b border-slate-200 rotate-45 -mb-2 mt-0.5" />
            </div>

            {/* SVG Wave */}
            <svg className="w-full h-44 overflow-visible" viewBox="0 0 700 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.32" />
                  <stop offset="70%" stopColor="#818CF8" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="0" y1="10" x2="700" y2="10" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="50" x2="700" y2="50" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="700" y2="90" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="130" x2="700" y2="130" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />

              <path
                d="M 0 145 C 50 140, 70 125, 120 115 C 160 100, 200 40, 250 35 C 290 85, 330 110, 380 95 C 430 85, 470 110, 520 40 C 560 90, 600 80, 700 135 L 700 160 L 0 160 Z"
                fill="url(#chartGradient)"
              />

              <path
                d="M 0 145 C 50 140, 70 125, 120 115 C 160 100, 200 40, 250 35 C 290 85, 330 110, 380 95 C 430 85, 470 110, 520 40 C 560 90, 600 80, 700 135"
                fill="none"
                stroke="#6366F1"
                strokeWidth="3"
                strokeLinecap="round"
              />

              <circle cx="250" cy="35" r="5" fill="#6366F1" stroke="#FFFFFF" strokeWidth="3" />
            </svg>

            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono mt-3 px-1">
              <span>Sep 1</span>
              <span>Sep 5</span>
              <span>Sep 10</span>
              <span>Sep 15</span>
              <span>Sep 20</span>
              <span>Sep 25</span>
              <span>Sep 30</span>
            </div>
          </div>
        </div>

        {/* Right: Threats by Source Donut Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Threats by Source</h2>
            <p className="text-xs text-slate-500 mt-0.5">Origin of flagged incidents</p>
          </div>

          <div className="my-4 flex items-center justify-between gap-4">
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EC4899" strokeWidth="12" strokeDasharray="64.5 174.5" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#3B82F6" strokeWidth="12" strokeDasharray="52.5 186.5" strokeDashoffset="-64.5" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#18181B" strokeWidth="12" strokeDasharray="45.5 193.5" strokeDashoffset="-117" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#06B6D4" strokeWidth="12" strokeDasharray="36 203" strokeDashoffset="-162.5" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" strokeWidth="12" strokeDasharray="24 215" strokeDashoffset="-198.5" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#94A3B8" strokeWidth="12" strokeDasharray="17 222" strokeDashoffset="-222.5" />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-lg font-black text-slate-900 leading-none">248</span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">Total</span>
              </div>
            </div>

            <div className="space-y-2 text-xs flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899] shrink-0" />
                  <span className="text-slate-700 truncate font-medium">Instagram</span>
                </div>
                <div className="text-slate-500 font-mono text-[11px] shrink-0">
                  <strong className="text-slate-800">68</strong> 27%
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0" />
                  <span className="text-slate-700 truncate font-medium">Facebook</span>
                </div>
                <div className="text-slate-500 font-mono text-[11px] shrink-0">
                  <strong className="text-slate-800">54</strong> 22%
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#18181B] shrink-0" />
                  <span className="text-slate-700 truncate font-medium">X (Twitter)</span>
                </div>
                <div className="text-slate-500 font-mono text-[11px] shrink-0">
                  <strong className="text-slate-800">46</strong> 19%
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] shrink-0" />
                  <span className="text-slate-700 truncate font-medium">TikTok</span>
                </div>
                <div className="text-slate-500 font-mono text-[11px] shrink-0">
                  <strong className="text-slate-800">38</strong> 15%
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shrink-0" />
                  <span className="text-slate-700 truncate font-medium">YouTube</span>
                </div>
                <div className="text-slate-500 font-mono text-[11px] shrink-0">
                  <strong className="text-slate-800">24</strong> 10%
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8] shrink-0" />
                  <span className="text-slate-700 truncate font-medium">Others</span>
                </div>
                <div className="text-slate-500 font-mono text-[11px] shrink-0">
                  <strong className="text-slate-800">18</strong> 7%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Threats Table & Right Column Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Threats Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Threats</h2>
              <p className="text-xs text-slate-500 mt-0.5">High priority active investigations</p>
            </div>
            <button
              onClick={() => onNavigateToTab('threats')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Details</th>
                  <th className="pb-3 font-medium text-center">Source</th>
                  <th className="pb-3 font-medium">Risk</th>
                  <th className="pb-3 font-medium">Detected</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentThreats.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 pr-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {item.typeIcon === 'mask' && (
                          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center text-xs">
                            🎭
                          </div>
                        )}
                        {item.typeIcon === 'link' && (
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <LinkIcon className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.typeIcon === 'package' && (
                          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Package className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="font-semibold text-slate-800">{item.type}</span>
                      </div>
                    </td>

                    <td className="py-3.5 pr-3 min-w-[160px]">
                      <div className="font-bold text-slate-900 leading-snug">{item.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                    </td>

                    <td className="py-3.5 px-2 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700">
                        {item.source === 'instagram' && <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />}
                        {item.source === 'x_twitter' && <span className="font-bold text-xs">𝕏</span>}
                        {item.source === 'playstore' && <Smartphone className="w-3.5 h-3.5 text-emerald-600" />}
                        {item.source === 'facebook' && <FacebookIcon className="w-3.5 h-3.5 text-blue-600" />}
                        {item.source === 'tiktok' && <span className="font-bold text-xs">♪</span>}
                      </div>
                    </td>

                    <td className="py-3.5 pr-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${item.riskColor}`}>
                        {item.risk}
                      </span>
                    </td>

                    <td className="py-3.5 pr-3 text-slate-500 whitespace-nowrap text-[11px]">
                      {item.time}
                    </td>

                    <td className="py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => onOpenTakedown(item)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs transition active:scale-95"
                      >
                        Take Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Threats by Region & Active Monitored Assets */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Threats by Region */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Threats by Region</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('threats')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View map <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="relative w-full h-24 mb-4 flex items-center justify-center bg-slate-50/70 rounded-xl overflow-hidden border border-slate-100">
              <svg className="w-full h-full opacity-60" viewBox="0 0 300 100" fill="none">
                <circle cx="60" cy="40" r="14" fill="#818CF8" fillOpacity="0.2" />
                <circle cx="60" cy="40" r="4" fill="#6366F1" />
                <circle cx="150" cy="50" r="16" fill="#818CF8" fillOpacity="0.25" />
                <circle cx="150" cy="50" r="5" fill="#6366F1" />
                <circle cx="210" cy="45" r="18" fill="#818CF8" fillOpacity="0.3" />
                <circle cx="210" cy="45" r="6" fill="#6366F1" />
                <circle cx="240" cy="65" r="12" fill="#818CF8" fillOpacity="0.2" />
                <circle cx="240" cy="65" r="3.5" fill="#6366F1" />
              </svg>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center justify-center">🇮🇳</span>
                  <span className="text-slate-700 font-medium">India</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '32%' }} />
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] w-7 text-right">32%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">🇺🇸</span>
                  <span className="text-slate-700 font-medium">United States</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '18%' }} />
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] w-7 text-right">18%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center">🇮🇩</span>
                  <span className="text-slate-700 font-medium">Indonesia</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '12%' }} />
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] w-7 text-right">12%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center">🇧🇷</span>
                  <span className="text-slate-700 font-medium">Brazil</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '8%' }} />
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] w-7 text-right">8%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">🇬🇧</span>
                  <span className="text-slate-700 font-medium">United Kingdom</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '7%' }} />
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] w-7 text-right">7%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-750 text-[10px] font-bold flex items-center justify-center">🌐</span>
                  <span className="text-slate-700 font-medium">Others</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '23%' }} />
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] w-7 text-right">23%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Monitored Assets */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Active Monitored Assets</h3>
              <button
                onClick={() => onNavigateToTab('brand_assets')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mb-1.5">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <div className="text-xs font-black text-slate-900">12</div>
                <div className="text-[10px] text-slate-400">Accounts</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                  <FacebookIcon className="w-4 h-4" />
                </div>
                <div className="text-xs font-black text-slate-900">8</div>
                <div className="text-[10px] text-slate-400">Pages</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center mb-1.5 font-bold text-xs">
                  𝕏
                </div>
                <div className="text-xs font-black text-slate-900">6</div>
                <div className="text-[10px] text-slate-400">Handles</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1.5">
                  <YoutubeIcon className="w-4 h-4" />
                </div>
                <div className="text-xs font-black text-slate-900">4</div>
                <div className="text-[10px] text-slate-400">Channels</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="text-xs font-black text-slate-900">18</div>
                <div className="text-[10px] text-slate-400">Domains</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-xs font-black text-slate-900">6</div>
                <div className="text-[10px] text-slate-400">Apps</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
