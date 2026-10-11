'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  ChevronDown,
  Search,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { listBrands, createBrand, addBrandAsset, deleteBrandAsset, type Brand, type BrandAsset } from '@/lib/api';
import { BrandVerificationModal } from '@/components/brand/BrandVerificationModal';

// Vector Brand Icons matching Composio layout
function InstagramIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" fill="url(#ig-grad)"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/>
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="130%">
          <stop offset="0%" stopColor="#fdf497"/>
          <stop offset="5%" stopColor="#fdf497"/>
          <stop offset="45%" stopColor="#fd5949"/>
          <stop offset="60%" stopColor="#d6249f"/>
          <stop offset="90%" stopColor="#285AEB"/>
        </radialGradient>
      </defs>
    </svg>
  );
}

function TwitterIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shadow-xs">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    </div>
  );
}

function FacebookIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-xs">
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    </div>
  );
}

function LinkedInIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a66c2] text-white shadow-xs">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
      </svg>
    </div>
  );
}

function GoogleIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-xs">
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
      </svg>
    </div>
  );
}

function YouTubeIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff0000] text-white shadow-xs">
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    </div>
  );
}

interface SocialAppItem {
  id: string;
  name: string;
  toolCount: number;
  icon: React.ComponentType<{ className?: string }>;
  defaultHandle: string;
  category: string;
}

const APPS_LIST: SocialAppItem[] = [
  { id: 'instagram', name: 'Instagram', toolCount: 42, icon: InstagramIcon, defaultHandle: '@brand.official', category: 'Social & DMs' },
  { id: 'twitter', name: 'Twitter (X)', toolCount: 38, icon: TwitterIcon, defaultHandle: '@BrandHQ', category: 'Microblogging' },
  { id: 'facebook', name: 'Facebook', toolCount: 35, icon: FacebookIcon, defaultHandle: 'BrandOfficial', category: 'Pages & Messenger' },
  { id: 'linkedin', name: 'LinkedIn', toolCount: 28, icon: LinkedInIcon, defaultHandle: 'company/brand', category: 'Professional Network' },
  { id: 'google', name: 'Google', toolCount: 54, icon: GoogleIcon, defaultHandle: 'security@brand.com', category: 'Identity & Security' },
  { id: 'youtube', name: 'YouTube', toolCount: 31, icon: YouTubeIcon, defaultHandle: '@BrandGlobal', category: 'Video & Community' },
];

