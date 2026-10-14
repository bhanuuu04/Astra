'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpRight,
  Bell,
  BellRing,
  BookOpen,
  Building2,
  Command,
  Database,
  Fingerprint,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Network,
  Search,
  Send,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth, useClerk, useUser } from '@clerk/nextjs';
import { CommandPalette } from '@/components/CommandPalette';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  getActiveTenant,
  getActiveUser,
  getAuthToken,
  setActiveTenant,
  setActiveUser,
  setAuthToken,
  clearSession,
  getMe,
  listSightings,
  logout,
  type AuthResponse,
  type Sighting,
  type TenantInfo,
  type UserInfo,
} from '@/lib/api';
import { isClerkAuthConfigured } from '@/lib/auth-config';
import { useDemoSafe } from '@/providers/DemoProvider';
import { DemoModeBanner } from '@/components/demo/DemoModeBanner';
import { GuidedTour, TourLauncher } from '@/components/demo/GuidedTour';

interface AppShellProps {
  children: React.ReactNode;
}

type NavigationItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const navigationGroups: { label: string; items: NavigationItem[] }[] = [
  { label: 'Command center', items: [
    { href: '/overview', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/alerts', label: 'Alert center', icon: BellRing },
  ] },
  { label: 'Digital risk', items: [
    { href: '/sightings', label: 'Findings queue', icon: Bell },
    { href: '/campaigns', label: 'Campaign intelligence', icon: Network },
    { href: '/brands', label: 'Brand protection', icon: Fingerprint },
    { href: '/apps', label: 'Mobile app radar', icon: Smartphone },
  ] },
  { label: 'Response & workspace', items: [
    { href: '/responses', label: 'Response cases', icon: Send },
    { href: '/connectors', label: 'Data sources', icon: Database },
    { href: '/settings', label: 'Settings', icon: Settings },
  ] },
];

const pageNames: Record<string, string> = {
  overview: 'Dashboard',
  sightings: 'Findings queue',
  campaigns: 'Campaigns',
  responses: 'Response cases',
  brands: 'Brand protection',
  connectors: 'Data sources',
  settings: 'Platform Settings',
  apps: 'Mobile app radar',
  alerts: 'Alert center',
  landing: 'Product tour',
};

const clerkAuthConfigured = isClerkAuthConfigured();

export function AppShell({ children }: AppShellProps) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  // Demo mode context
  const demo = useDemoSafe();
  const isDemoMode = demo?.isDemoMode ?? false;

  // Clerk authentication state
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();

  // Tenant context
  const [tenant, setTenant] = React.useState<TenantInfo | null>(null);
  const [localUser, setLocalUser] = React.useState<UserInfo | null>(null);

  const isStandalonePage = 
    pathname === '/' || 
    pathname.startsWith('/landing') || 
    pathname.startsWith('/sign-in') || 
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/guide') ||
    pathname.startsWith('/demo') ||
    pathname.startsWith('/consumer');

  // Client-side authentication guard: enforce login on all protected dashboard routes
  // Skip if demo mode is active — demo has its own localStorage session
  React.useEffect(() => {
    const isDemoActive =
      isDemoMode ||
      (typeof document !== 'undefined' && document.cookie.includes('astra_demo_mode=true')) ||
      (typeof window !== 'undefined' && (window.location.search.includes('demo=true') || window.location.pathname.startsWith('/demo')));
    if (isDemoActive) return; // Demo mode bypasses auth completely
    const hasLocalAuth = !clerkAuthConfigured && Boolean(getActiveUser() && getAuthToken());
    if (isAuthLoaded && !(clerkAuthConfigured ? isSignedIn : hasLocalAuth) && !isStandalonePage) {
      window.location.href = '/sign-in';
    }
  }, [isAuthLoaded, isSignedIn, isStandalonePage, isDemoMode]);


  // Post-sign-in: Sync user to Supabase, isolate tenant state, handle onboarding routing
  React.useEffect(() => {
    if (isSignedIn && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      const fullName = clerkUser.fullName || clerkUser.firstName || '';
      if (!email) return;

      const activeUser = getActiveUser();
      // If a different user was cached in localStorage, clear stale data immediately
      if (activeUser && activeUser.email.toLowerCase() !== email.toLowerCase()) {
        clearSession();
        queryClient.clear();
        setLocalUser(null);
      }

      const composioEntityId = `astra_${clerkUser.id}`;

      fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          clerkId: clerkUser.id,
          composioEntityId,
        }),
      })
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || 'Could not establish the API session.');
          return data;
        })
        .then((data) => {
          if (data.access_token) {
            const previousTenantId = getActiveTenant()?.id;
            if (previousTenantId && previousTenantId !== data.tenant?.id) {
              queryClient.clear();
            }
            setAuthToken(data.access_token);
            setActiveUser(data.user);
            setActiveTenant(data.tenant);
            setLocalUser(data.user);
            setTenant(data.tenant);
          }

          // Strict email-linked onboarding check:
          const userOnboarded = Boolean(data.user?.onboarding_completed || data.onboarding_completed);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`astra_onboarding_completed_${email.toLowerCase()}`, userOnboarded ? 'true' : 'false');
            localStorage.setItem('astra_onboarding_completed', userOnboarded ? 'true' : 'false');
          }

          // If user has NOT completed onboarding, send them straight to /guide
          if (!userOnboarded && !isStandalonePage && pathname !== '/guide') {
            window.location.href = '/guide';
          }
        })
        .catch((err) => console.warn('User sync notice:', err));
    } else if (isDemoMode) {
      setLocalUser(demo?.user as any);
      setTenant(demo?.tenant as any);
    } else if (isAuthLoaded && !isSignedIn) {
      if (clerkAuthConfigured) {
        clearSession();
        queryClient.clear();
        setLocalUser(null);
        setTenant(null);
      } else {
        const activeUser = getActiveUser();
        const activeTenant = getActiveTenant();
        setLocalUser(activeUser);
        setTenant(activeUser && activeTenant ? activeTenant : null);
      }
    } else {
      const activeTenant = getActiveTenant();
      setLocalUser(getActiveUser());
      if (activeTenant) {
        setTenant(activeTenant);
      } else {
        getMe().then((profile) => {
          if (profile) {
            setTenant(profile.tenant);
          }
        }).catch(() => {});
      }
    }
  }, [isSignedIn, clerkUser, isAuthLoaded, pathname, isStandalonePage, queryClient, isDemoMode, demo]);

  const routeParts = pathname.split('/').filter(Boolean);
  const pageRoot = routeParts[0] || 'overview';
  const pageTitle = pageRoot === 'campaigns'
    ? routeParts[2] === 'response' ? 'Response packet' : routeParts.length > 1 ? 'Campaign detail' : 'Campaigns'
    : pageNames[pageRoot] || 'Overview';

  // Live unread alert count from sightings (last 30 min, high-risk)
  const { data: sightings = [], isError: sightingsUnavailable } = useQuery<Sighting[]>({
    queryKey: ['sightings', tenant?.id || 'unresolved'],
    queryFn: () => listSightings(),
    enabled: Boolean(tenant?.id),
    refetchInterval: pathname.startsWith('/alerts') ? 30000 : false,
  });
  const [currentTime, setCurrentTime] = React.useState<number>(0);
  React.useEffect(() => {
    setCurrentTime(Date.now());
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const unreadAlerts = React.useMemo(() => {
    if (!currentTime) return 0;
    const cutoff = currentTime - 1000 * 60 * 30;
    return sightings.filter((s: Sighting) => {
      const ts = new Date(s.observed_at || s.created_at).getTime();
      const risk = s.normalized_payload?.threat_analysis?.risk_score || 0;
      return ts > cutoff && risk >= 0.7;
    }).length;
  }, [sightings, currentTime]);

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

  const handleLogout = () => {
    logout();
    queryClient.clear();
    setLocalUser(null);
    setTenant(null);
    if (clerkAuthConfigured && isSignedIn) {
      void signOut({ redirectUrl: '/sign-in' }).catch(() => {
        window.location.assign('/sign-in');
      });
      return;
    }
    window.location.assign('/sign-in');
  };

  const orgInitials = React.useMemo(() => {
    if (!tenant?.name) return 'AD';
    const parts = tenant.name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return tenant.name.slice(0, 2).toUpperCase();
  }, [tenant]);

  const renderNavigationLink = ({ href, label, icon: Icon, exact }: NavigationItem) => {
    const active = exact ? pathname === href || pathname === '/' : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setMobileMenuOpen(false)}
        aria-current={active ? 'page' : undefined}
        className={`group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${
          active
            ? 'border border-white/10 bg-white/10 text-white font-semibold shadow-sm'
            : 'border border-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white'
        }`}
      >
        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-200'}`} strokeWidth={1.8} />
        <span className="flex-1 truncate">{label}</span>
        {href === '/alerts' && unreadAlerts > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#eb5757] px-1 text-[9px] font-bold text-white">{unreadAlerts > 9 ? '9+' : unreadAlerts}</span>
        )}
        {active && <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />}
      </Link>
    );
  };

  if (pathname.startsWith('/demo')) {
    return <>{children}</>;
  }

  return (
    <div className="astra-shell flex h-dvh min-h-[100svh] w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      {!isStandalonePage && mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-[#37352f]/30 backdrop-blur-xs md:hidden"
        />
      )}

      {!isStandalonePage && (
        <aside className={`astra-sidebar fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-slate-800 bg-[#111c2e] text-white shadow-xl transition-transform duration-200 md:static md:translate-x-0 md:shadow-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
            <Link href="/" title="Back to Landing Page" className="flex items-center gap-3 min-w-0 flex-1 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-[#102033] shadow-sm shadow-cyan-950/30 group-hover:bg-cyan-300 transition-colors">
                <Shield className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-bold tracking-[0.14em] text-white">ASTRA</span>
                <span className="block text-[10px] font-medium tracking-wide text-slate-400">DIGITAL RISK PROTECTION</span>
              </div>
            </Link>
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white md:hidden"><X className="h-4 w-4" /></button>
          </div>

        {/* Tenant Organization Card */}
        <div className="border-b border-white/10 p-4">
          <div className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700 text-xs font-bold text-white ring-1 ring-white/10">
              {orgInitials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-white">
                {tenant?.name || 'Workspace'}
              </span>
              <span className="mt-0.5 block text-[10px] text-slate-400">
                {tenant?.is_demo ? 'Demo environment' : 'Organization workspace'}
              </span>
            </span>
            <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-wide ${tenant?.is_demo ? 'border-amber-300/30 bg-amber-300/10 text-amber-200' : 'border-white/15 bg-white/5 text-slate-300'}`}>
              {tenant?.is_demo ? 'Demo' : 'Workspace'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <nav aria-label="Main navigation" className="space-y-6">
            {navigationGroups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{group.label}</p>
                <div className="space-y-1">{group.items.map(renderNavigationLink)}</div>
              </section>
            ))}
          </nav>
          <div className="my-5 h-px bg-white/10" />
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Workspace</p>
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="group flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors text-slate-300 hover:bg-white/[0.06] hover:text-white"
          >
            <Home className="h-4 w-4 text-cyan-300" strokeWidth={1.8} />
            <span>Landing page</span>
            <ArrowUpRight className="ml-auto h-3 w-3 text-slate-500" />
          </Link>
          <Link
            href="/consumer"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.setItem('astra_user_role', 'consumer');
                localStorage.setItem('astra_intended_account_type', 'consumer');
              }
              setMobileMenuOpen(false);
            }}
            className="group mt-1 flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors text-slate-300 hover:bg-white/[0.06] hover:text-white"
          >
            <Shield className="h-4 w-4 text-emerald-400" strokeWidth={1.8} />
            <span>Consumer feed</span>
            <ArrowUpRight className="ml-auto h-3 w-3 text-slate-500" />
          </Link>
          <Link href="/guide" onClick={() => setMobileMenuOpen(false)} className={`group mt-1 flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${pageRoot === 'guide' ? 'border border-white/10 bg-white/10 font-semibold text-white' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'}`}>
            <Sparkles className="h-4 w-4 text-cyan-300" strokeWidth={1.8} />Brand setup guide<ArrowUpRight className="ml-auto h-3 w-3 text-slate-500" />
          </Link>
          <Link href="/landing" onClick={() => setMobileMenuOpen(false)} className={`group mt-1 flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${pageRoot === 'landing' ? 'border border-white/10 bg-white/10 font-semibold text-white' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'}`}>
            <BookOpen className="h-4 w-4 text-slate-400 group-hover:text-slate-200" strokeWidth={1.8} />Product tour<ArrowUpRight className="ml-auto h-3 w-3 text-slate-500" />
          </Link>
        </div>

        {/* User Identity / Session Footer */}
        <div className="border-t border-white/10 p-4">
          {(isSignedIn && clerkUser) || localUser ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-100 ring-1 ring-white/10">
                <User className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-white">
                  {isSignedIn && clerkUser ? (clerkUser.fullName || clerkUser.firstName || 'Security analyst') : localUser?.full_name}
                </div>
                <div className="truncate text-[10px] text-slate-400">
                  {isSignedIn && clerkUser ? clerkUser.primaryEmailAddress?.emailAddress : localUser?.email}
                </div>
              </div>
              <button type="button" onClick={handleLogout} aria-label="Sign out" title="Sign out" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-3 py-2.5 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
              >
                <LogIn className="h-4 w-4" />
                Sign in to workspace
              </button>
            </div>
          )}
        </div>
      </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DemoModeBanner />
        {!isStandalonePage && (
          <header className="astra-topbar z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-2.5">
              <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation" className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 md:hidden"><Menu className="h-4 w-4" /></button>
              <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
                <span className="max-w-48 truncate">{tenant?.name || 'Workspace'}</span>
                <span aria-hidden="true" className="text-slate-300">/</span>
              </div>
              <h1 className="truncate text-sm font-semibold text-slate-900">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCommandPaletteOpen(true)} className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700" aria-label="Search cases, brands and indicators">
                <Search className="h-3.5 w-3.5 text-slate-400" /><span className="hidden lg:inline text-xs">Search cases &amp; brands</span><kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-500 sm:inline-flex">Ctrl K</kbd>
              </button>
              
              <div className="hidden h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 sm:flex">
                <span className={`h-2 w-2 rounded-full ${sightingsUnavailable && sightings.length === 0 ? 'bg-amber-500' : tenant?.is_demo ? 'bg-cyan-500' : 'bg-emerald-500'}`} />
                <span>{sightingsUnavailable && sightings.length === 0 ? 'Data unavailable' : tenant?.is_demo ? 'Demo workspace' : tenant ? 'Workspace' : 'Workspace'}</span>
              </div>

              <Link
                href="/"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-950 transition shadow-2xs"
                title="Go back to landing page"
              >
                <Home className="w-3.5 h-3.5 text-slate-500" />
                <span>Landing Page</span>
              </Link>

              <Link
                href="/consumer"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('astra_user_role', 'consumer');
                    localStorage.setItem('astra_intended_account_type', 'consumer');
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-950 transition shadow-2xs"
                title="Switch to Consumer Security Feed"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Consumer Feed</span>
              </Link>

              <Link href="/alerts" aria-label={sightingsUnavailable && sightings.length === 0 ? 'Open alert feed; alert count unavailable' : 'Open alert feed'} title={sightingsUnavailable && sightings.length === 0 ? 'Alert count unavailable' : 'Open alert feed'} className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950">
                <Bell className="h-4 w-4" />
                {!(sightingsUnavailable && sightings.length === 0) && unreadAlerts > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#eb5757] text-[8px] font-bold text-white">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
              </Link>

              {(isSignedIn || localUser) && <button type="button" onClick={handleLogout} aria-label="Sign out" title="Sign out" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 sm:hidden"><LogOut className="h-4 w-4" /></button>}
            </div>
          </header>
        )}

        <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(authData: AuthResponse) => {
            setTenant(authData.tenant);
            window.location.reload();
          }}
        />
        <main className={`astra-main min-h-0 flex-1 overflow-y-auto ${isStandalonePage ? 'w-full' : ''}`}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full min-h-full flex flex-col flex-1"
          >
            {children}
          </motion.div>
        </main>
        <GuidedTour />
        <TourLauncher />
      </div>
    </div>
  );
}
