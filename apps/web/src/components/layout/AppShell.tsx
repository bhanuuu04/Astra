'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpRight,
  Bell,
  BellRing,
  BookOpen,
  Command,
  Fingerprint,
  LayoutDashboard,
  Menu,
  Network,
  Search,
  Shield,
  Smartphone,
  X,
} from 'lucide-react';
import { CommandPalette } from '@/components/CommandPalette';
import { listSightings, type Sighting } from '@/lib/api';

interface AppShellProps {
  children: React.ReactNode;
}

const primaryNavigation = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/sightings', label: 'Findings queue', icon: Bell },
  { href: '/campaigns', label: 'Campaigns', icon: Network },
  { href: '/brands', label: 'Brand DNA', icon: Fingerprint },
];

const monitorNavigation = [
  { href: '/apps', label: 'App radar', icon: Smartphone },
  { href: '/alerts', label: 'Alert feed', icon: BellRing },
];

const pageNames: Record<string, string> = {
  overview: 'Overview',
  sightings: 'Findings queue',
  campaigns: 'Campaigns',
  brands: 'Brand DNA',
  apps: 'Mobile App Radar',
  alerts: 'Alert feed',
  landing: 'Product tour',
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const routeParts = pathname.split('/').filter(Boolean);
  const pageRoot = routeParts[0] || 'overview';
  const pageTitle = pageRoot === 'campaigns'
    ? routeParts[2] === 'response' ? 'Response packet' : routeParts.length > 1 ? 'Campaign detail' : 'Campaigns'
    : pageNames[pageRoot] || 'Overview';

  // Live unread alert count from sightings (last 30 min, high-risk)
  const { data: sightings = [] } = useQuery<Sighting[]>({
    queryKey: ['sightings'],
    queryFn: () => listSightings(),
    refetchInterval: 30000,
  });
  const unreadAlerts = React.useMemo(() => {
    const cutoff = Date.now() - 1000 * 60 * 30;
    return sightings.filter((s: Sighting) => {
      const ts = new Date(s.observed_at || s.created_at).getTime();
      const risk = s.normalized_payload?.threat_analysis?.risk_score || 0;
      return ts > cutoff && risk >= 0.7;
    }).length;
  }, [sightings]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const nav = (
    <nav aria-label="Main navigation" className="space-y-1">
      {primaryNavigation.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href || pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileMenuOpen(false)}
            aria-current={active ? 'page' : undefined}
            className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${
              active
                ? 'border border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-100'
                : 'border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
            }`}
          >
            <Icon className={`h-[17px] w-[17px] ${active ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-300'}`} strokeWidth={1.8} />
            <span className="flex-1">{label}</span>
            {active && <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="astra-shell flex h-dvh min-h-[600px] w-full overflow-hidden text-slate-100">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm md:hidden"
        />
      )}

      <aside className={`astra-sidebar fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-white/[0.07] transition-transform duration-200 md:static md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[68px] items-center gap-3 border-b border-white/[0.07] px-5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200">
            <Shield className="h-[19px] w-[19px]" strokeWidth={1.8} />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0c121d] bg-cyan-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold tracking-[0.16em] text-white">ASTRA</span>
              <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.13em] text-slate-400">DRP</span>
            </div>
            <div className="mt-0.5 text-[10px] tracking-wide text-slate-500">Digital risk protection</div>
          </div>
          <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" className="rounded-md p-1 text-slate-500 hover:bg-white/5 hover:text-white md:hidden"><X className="h-4 w-4" /></button>
        </div>

        <div className="border-b border-white/[0.07] p-3">
          <div className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#26364a] text-[11px] font-semibold tracking-wide text-slate-200">AD</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-slate-200">ASTRA Demo</span>
              <span className="mt-0.5 block text-[10px] text-slate-500">Workspace</span>
            </span>
            <span className="rounded border border-white/[0.08] px-1.5 py-1 text-[8px] font-medium uppercase tracking-[0.1em] text-slate-600">Demo</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Investigate</p>
          {nav}
          <div className="my-5 h-px bg-white/[0.06]" />
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Monitor</p>
          <nav aria-label="Monitor navigation" className="space-y-1">
            {monitorNavigation.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${
                    active
                      ? 'border border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-100'
                      : 'border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                  }`}
                >
                  <Icon className={`h-[17px] w-[17px] ${active ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-300'}`} strokeWidth={1.8} />
                  <span className="flex-1">{label}</span>
                  {href === '/alerts' && unreadAlerts > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {unreadAlerts > 9 ? '9+' : unreadAlerts}
                    </span>
                  )}
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />}
                </Link>
              );
            })}
          </nav>
          <div className="my-5 h-px bg-white/[0.06]" />
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Workspace</p>
          <Link href="/landing" onClick={() => setMobileMenuOpen(false)} className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${pageRoot === 'landing' ? 'bg-white/[0.06] text-slate-100' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'}`}>
            <BookOpen className="h-[17px] w-[17px] text-slate-500 group-hover:text-slate-300" strokeWidth={1.8} />Product guide<ArrowUpRight className="ml-auto h-3 w-3 text-slate-600" />
          </Link>
        </div>

        <div className="border-t border-white/[0.07] p-3">
          <div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.035] p-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-amber-200/90">Demo workspace</span>
            </div>
            <p className="mt-2 text-[11px] leading-[1.55] text-slate-500">Sample records may be shown here. Confirm source labels before treating a finding as live telemetry.</p>
          </div>
          <div className="mt-3 flex items-center gap-2.5 px-1 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#202d3e] text-[10px] font-semibold text-slate-300">AN</div>
            <div className="min-w-0 flex-1"><div className="truncate text-xs font-medium text-slate-300">Analyst</div><div className="text-[10px] text-slate-600">Demo session</div></div>
            <Activity className="h-4 w-4 text-slate-600" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="astra-topbar z-20 flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation" className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-white md:hidden"><Menu className="h-4 w-4" /></button>
            <div className="hidden items-center gap-2 text-xs text-slate-600 sm:flex"><span>Workspace</span><span>/</span></div>
            <h1 className="truncate text-[13px] font-medium text-slate-200">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => setCommandPaletteOpen(true)} className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.025] px-2.5 text-xs text-slate-500 transition hover:border-white/15 hover:text-slate-300 sm:px-3" aria-label="Search cases, brands and indicators">
              <Search className="h-3.5 w-3.5" /><span className="hidden lg:inline">Search anything</span><kbd className="hidden rounded border border-white/[0.08] bg-black/20 px-1.5 py-0.5 font-mono text-[9px] text-slate-600 sm:inline-flex"><Command className="mr-0.5 h-2.5 w-2.5" />K</kbd>
            </button>
            <div className="hidden h-8 items-center gap-2 rounded-lg border border-amber-300/10 bg-amber-300/[0.035] px-2.5 text-[10px] font-medium text-amber-200/80 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" />DEMO</div>
            <Link href="/alerts" aria-label="Open alert feed" title="Open alert feed" className="relative rounded-lg border border-white/[0.09] p-2 text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-300">
              <Bell className="h-4 w-4" />
              {unreadAlerts > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#0b1119] bg-rose-500 text-[8px] font-bold text-white">
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </span>
              )}
            </Link>
          </div>
        </header>

        <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
        <main className="astra-main min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