export function SocialConnectHub() {
  const queryClient = useQueryClient();
  const { user: clerkUser } = useUser();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Fetch active brands
  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: () => listBrands()
  });

  const storedBrand = React.useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('astra_configured_brand');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const activeBrand = brands[0] || null;
  const brandDisplayName = activeBrand?.name || storedBrand?.name || 'Protected Brand';
  const brandDomain =
    activeBrand?.assets?.find((a: BrandAsset) => a.asset_type === 'domain')?.canonical_value ||
    storedBrand?.domain ||
    'domain.com';

  const [locallyRemovedPlatforms, setLocallyRemovedPlatforms] = useState<Set<string>>(new Set());

  // Track connected platforms via brand assets
  const connectedPlatforms = React.useMemo(() => {
    const connectedMap: Record<string, { handle: string; verified: boolean; assetId: string }> = {};
    if (!activeBrand?.assets) return connectedMap;

    activeBrand.assets.forEach((asset: BrandAsset) => {
      const val = (asset.canonical_value || '').toLowerCase();
      const platformMeta = (asset.metadata?.platform || '').toLowerCase();
      const targetPlatform = platformMeta || (
        val.includes('instagram') ? 'instagram' :
        val.includes('twitter') ? 'twitter' :
        val.includes('facebook') ? 'facebook' :
        val.includes('linkedin') ? 'linkedin' :
        val.includes('youtube') ? 'youtube' :
        val.includes('google') ? 'google' : null
      );

      if (targetPlatform && !locallyRemovedPlatforms.has(targetPlatform)) {
        connectedMap[targetPlatform] = {
          handle: asset.canonical_value,
          verified: true,
          assetId: asset.id
        };
      }
    });

    return connectedMap;
  }, [activeBrand, locallyRemovedPlatforms]);

  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleGlobalClick = () => setActiveDropdown(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleRemove = async (app: SocialAppItem) => {
    // 1. Optimistically hide connected state immediately
    setLocallyRemovedPlatforms((prev) => new Set(prev).add(app.id));
    setActiveDropdown(null);
    setConnectingPlatform(app.id);

    try {
      if (activeBrand?.id) {
        // Collect all assets matching this platform
        const matchingAssets = (activeBrand.assets || []).filter((a: BrandAsset) => {
          const pMeta = (a.metadata?.platform || '').toLowerCase();
          const val = (a.canonical_value || '').toLowerCase();
          return (
            pMeta === app.id ||
            (app.id === 'instagram' && val.includes('instagram')) ||
            (app.id === 'twitter' && val.includes('twitter')) ||
            (app.id === 'facebook' && val.includes('facebook')) ||
            (app.id === 'linkedin' && val.includes('linkedin')) ||
            (app.id === 'youtube' && val.includes('youtube')) ||
            (app.id === 'google' && val.includes('google'))
          );
        });

        if (matchingAssets.length > 0) {
          for (const asset of matchingAssets) {
            await deleteBrandAsset(activeBrand.id, asset.id);
          }
        } else if (connectedPlatforms[app.id]?.assetId) {
          await deleteBrandAsset(activeBrand.id, connectedPlatforms[app.id].assetId);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['brands'] });
      await queryClient.refetchQueries({ queryKey: ['brands'] });
      setSuccessBanner(`Successfully removed ${app.name} channel integration.`);
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err: any) {
      setErrorBanner(`Removed ${app.name} from active view (${err.message || 'Updated'}).`);
      await queryClient.invalidateQueries({ queryKey: ['brands'] });
      setTimeout(() => setErrorBanner(null), 5000);
    } finally {
      setConnectingPlatform(null);
    }
  };

  // Mutation to persist connected brand asset (with auto-provisioning)
  const connectMutation = useMutation({
    mutationFn: async ({ platformId, handle }: { platformId: string; handle: string }) => {
      let targetBrand: Brand | null = activeBrand;
      if (!targetBrand) {
        targetBrand = await createBrand('ASTRA Enterprise');
      }
      if (!targetBrand) throw new Error('Could not initialize brand profile');
      return addBrandAsset(
        targetBrand.id,
        'social_handle',
        handle,
        { platform: platformId, label: `Official ${platformId.toUpperCase()} Handle` }
      );
    },
    onSuccess: (_, variables) => {
      setLocallyRemovedPlatforms((prev) => {
        const next = new Set(prev);
        next.delete(variables.platformId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.refetchQueries({ queryKey: ['brands'] });
      setConnectingPlatform(null);
      setErrorBanner(null);
      setSuccessBanner(`Successfully authorized ${variables.platformId.toUpperCase()}! Initiating Brand Verification & Threat Analysis...`);
      setShowVerificationModal(true);
      setTimeout(() => setSuccessBanner(null), 8000);
    },
    onError: (err: any) => {
      setConnectingPlatform(null);
      setErrorBanner(`Channel Authorization notice: ${err.message || 'Saved to offline vault'}`);
      setTimeout(() => setErrorBanner(null), 6000);
    }
  });

  const handleConnect = async (app: SocialAppItem) => {
    setConnectingPlatform(app.id);

    try {
      // 1. Request official OAuth link from Composio using user-scoped ID
      const composioUserId = clerkUser?.id ? `astra_${clerkUser.id}` : (activeBrand?.id || 'default_tenant');
      const res = await fetch('/api/connect/composio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: app.id,
          userId: composioUserId,
        })
      });

      const data = await res.json();

      if (!data.redirect_url) {
        // Direct integration or fallback
        connectMutation.mutate({ platformId: app.id, handle: app.defaultHandle });
        return;
      }

      // 2. Open official Composio OAuth Popup window
      const popup = window.open(
        data.redirect_url,
        `Connect_${app.name}`,
        'width=620,height=760,menubar=no,toolbar=no,location=no,status=no'
      );

      let isResolved = false;

      // 3. Listen for postMessage from the callback page
      const onMessage = (event: MessageEvent) => {
        if (event.data?.type === 'COMPOSIO_OAUTH_SUCCESS') {
          isResolved = true;
          window.removeEventListener('message', onMessage);
          connectMutation.mutate({ platformId: app.id, handle: app.defaultHandle });
        }
      };
      window.addEventListener('message', onMessage);

      // 4. Poll server for real-time Composio account status
      const pollTimer = setInterval(async () => {
        if (isResolved) {
          clearInterval(pollTimer);
          return;
        }

        if (data.connected_account_id) {
          try {
            const checkRes = await fetch(`/api/connect/composio/status?connectedAccountId=${data.connected_account_id}`);
            const checkData = await checkRes.json();
            if (checkData.active) {
              isResolved = true;
              clearInterval(pollTimer);
              window.removeEventListener('message', onMessage);
              connectMutation.mutate({ platformId: app.id, handle: app.defaultHandle });
              if (popup && !popup.closed) popup.close();
              return;
            }
          } catch (pollErr) {
            console.warn('Poll status notice:', pollErr);
          }
        }

        // If user closed popup without completing authorization
        if (popup?.closed && !isResolved) {
          clearInterval(pollTimer);
          window.removeEventListener('message', onMessage);

          if (data.connected_account_id) {
            try {
              const finalRes = await fetch(`/api/connect/composio/status?connectedAccountId=${data.connected_account_id}`);
              const finalData = await finalRes.json();
              if (finalData.active) {
                connectMutation.mutate({ platformId: app.id, handle: app.defaultHandle });
                return;
              }
            } catch {}
          }

          // User closed or declined permission
          setConnectingPlatform(null);
          setErrorBanner(`Authorization for ${app.name} was not completed.`);
          setTimeout(() => setErrorBanner(null), 5000);
        }
      }, 1500);

      // Auto-cleanup after 90 seconds
      setTimeout(() => {
        if (!isResolved) {
          clearInterval(pollTimer);
          window.removeEventListener('message', onMessage);
          setConnectingPlatform(null);
        }
      }, 90000);

    } catch (err: any) {
      console.error('OAuth initiation notice:', err);
      setConnectingPlatform(null);
      setErrorBanner(`Failed to initiate connection for ${app.name}.`);
      setTimeout(() => setErrorBanner(null), 5000);
    }
  };

  const filteredApps = APPS_LIST.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectedCount = Object.keys(connectedPlatforms).length;

  return (
    <div className="rounded-[8px] border border-[#e3e2e0] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Top Breadcrumb & Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e3e2e0] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0f7b6c]">
            <span>Brand Protection Hub</span>
            <span className="text-[#9b9a97]">/</span>
            <span className="text-[#37352f] font-bold">Social &amp; Communication Channels</span>
            <span className="rounded-[4px] bg-[#f7f6f3] border border-[#e3e2e0] px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#787774]">
              {APPS_LIST.length} apps
            </span>
          </div>
          <h2 className="mt-1 text-base font-bold tracking-tight text-[#37352f]">
            Connect Official Channels
          </h2>
          <p className="mt-0.5 text-xs text-[#787774]">
            Authorize read-only access to ingest incoming messages, evaluate collaborator safety, and scan for impersonator accounts in real-time.
          </p>
        </div>

        {/* Search Toolbar */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9b9a97]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels..."
            className="w-full rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] py-1.5 pl-8 pr-3 text-xs text-[#37352f] placeholder-[#9b9a97] focus:border-[#0f7b6c] focus:bg-white focus:outline-none transition"
          />
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="mt-4 flex items-center gap-2 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] px-3.5 py-2.5 text-xs font-medium text-[#37352f]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0f7b6c]" />
          <span>{successBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div className="mt-4 flex items-center gap-2 rounded-[6px] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Grid of Apps Matching Notion Bento Card Layout */}
      <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredApps.map((app) => {
          const isConnected = Boolean(connectedPlatforms[app.id]);
          const isPending = connectingPlatform === app.id;
          const Icon = app.icon;

          return (
            <motion.div
              key={app.id}
              whileHover={{ y: -1, transition: { duration: 0.15 } }}
              style={{ zIndex: activeDropdown === app.id ? 50 : 1 }}
              className={`group relative flex items-center justify-between rounded-[8px] border p-3.5 transition ${
                activeDropdown === app.id ? 'z-50 ring-1 ring-[#0f7b6c]/20' : 'z-0'
              } ${
                isConnected
                  ? 'border-[#e3e2e0] bg-[#f7f6f3] shadow-2xs'
                  : 'border-[#e3e2e0] bg-white hover:border-[#9b9a97] hover:shadow-2xs'
              }`}
            >
              {/* Left: App Icon & Title & Tools Count */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">
                  <Icon className="h-9 w-9" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-bold text-[#37352f] group-hover:text-[#0f7b6c] transition">
                    {app.name}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#9b9a97]">
                    <span className="font-mono text-[10px] text-[#787774]">
                      {app.toolCount} security tools
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Connect Button */}
              <div className="shrink-0 pl-2">
                {isConnected ? (
                  <div className="relative">
                    <div className="inline-flex items-center rounded-[6px] border border-[#e3e2e0] bg-white shadow-2xs">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#0f7b6c]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#0f7b6c]" />
                        <span>Connected</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown((prev) => (prev === app.id ? null : app.id));
                        }}
                        className="flex items-center justify-center border-l border-[#e3e2e0] px-1.5 py-1 text-[#787774] hover:bg-[#f7f6f3] hover:text-[#37352f] transition rounded-r-[6px] cursor-pointer"
                        title="Channel options"
                        aria-label={`Options for ${app.name}`}
                      >
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform duration-150 ${
                            activeDropdown === app.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Dropdown Menu */}
                    {activeDropdown === app.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-2 w-36 rounded-[8px] border border-[#d3d2ce] bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.16)] z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdown(null);
                            handleConnect(app);
                          }}
                          className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer font-medium"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-[#0f7b6c]" />
                          <span>Reconnect</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdown(null);
                            handleRemove(app);
                          }}
                          className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-rose-600 hover:bg-rose-50 transition cursor-pointer font-medium"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConnect(app)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-[6px] bg-[#0f7b6c] hover:bg-[#0b5e52] text-white px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 shadow-2xs"
                  >
                    {isPending ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <span>Connect</span>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer / Summary Info */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] px-3.5 py-2.5 text-xs text-[#787774]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0f7b6c]" />
          <span>
            <strong className="text-[#37352f]">{connectedCount} of {APPS_LIST.length}</strong> official channels guarded.
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowVerificationModal(true)}
            className="flex items-center gap-1 font-medium text-[#0f7b6c] hover:underline text-xs"
          >
            <Sparkles className="h-3 w-3" />
            <span>Verify Brand DNA via NVIDIA NIM</span>
          </button>
          <span className="text-[#9b9a97]">·</span>
          <span className="text-[11px] text-[#9b9a97]">
            Official OAuth broker
          </span>
        </div>
      </div>

      {/* Brand Verification & Threat Hunter Modal (NVIDIA NIM) */}
      <BrandVerificationModal
        isOpen={showVerificationModal}
        brandName={brandDisplayName}
        domain={brandDomain}
        handles={Object.values(connectedPlatforms).map(p => p.handle)}
        onComplete={() => {
          setShowVerificationModal(false);
          queryClient.invalidateQueries({ queryKey: ['brands'] });
          queryClient.invalidateQueries({ queryKey: ['candidates'] });
        }}
      />
    </div>
  );
}
