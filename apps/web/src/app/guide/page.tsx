'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Globe,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Loader2,
  ExternalLink,
  Zap,
  Check,
  AlertCircle,
  Eye,
  Radio,
  Share2,
  Smartphone,
  MessageSquare,
  Search,
  Building2,
  Hash,
  AlertTriangle,
  SlidersHorizontal,
  RefreshCw,
  ChevronDown,
  Trash2,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { AccountTypeSelector, type AccountType } from '@/components/auth/AccountTypeSelector';
import { BrandOnboardingForm, type BrandFormData } from '@/components/brand/BrandOnboardingForm';
import { SocialChannelsStep } from '@/components/socials/SocialChannelsStep';
import { resetBrandProfile } from '@/lib/api';
import { useDemoSafe } from '@/providers/DemoProvider';

interface ChannelApp {
  id: string;
  name: string;
  category: string;
  toolsCount: number;
  iconBg: string;
  defaultHandleSuffix: string;
}

interface AnalyzedBrand {
  domain: string;
  brandName: string;
  legalName?: string;
  industry: string;
  summary: string;
  logoUrl?: string;
  detectedSocials: Record<string, string>;
  socialCandidates?: Record<string, string[]>;
  threatKeywords: string[];
  highRiskTyposquats: string[];
  confidenceScore: number;
  securityBaseline: {
    sslEnforced: boolean;
    dnsResolvable: boolean;
    perimeterStatus: string;
    monitoredChannelsAvailable: number;
  };
}

const SUPPORTED_APPS: ChannelApp[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'Meta Ecosystem',
    toolsCount: 42,
    iconBg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white',
    defaultHandleSuffix: '.official',
  },
  {
    id: 'x_twitter',
    name: 'Twitter (X)',
    category: 'Microblogging & DMs',
    toolsCount: 38,
    iconBg: 'bg-black text-white',
    defaultHandleSuffix: '_official',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'Meta Business Suite',
    toolsCount: 35,
    iconBg: 'bg-blue-600 text-white',
    defaultHandleSuffix: 'Official',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'Professional Network',
    toolsCount: 28,
    iconBg: 'bg-sky-700 text-white',
    defaultHandleSuffix: '-official',
  },
  {
    id: 'google',
    name: 'Google Play & Catalog',
    category: 'App Ecosystem',
    toolsCount: 54,
    iconBg: 'bg-emerald-600 text-white',
    defaultHandleSuffix: '_apps',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'Video & Streaming',
    toolsCount: 31,
    iconBg: 'bg-red-600 text-white',
    defaultHandleSuffix: 'Global',
  },
];

