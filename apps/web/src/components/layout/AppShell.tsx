'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  RotateCcw,
  User,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { UserButton, useAuth, useUser } from '@clerk/nextjs';
import { CommandPalette } from '@/components/CommandPalette';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  getActiveTenant,
  getActiveUser,
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

export function AppShell({ children }: AppShellProps) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  // Clerk authentication state
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  // Tenant context
  const [tenant, setTenant] = React.useState<TenantInfo | null>(null);

  const isStandalonePage = 
    pathname === '/' || 
    pathname.startsWith('/landing') || 
    pathname.startsWith('/sign-in') || 
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/guide');

  // Client-side authentication guard: enforce login on all protected dashboard routes
  React.useEffect(() => {
    if (isAuthLoaded && !isSignedIn && !isStandalonePage) {
      // Always redirect to /sign-in without a redirect_url so after login
      // Clerk routes to /guide (the forceRedirectUrl) instead of back here.
      window.location.href = '/sign-in';
    }
  }, [isAuthLoaded, isSignedIn, isStandalonePage]);

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
        .then((r) => r.json())
        .then((data) => {
          if (data.access_token) {
            setAuthToken(data.access_token);
            setActiveUser(data.user);
            setActiveTenant(data.tenant);
            setTenant(data.tenant);
            // Invalidate React Query cache so active components fetch fresh data for this tenant
            queryClient.invalidateQueries();
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
    } else if (isAuthLoaded && !isSignedIn) {
      clearSession();
      setTenant(null);
    } else {
      getMe().then((profile) => {
        if (profile) {
          setTenant(profile.tenant);
        }
      }).catch(() => {});
    }
  }, [isSignedIn, clerkUser, isAuthLoaded, pathname, isStandalonePage, queryClient]);

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

  const handleLogout = () => {
    logout();
    setTenant(null);
    window.location.reload();
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
        className={`group relative flex min-h-[36px] items-center gap-2.5 rounded-[6px] px-2.5 text-[13px] font-medium transition-colors ${
          active
            ? 'border border-[#e3e2e0] bg-[#f7f6f3] text-[#37352f] shadow-2xs font-semibold'
            : 'border border-transparent text-[#787774] hover:bg-[#f7f6f3] hover:text-[#37352f]'
        }`}
      >
        <Icon className={`h-[15px] w-[15px] shrink-0 ${active ? 'text-[#0f7b6c]' : 'text-[#9b9a97] group-hover:text-[#37352f]'}`} strokeWidth={1.8} />
        <span className="flex-1 truncate">{label}</span>
        {href === '/alerts' && unreadAlerts > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#eb5757] px-1 text-[9px] font-bold text-white">{unreadAlerts > 9 ? '9+' : unreadAlerts}</span>
        )}
        {active && <span className="h-1.5 w-1.5 rounded-full bg-[#0f7b6c]" />}
      </Link>
    );
  };

  if (isStandalonePage) {
    return <main className="min-h-screen w-full bg-[#f7f6f3] text-[#37352f]">{children}</main>;
  }

  return (
    <div className="astra-shell flex h-dvh min-h-[600px] w-full overflow-hidden text-[#37352f] bg-[#f7f6f3] font-sans">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-[#37352f]/30 backdrop-blur-xs md:hidden"
        />
      )}

      <aside className={`astra-sidebar fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-[#e3e2e0] bg-white transition-transform duration-200 md:static md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[56px] items-center gap-2.5 border-b border-[#e3e2e0] px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#37352f] text-white font-bold text-xs shadow-xs">
            A
          </div>
          <div className="min-w-0 flex-1 flex items-center gap-1.5">
            <span className="text-[13px] font-bold tracking-tight text-[#37352f]">ASTRA</span>
            <span className="text-[10px] text-[#9b9a97]">/</span>
            <span className="text-[11px] font-medium text-[#787774]">Defense</span>
          </div>
          <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" className="rounded-[4px] p-1 text-[#787774] hover:bg-[#f7f6f3] hover:text-[#37352f] md:hidden"><X className="h-4 w-4" /></button>
        </div>

        {/* Tenant Organization Card */}
        <div className="border-b border-[#e3e2e0] p-2.5">
          <div className="flex w-full items-center gap-2.5 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] px-2.5 py-2 text-left">
            <span className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[10px] font-bold bg-[#37352f] text-white">
              {orgInitials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-[#37352f]">
                {tenant?.name || 'ASTRA Enterprise'}
              </span>
              <span className="block text-[10px] text-[#9b9a97]">
                Protected Workspace
              </span>
            </span>
            <span className="rounded-[3px] border border-[#e3e2e0] bg-white px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#0f7b6c]">
              Live
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-3">
          <nav aria-label="Main navigation" className="space-y-4">
            {navigationGroups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#9b9a97]">{group.label}</p>
                <div className="space-y-0.5">{group.items.map(renderNavigationLink)}</div>
              </section>
            ))}
          </nav>
          <div className="my-3.5 h-px bg-[#e3e2e0]" />
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#9b9a97]">Workspace</p>
          <Link href="/guide" onClick={() => setMobileMenuOpen(false)} className={`group flex min-h-[36px] items-center gap-2.5 rounded-[6px] px-2.5 text-[13px] font-medium transition-colors ${pageRoot === 'guide' ? 'bg-[#f7f6f3] text-[#37352f] font-semibold border border-[#e3e2e0]' : 'text-[#787774] hover:bg-[#f7f6f3] hover:text-[#37352f]'}`}>
            <Sparkles className="h-[15px] w-[15px] text-[#0f7b6c]" strokeWidth={1.8} />Brand Setup Guide<ArrowUpRight className="ml-auto h-3 w-3 text-[#9b9a97]" />
          </Link>
          <button
            type="button"
            onClick={async () => {
              if (window.confirm("Restart the setup guide from Step 1? This will reset your brand setup progress.")) {
                try {
                  const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
                  await fetch('/api/brand/reset-guide', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, clerkId: clerkUser?.id }),
                  });
                } catch {}
                if (typeof window !== 'undefined') {
                  const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
                  localStorage.removeItem('astra_onboarding_completed');
                  if (email) {
                    localStorage.removeItem(`astra_onboarding_completed_${email}`);
                    localStorage.removeItem(`astra_current_brand_dna_${email}`);
                  }
                  localStorage.removeItem('astra_current_brand_dna');
                  localStorage.removeItem('astra_configured_brand');
                }
                window.location.href = '/guide?reset=true';
              }
            }}
            className="w-full group flex min-h-[36px] items-center gap-2.5 rounded-[6px] px-2.5 text-[13px] font-medium text-[#787774] hover:bg-[#f7f6f3] hover:text-[#eb5757] transition-colors text-left"
          >
            <RotateCcw className="h-[15px] w-[15px] text-[#9b9a97] group-hover:text-[#eb5757]" strokeWidth={1.8} />
            <span>Reset Setup Guide</span>
          </button>
          <Link href="/landing" onClick={() => setMobileMenuOpen(false)} className={`group flex min-h-[36px] items-center gap-2.5 rounded-[6px] px-2.5 text-[13px] font-medium transition-colors ${pageRoot === 'landing' ? 'bg-[#f7f6f3] text-[#37352f] font-semibold border border-[#e3e2e0]' : 'text-[#787774] hover:bg-[#f7f6f3] hover:text-[#37352f]'}`}>
            <BookOpen className="h-[15px] w-[15px] text-[#9b9a97] group-hover:text-[#37352f]" strokeWidth={1.8} />Product tour<ArrowUpRight className="ml-auto h-3 w-3 text-[#9b9a97]" />
          </Link>
        </div>

        {/* User Identity / Session Footer */}
        <div className="border-t border-[#e3e2e0] p-2.5">
          {isSignedIn && clerkUser ? (
            <div className="rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] p-2">
              <div className="flex items-center gap-2">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "h-7 w-7 rounded-[4px] border border-[#e3e2e0]"
                    }
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-[#37352f]">
                    {clerkUser.fullName || clerkUser.firstName || 'Security Operator'}
                  </div>
                  <div className="truncate text-[10px] text-[#9b9a97]">
                    {clerkUser.primaryEmailAddress?.emailAddress || 'Verified Identity'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] p-2">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="w-full py-1.5 px-2.5 rounded-[6px] bg-[#0f7b6c] hover:bg-[#0b5e52] text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In with Clerk
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="astra-topbar z-20 flex h-[56px] shrink-0 items-center justify-between gap-3 border-b border-[#e3e2e0] bg-white/95 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation" className="rounded-[5px] border border-[#e3e2e0] p-1.5 text-[#787774] hover:bg-[#f7f6f3] hover:text-[#37352f] md:hidden"><Menu className="h-4 w-4" /></button>
            <div className="hidden items-center gap-1.5 text-xs text-[#9b9a97] sm:flex">
              <span>{tenant?.name || 'Workspace'}</span>
              <span>/</span>
            </div>
            <h1 className="truncate text-sm font-semibold text-[#37352f]">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCommandPaletteOpen(true)} className="flex h-8 items-center gap-2 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] px-2.5 text-xs text-[#787774] transition hover:border-[#9b9a97] hover:bg-white hover:text-[#37352f] shadow-2xs" aria-label="Search cases, brands and indicators">
              <Search className="h-3.5 w-3.5 text-[#9b9a97]" /><span className="hidden lg:inline text-xs">Search cases &amp; brands</span><kbd className="hidden rounded-[3px] border border-[#e3e2e0] bg-white px-1.5 py-0.5 font-mono text-[9px] text-[#787774] sm:inline-flex shadow-2xs"><Command className="mr-0.5 h-2.5 w-2.5" />K</kbd>
            </button>
            
            {/* Live Workspace Status Pill */}
            <div className="hidden h-7 items-center gap-1.5 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] px-2 text-[10px] font-semibold text-[#37352f] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0f7b6c]" />
              <span className="tracking-wide">LIVE WORKSPACE</span>
            </div>

            <Link href="/alerts" aria-label="Open alert feed" title="Open alert feed" className="relative rounded-[6px] border border-[#e3e2e0] bg-white p-1.5 text-[#787774] transition hover:bg-[#f7f6f3] hover:text-[#37352f] shadow-2xs">
              <Bell className="h-4 w-4" />
              {unreadAlerts > 0 && (
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#eb5757] text-[8px] font-bold text-white">
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </span>
              )}
            </Link>

            {/* Clerk Authenticated Profile Control */}
            <div className="flex items-center pl-0.5">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7 rounded-[4px] border border-[#e3e2e0]"
                  }
                }}
              />
            </div>
          </div>
        </header>

        <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(authData: AuthResponse) => {
            setTenant(authData.tenant);
            window.location.reload();
          }}
        />
        <main className="astra-main min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
