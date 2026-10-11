'use client';

import React from 'react';
import { 
  Home, 
  Bell, 
  CheckCircle, 
  Grid, 
  Compass, 
  Share2, 
  Globe, 
  ShieldCheck, 
  FileText, 
  Layers, 
  Users, 
  Settings, 
  Sparkles, 
  ArrowRight,
  Network
} from 'lucide-react';

export type MainNavTab = 
  | 'overview'
  | 'campaign_graph'
  | 'threats'
  | 'impersonation'
  | 'fake_apps'
  | 'scam_links'
  | 'social_monitoring'
  | 'domains'
  | 'takedowns'
  | 'reports'
  | 'brand_assets'
  | 'team'
  | 'settings';

interface SidebarProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  threatsCount?: number;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  threatsCount = 12
}: SidebarProps) {
  const menuItems = [
    { id: 'overview' as MainNavTab, label: 'Overview', icon: Home },
    { id: 'campaign_graph' as MainNavTab, label: 'Campaign Graph', icon: Network, badge: 'Pivots' },
    { id: 'threats' as MainNavTab, label: 'Threats', icon: Bell, badge: `${threatsCount}` },
    { id: 'impersonation' as MainNavTab, label: 'Impersonation', icon: CheckCircle },
    { id: 'fake_apps' as MainNavTab, label: 'Fake Apps', icon: Grid },
    { id: 'scam_links' as MainNavTab, label: 'Scam Links', icon: Compass },
    { id: 'social_monitoring' as MainNavTab, label: 'Social Monitoring', icon: Share2 },
    { id: 'domains' as MainNavTab, label: 'Domains', icon: Globe },
    { id: 'takedowns' as MainNavTab, label: 'Takedowns', icon: ShieldCheck },
    { id: 'reports' as MainNavTab, label: 'Reports', icon: FileText },
    { id: 'brand_assets' as MainNavTab, label: 'Brand Assets', icon: Layers },
    { id: 'settings' as MainNavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 border-r border-slate-800 bg-slate-900/90 text-slate-100 flex flex-col justify-between shrink-0 h-full overflow-y-auto select-none">
      <div className="p-3 space-y-4">
        {/* Simulator Section Header */}
        <div className="px-3 py-2 flex items-center justify-between border-b border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Sandbox Views
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            MOCK
          </span>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer group ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 transition ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Simulator Notice Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60">
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200">Interactive Simulator</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Inject mock signals to test real-time detection heuristics.
          </p>
        </div>
      </div>
    </aside>
  );
}