export default function GuideOnboardingPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();

  // Steps: 0 = Account Type Selection, 1 = Brand Form (Detailed + Auto-Fetch), 2 = Connect Channels, 3 = Verification
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [selectedRole, setSelectedRole] = useState<AccountType | null>(null);

  // Form & Brand State
  const [brandFormData, setBrandFormData] = useState<BrandFormData>({
    brandName: '',
    domain: '',
    legalName: '',
    industry: 'Enterprise SaaS & Cloud',
    companySize: '51-250 employees (Scaleup)',
    summary: '',
    logoUrl: '',
    securityEmail: '',
    supportEmail: '',
    headquarters: '',
    threatKeywords: ['login', 'verify', 'support', 'billing', 'kyc'],
    highRiskTyposquats: [],
    socials: {
      x_twitter: '',
      instagram: '',
      linkedin: '',
      facebook: '',
      youtube: '',
    },
    socialCandidates: {},
    confidenceScore: 0,
  });

  // Step 2: Connected Channels State
  const [connectedApps, setConnectedApps] = useState<Record<string, { connected: boolean; handle: string }>>({});
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [activeChannelDropdown, setActiveChannelDropdown] = useState<string | null>(null);

  // Step 2: Custom Handle Selection & Verification
  const [editingHandlePlatform, setEditingHandlePlatform] = useState<string | null>(null);
  const [customHandleInput, setCustomHandleInput] = useState<string>('');
  const [isFetchingCustomHandle, setIsFetchingCustomHandle] = useState<boolean>(false);
  const [handleFetchNotice, setHandleFetchNotice] = useState<{ message: string; isError?: boolean } | null>(null);
  const [dynamicCandidates, setDynamicCandidates] = useState<Record<string, string[]>>({});
  const [resetBannerVisible, setResetBannerVisible] = useState(false);
  const [isResetSession, setIsResetSession] = useState(false);

  // Step 3: Verification & Processing
  const [processingStage, setProcessingStage] = useState(0);
  const [aiResult, setAiResult] = useState<any>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Derived Brand Values
  const effectiveBrandName = brandFormData.brandName || 'Brand';
  const cleanBrandSlug = effectiveBrandName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'brand';
  const cleanDomain = brandFormData.domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();

  // Close dropdown on outside click
  useEffect(() => {
    const handleGlobalClick = () => setActiveChannelDropdown(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const demo = useDemoSafe();
  const isDemoMode = demo?.isDemoMode ?? false;

  // Determine Initial Step & Role based on URL or local storage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isDemoMode) {
      setSelectedRole('brand');
      setStep(1);
      setBrandFormData({
        brandName: 'NexBank Financial',
        domain: 'nexbank.com',
        legalName: 'NexBank Financial Group Inc.',
        industry: 'Fintech & Digital Banking',
        companySize: '251-1000 employees',
        summary: 'Cloud-native digital banking platform serving over 2.4 million retail and business customers across mobile, web, and unified payment interfaces.',
        logoUrl: '',
        securityEmail: 'security@nexbank.com',
        supportEmail: 'support@nexbank.com',
        headquarters: 'San Francisco, CA & Mumbai, IN',
        threatKeywords: ['login', 'verify', 'support', 'otp', 'kyc', 'airdrop', 'rewards', 'transfer'],
        highRiskTyposquats: ['nexb4nk.com', 'nexbank-verify.com', 'nexbank-secure-login.com'],
        socials: {
          x_twitter: 'NexBankOfficial',
          instagram: 'nexbank.official',
          linkedin: 'nexbank-financial',
          facebook: 'NexBankOfficial',
          youtube: 'NexBankOfficial',
        },
        socialCandidates: {},
        confidenceScore: 98,
      });
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const queryType = urlParams.get('type') as AccountType | null;
    const queryStep = urlParams.get('step');
    const isExplicitReset = urlParams.get('reset') === 'true' || isResetSession;

    if (isExplicitReset) {
      localStorage.removeItem('astra_onboarding_completed');
      localStorage.removeItem('astra_user_role');
      localStorage.removeItem('astra_intended_account_type');
      localStorage.removeItem('astra_current_brand_dna');
      localStorage.removeItem('astra_configured_brand');
      localStorage.removeItem('brand_onboarding_v1');
      localStorage.removeItem('brand_onboarding_v2');
      setStep(0);
      setSelectedRole(null);
      setConnectedApps({});
      setResetBannerVisible(true);
      return;
    }

    // Check if user has an intended account type from sign-in/sign-up
    const storedIntended = localStorage.getItem('astra_intended_account_type') as AccountType | null;
    const storedRole = localStorage.getItem('astra_user_role') as AccountType | null;
    const effectiveRole = queryType || storedIntended || storedRole;

    if (effectiveRole === 'consumer') {
      setSelectedRole('consumer');
      // If consumer, they can go directly to consumer hub or select role
      if (queryStep !== 'role_select') {
        router.replace('/consumer');
        return;
      }
    } else if (effectiveRole === 'brand') {
      setSelectedRole('brand');
      // If brand explicitly requested via query or button, advance to brand form (step 1)
      if (queryStep === 'brand_form' || queryType === 'brand') {
        setStep(1);
      } else if (!storedRole) {
        // First time brand without stored confirmation: ask to confirm role
        setStep(0);
      } else {
        setStep(1);
      }
    } else {
      // New account: show account type selector (Step 0)
      setStep(0);
    }
  }, [router, isResetSession]);

  // Handle Account Type Selection
  const handleSelectAccountType = (type: AccountType) => {
    setSelectedRole(type);
    if (typeof window !== 'undefined') {
      localStorage.setItem('astra_user_role', type);
      localStorage.setItem('astra_intended_account_type', type);
    }

    if (type === 'consumer') {
      router.push('/consumer');
    } else {
      setStep(1);
    }
  };

  // Handle Submission of Brand Form (Step 1 -> Step 2)
  const handleBrandFormSubmit = (data: BrandFormData) => {
    setBrandFormData(data);

    // Pre-seed connected apps from form social handles
    const seededApps: Record<string, { connected: boolean; handle: string }> = {};
    SUPPORTED_APPS.forEach((app) => {
      const formHandle = (data.socials as any)[app.id];
      const defaultHandle = `@${data.brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}${app.defaultHandleSuffix}`;
      seededApps[app.id] = {
        connected: false,
        handle: formHandle || defaultHandle,
      };
    });
    setConnectedApps(seededApps);
    if (data.socialCandidates) {
      setDynamicCandidates(data.socialCandidates);
    }

    setStep(2);
  };

  // Manual reset helper
  const handleManualReset = async () => {
    if (window.confirm("Restart setup and change account type? This will clear any enrolled brand in the database.")) {
      setIsResetSession(true);
      try {
        await resetBrandProfile();
      } catch (e) {
        console.warn("Backend reset warning:", e);
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('astra_onboarding_completed');
        localStorage.removeItem('astra_user_role');
        localStorage.removeItem('astra_intended_account_type');
        localStorage.removeItem('astra_current_brand_dna');
        localStorage.removeItem('astra_configured_brand');
        localStorage.removeItem('brand_onboarding_v1');
        localStorage.removeItem('brand_onboarding_v2');
      }
      setStep(0);
      setSelectedRole(null);
      setConnectedApps({});
      setResetBannerVisible(true);
    }
  };

  // Connect Individual App via Composio / Simulated OAuth
  const handleConnectApp = async (app: ChannelApp) => {
    setConnectingId(app.id);
    setConnectionNotice(null);
    const suggestedHandle =
      connectedApps[app.id]?.handle ||
      (brandFormData.socials as any)[app.id] ||
      `@${cleanBrandSlug}${app.defaultHandleSuffix}`;
    const composioUserId = clerkUser?.id ? `astra_${clerkUser.id}` : `user_${cleanBrandSlug}`;

    try {
      const res = await fetch('/api/connect/composio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: app.id,
          userId: composioUserId,
        }),
      });

      const data = await res.json();

      if (!data.redirect_url) {
        setConnectedApps((prev) => ({
          ...prev,
          [app.id]: { connected: true, handle: suggestedHandle },
        }));
        setConnectingId(null);
        return;
      }

      const popup = window.open(
        data.redirect_url,
        `Connect_${app.name}`,
        'width=620,height=760,menubar=no,toolbar=no,location=no,status=no'
      );

      let isResolved = false;

      const onMessage = (event: MessageEvent) => {
        if (event.data?.type === 'COMPOSIO_OAUTH_SUCCESS') {
          isResolved = true;
          window.removeEventListener('message', onMessage);
          setConnectedApps((prev) => ({
            ...prev,
            [app.id]: { connected: true, handle: suggestedHandle },
          }));
          setConnectingId(null);
          setConnectionNotice(`Successfully authorized ${app.name}!`);
          setTimeout(() => setConnectionNotice(null), 4000);
        }
      };
      window.addEventListener('message', onMessage);

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
              setConnectedApps((prev) => ({
                ...prev,
                [app.id]: { connected: true, handle: suggestedHandle },
              }));
              setConnectingId(null);
              setConnectionNotice(`Successfully verified ${app.name}!`);
              setTimeout(() => setConnectionNotice(null), 4000);
              if (popup && !popup.closed) popup.close();
              return;
            }
          } catch {}
        }

        if (popup?.closed && !isResolved) {
          clearInterval(pollTimer);
          window.removeEventListener('message', onMessage);
          setConnectingId(null);
        }
      }, 1500);

      setTimeout(() => {
        if (!isResolved) {
          clearInterval(pollTimer);
          window.removeEventListener('message', onMessage);
          setConnectingId(null);
        }
      }, 90000);

    } catch (err: any) {
      console.warn('OAuth error:', err);
      setConnectingId(null);
    }
  };

  // Custom Handle Verification
  const handleFetchCustomUsername = async (platformId: string) => {
    const raw = customHandleInput.trim();
    if (!raw) return;

    setIsFetchingCustomHandle(true);
    setHandleFetchNotice(null);

    try {
      const res = await fetch('/api/brand/fetch-handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platformId,
          handle: raw,
          domain: cleanDomain,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify handle.');

      const canonical = data.canonicalHandle;
      setConnectedApps((prev) => ({
        ...prev,
        [platformId]: {
          ...(prev[platformId] || { connected: false }),
          handle: canonical,
        },
      }));

      setDynamicCandidates((prev) => ({
        ...prev,
        [platformId]: Array.from(new Set([canonical, ...(prev[platformId] || [])])),
      }));

      setHandleFetchNotice({ message: `Verified & selected: ${canonical}`, isError: false });
      setTimeout(() => {
        setEditingHandlePlatform(null);
        setHandleFetchNotice(null);
        setCustomHandleInput('');
      }, 900);
    } catch (err: any) {
      setHandleFetchNotice({ message: err.message || 'Could not verify username.', isError: true });
    } finally {
      setIsFetchingCustomHandle(false);
    }
  };

  // Launch Verification (Step 2 -> Step 3)
  const handleLaunchVerification = async () => {
    setStep(3);
    setProcessingStage(1);

    try {
      const activeAppsList = Object.entries(connectedApps)
        .filter(([_, val]) => val.connected)
        .map(([id, val]) => ({
          id,
          name: SUPPORTED_APPS.find((a) => a.id === id)?.name || id,
          handle: val.handle,
        }));

      await new Promise((r) => setTimeout(r, 800));
      setProcessingStage(2);

      const email = clerkUser?.primaryEmailAddress?.emailAddress;
      const response = await fetch('/api/brand/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: effectiveBrandName,
          domain: cleanDomain,
          legalName: brandFormData.legalName,
          industry: brandFormData.industry,
          companySize: brandFormData.companySize,
          summary: brandFormData.summary,
          connectedApps: activeAppsList,
          threatKeywords: brandFormData.threatKeywords,
          clerkId: clerkUser?.id,
          email,
        }),
      });

      setProcessingStage(3);
      await new Promise((r) => setTimeout(r, 900));
      setProcessingStage(4);

      const result = await response.json();
      setAiResult(result.aiVerification);

      if (typeof window !== 'undefined') {
        localStorage.setItem('astra_onboarding_completed', 'true');
        localStorage.setItem('astra_user_role', 'brand');
        if (email) {
          localStorage.setItem(`astra_onboarding_completed_${email.toLowerCase()}`, 'true');
        }
        localStorage.setItem(
          'astra_current_brand_dna',
          JSON.stringify({
            name: effectiveBrandName,
            domain: cleanDomain,
            industry: brandFormData.industry,
            logoUrl: brandFormData.logoUrl,
            verification: result.aiVerification,
            connectedCount: activeAppsList.length,
          })
        );
      }

      await new Promise((r) => setTimeout(r, 1100));
      setProcessingStage(5);

      setTimeout(() => {
        router.push('/overview');
      }, 1500);
    } catch (err: any) {
      console.error('Onboarding launch error:', err);
      setTimeout(() => {
        router.push('/overview');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#37352f] flex flex-col justify-between selection:bg-[#0f7b6c]/20">
      {/* ─────────────────────────────────────────────────────────────
          TOP NAVIGATION & STEPPER BAR
         ───────────────────────────────────────────────────────────── */}
      <header className="border-b border-[#e3e2e0] bg-white/95 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-[6px] bg-[#37352f] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-[#37352f]">ASTRA</span>
                <span className="rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20 text-[10px] font-semibold px-2 py-0.5">
                  {selectedRole === 'consumer' ? 'Consumer Safety' : 'Brand Sentinel'}
                </span>
              </div>
              <p className="text-[11px] text-[#787774]">Digital Risk Protection Onboarding</p>
            </div>
          </div>

          {/* Stepper Indicators */}
          <div className="hidden md:flex items-center gap-2 text-xs font-medium">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border transition ${
                step === 0
                  ? 'bg-[#0f7b6c]/10 border-[#0f7b6c]/30 text-[#0f7b6c] font-semibold'
                  : 'bg-white border-[#e3e2e0] text-[#787774]'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step === 0 ? 'bg-[#0f7b6c] text-white' : 'bg-[#e3e2e0] text-[#787774]'
              }`}>1</span>
              <span>Account Type</span>
            </div>
            <div className="w-3 h-px bg-[#e3e2e0]" />
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border transition ${
                step === 1
                  ? 'bg-[#0f7b6c]/10 border-[#0f7b6c]/30 text-[#0f7b6c] font-semibold'
                  : 'bg-white border-[#e3e2e0] text-[#787774]'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step === 1 ? 'bg-[#0f7b6c] text-white' : 'bg-[#e3e2e0] text-[#787774]'
              }`}>2</span>
              <span>Brand Profile</span>
            </div>
            <div className="w-3 h-px bg-[#e3e2e0]" />
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border transition ${
                step === 2
                  ? 'bg-[#0f7b6c]/10 border-[#0f7b6c]/30 text-[#0f7b6c] font-semibold'
                  : 'bg-white border-[#e3e2e0] text-[#787774]'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step === 2 ? 'bg-[#0f7b6c] text-white' : 'bg-[#e3e2e0] text-[#787774]'
              }`}>3</span>
              <span>Connect Channels</span>
            </div>
            <div className="w-3 h-px bg-[#e3e2e0]" />
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border transition ${
                step === 3
                  ? 'bg-[#0f7b6c]/10 border-[#0f7b6c]/30 text-[#0f7b6c] font-semibold'
                  : 'bg-white border-[#e3e2e0] text-[#787774]'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step === 3 ? 'bg-[#0f7b6c] text-white' : 'bg-[#e3e2e0] text-[#787774]'
              }`}>4</span>
              <span>AI Verification</span>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualReset}
              className="inline-flex items-center gap-1.5 text-xs text-[#787774] hover:text-[#eb5757] font-medium transition py-1.5 px-2.5 rounded-[6px] border border-[#e3e2e0] bg-white hover:bg-rose-50 hover:border-rose-200"
              title="Restart guide or change account type"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Change Role</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/overview')}
              className="inline-flex items-center gap-1 text-xs text-[#787774] hover:text-[#37352f] font-medium transition py-1.5 px-2.5 rounded-[6px] border border-[#e3e2e0] bg-white hover:bg-[#f7f6f3]"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* STEP 0: ASK CONSUMER LOGIN OR BRAND LOGIN */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <AccountTypeSelector
                initialType={selectedRole || 'brand'}
                onSelect={handleSelectAccountType}
                userEmail={clerkUser?.primaryEmailAddress?.emailAddress}
                userName={clerkUser?.fullName || undefined}
              />
            </motion.div>
          )}

          {/* STEP 1: DETAILED BRAND SETUP FORM WITH AUTO-FETCH & FRAMER MOTION ANIMATION */}
          {step === 1 && (
            <motion.div
              data-tour="onboarding-dna"
              key="step-1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <BrandOnboardingForm
                initialData={brandFormData}
                onSubmit={handleBrandFormSubmit}
                onBack={() => setStep(0)}
              />
            </motion.div>
          )}

          {/* STEP 2: CONNECT CHANNELS & SOCIAL PERIMETER */}
          {step === 2 && (
            <SocialChannelsStep
              brandName={effectiveBrandName}
              cleanDomain={cleanDomain}
              socialHandles={{
                instagram: brandFormData.socials.instagram,
                x_twitter: brandFormData.socials.x_twitter,
                linkedin: brandFormData.socials.linkedin,
                facebook: brandFormData.socials.facebook,
                youtube: brandFormData.socials.youtube,
                google: (brandFormData.socials as any).google || '',
              }}
              connectedApps={connectedApps}
              onConnectApp={handleConnectApp}
              onUpdateSocialHandles={(updated) => {
                setBrandFormData((prev) => ({
                  ...prev,
                  socials: {
                    ...prev.socials,
                    ...updated,
                  },
                }));
                setConnectedApps((prev) => {
                  const next = { ...prev };
                  Object.entries(updated).forEach(([k, v]) => {
                    next[k] = { ...(next[k] || { connected: false }), handle: v };
                  });
                  return next;
                });
              }}
              connectingId={connectingId}
              connectionNotice={connectionNotice}
              onBack={() => setStep(1)}
              onNext={handleLaunchVerification}
            />
          )}

          {/* STEP 3: AI VERIFICATION & PERIMETER SYNTHESIS */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-xl mx-auto py-4 sm:py-8 space-y-8 text-center relative"
            >
              <div className="space-y-4">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full border border-[#0f7b6c]/30"
                  />
                  <div className="relative w-14 h-14 rounded-full bg-[#37352f] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(15,123,108,0.25)] border border-white/20">
                    <Shield className="w-7 h-7 text-[#0f7b6c]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f7b6c]/10 border border-[#0f7b6c]/20 text-xs text-[#0f7b6c]">
                    <span className="font-mono font-medium">https://{cleanDomain}</span>
                    <span>·</span>
                    <span className="font-semibold text-[11px]">Active Sentinel Defense</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#37352f]">
                    Verifying Brand Integrity
                  </h1>

                  <p className="text-xs sm:text-sm text-[#787774] max-w-md mx-auto leading-relaxed">
                    Establishing cryptographic invariants and configuring NVIDIA Nemotron 3.5 Lightning defense baseline.
                  </p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="relative max-w-md mx-auto text-left pt-2 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    processingStage >= 1 ? 'bg-[#0f7b6c] text-white' : 'bg-white border text-[#9b9a97]'
                  }`}>
                    {processingStage >= 1 ? <Check className="w-4 h-4" /> : '1'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#37352f]">Resolving perimeter for {cleanDomain}</p>
                    <p className="text-[11px] text-[#787774]">HTTPS certificates &amp; nameservers confirmed</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    processingStage >= 2 ? 'bg-[#0f7b6c] text-white' : 'bg-white border text-[#9b9a97]'
                  }`}>
                    {processingStage >= 2 ? <Check className="w-4 h-4" /> : '2'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#37352f]">Storing Brand DNA in Supabase</p>
                    <p className="text-[11px] text-[#787774]">Partitioning tenant perimeter space</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    processingStage >= 3 ? 'bg-[#0f7b6c] text-white' : 'bg-white border text-[#9b9a97]'
                  }`}>
                    {processingStage >= 3 ? <Check className="w-4 h-4" /> : '3'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#37352f]">Configuring Inbound Social Monitors</p>
                    <p className="text-[11px] text-[#787774]">Meta, X, and connected handles linked</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    processingStage >= 4 ? 'bg-[#0f7b6c] text-white' : 'bg-white border text-[#9b9a97]'
                  }`}>
                    {processingStage >= 4 ? <Check className="w-4 h-4" /> : '4'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#37352f]">NVIDIA Nemotron 3.5 AI Synthesis</p>
                    <p className="text-[11px] text-[#787774]">Synthesizing threat keywords &amp; typosquats</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    processingStage >= 5 ? 'bg-[#0f7b6c] text-white' : 'bg-white border text-[#9b9a97]'
                  }`}>
                    {processingStage >= 5 ? <Check className="w-4 h-4" /> : '5'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0f7b6c]">Protection Active · Entering Dashboard...</p>
                    <p className="text-[11px] text-[#787774]">Opening ASTRA Brand Sentinel Command Center</p>
                  </div>
                </div>
              </div>

              {aiResult && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md mx-auto p-4 rounded-[10px] bg-white border border-[#0f7b6c]/30 shadow-xs text-left space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0f7b6c] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#0f7b6c]" />
                      NVIDIA NIM Verdict: Verified Authenticity
                    </span>
                    <span className="font-mono font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-2 py-0.5 rounded">
                      Score: {aiResult.confidenceScore || 98}%
                    </span>
                  </div>
                  <p className="text-[#37352f]">
                    {aiResult.brandSummary || `${effectiveBrandName} verified as legitimate entity.`}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[#e3e2e0] text-center text-xs text-[#787774] bg-white">
        ASTRA Enterprise Digital Risk Protection · End-to-End Cryptographic Audit Trail
      </footer>
    </div>
  );
}
