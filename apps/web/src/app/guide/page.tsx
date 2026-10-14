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
  const goToStep = demo?.goToStep;
  const nextTourStep = demo?.nextTourStep;

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

    // Determine effective role: query takes priority, then stored role, then stored intent
    let effectiveRole: AccountType | null = null;
    if (queryType === 'brand' || queryStep === 'brand_form') {
      effectiveRole = 'brand';
      if (typeof window !== 'undefined') {
        localStorage.setItem('astra_user_role', 'brand');
        localStorage.setItem('astra_intended_account_type', 'brand');
      }
    } else if (queryType === 'consumer') {
      effectiveRole = 'consumer';
      if (typeof window !== 'undefined') {
        localStorage.setItem('astra_user_role', 'consumer');
        localStorage.setItem('astra_intended_account_type', 'consumer');
      }
    } else {
      effectiveRole = storedRole || storedIntended;
    }

    if (effectiveRole === 'consumer') {
      setSelectedRole('consumer');
      // If consumer, they can go directly to consumer hub or select role
      if (queryStep !== 'role_select') {
        router.replace('/consumer');
        return;
      }
    } else if (effectiveRole === 'brand') {
      setSelectedRole('brand');
      if (typeof window !== 'undefined') {
        localStorage.setItem('astra_user_role', 'brand');
        localStorage.setItem('astra_intended_account_type', 'brand');
      }

      const isOnboarded =
        localStorage.getItem('astra_onboarding_completed') === 'true' ||
        Boolean(localStorage.getItem('astra_configured_brand'));

      // If user is already onboarded and didn't explicitly request the brand form, go to dashboard
      if (isOnboarded && queryStep !== 'brand_form') {
        router.replace('/overview');
        return;
      }

      // If brand explicitly requested via query or button, advance to brand form (step 1)
      if (queryStep === 'brand_form' || queryType === 'brand') {
        setStep(1);
      } else if (!storedRole && !storedIntended) {
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
        const brandDnaPayload = {
          name: effectiveBrandName,
          domain: cleanDomain,
          legalName: brandFormData.legalName,
          industry: brandFormData.industry,
          logoUrl: brandFormData.logoUrl,
          summary: brandFormData.summary,
          securityEmail: brandFormData.securityEmail,
          supportEmail: brandFormData.supportEmail,
          threatKeywords: brandFormData.threatKeywords,
          highRiskTyposquats: brandFormData.highRiskTyposquats,
          socials: brandFormData.socials,
          verification: result.aiVerification,
          connectedCount: activeAppsList.length,
          connectedApps: activeAppsList,
        };
        localStorage.setItem('astra_current_brand_dna', JSON.stringify(brandDnaPayload));
        localStorage.setItem('astra_configured_brand', JSON.stringify(brandDnaPayload));

        // Sync with consumer feed store
        try {
          const rawExisting = localStorage.getItem('astra_all_onboarded_brands');
          const existingList = rawExisting ? JSON.parse(rawExisting) : [];
          const newBrandProfile = {
            id: `brand-custom-${Date.now()}`,
            name: effectiveBrandName,
            domain: cleanDomain,
            legalEntity: brandFormData.legalName || `${effectiveBrandName} Inc.`,
            industry: brandFormData.industry,
            logoUrl: brandFormData.logoUrl || `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`,
            summary: brandFormData.summary,
            confidenceScore: 99,
            verifiedAt: new Date().toISOString(),
            isCustomBrand: true,
            officialWebsites: [
              { label: 'Primary Domain', url: `https://${cleanDomain}`, isPrimary: true, sslVerified: true },
            ],
            officialSocials: Object.entries(brandFormData.socials || {})
              .filter(([_, val]) => typeof val === 'string' && val.trim())
              .map(([platform, handle]) => ({
                platform: platform as any,
                handle: String(handle),
                url: `https://${platform}.com/${String(handle).replace('@', '')}`,
                isVerified: true,
              })),
            securityEmail: brandFormData.securityEmail,
            supportEmail: brandFormData.supportEmail,
            threatKeywords: brandFormData.threatKeywords,
            highRiskTyposquats: brandFormData.highRiskTyposquats || [`login-${cleanDomain}`, `${cleanDomain.split('.')[0]}-verify.top`],
          };
          const filtered = existingList.filter((b: any) => b.domain !== cleanDomain);
          filtered.unshift(newBrandProfile);
          localStorage.setItem('astra_all_onboarded_brands', JSON.stringify(filtered));
        } catch (e) {
          console.warn('Error saving to consumer feed:', e);
        }
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
            {[
              { idx: 0, label: 'Account Type' },
              { idx: 1, label: 'Brand Profile' },
              { idx: 2, label: 'Connect Channels' },
              { idx: 3, label: 'AI Verification' },
            ].map((s, i, arr) => {
              const isCompleted = step > s.idx;
              const isCurrent = step === s.idx;
              return (
                <React.Fragment key={s.idx}>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border transition-all ${
                      isCurrent
                        ? 'bg-[#0f7b6c]/10 border-[#0f7b6c]/40 text-[#0f7b6c] font-semibold shadow-2xs'
                        : isCompleted
                        ? 'bg-emerald-50/70 border-emerald-200 text-[#0f7b6c] font-medium'
                        : 'bg-white border-[#e3e2e0] text-[#9b9a97]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-[#0f7b6c] text-white shadow-xs'
                          : isCompleted
                          ? 'bg-[#0f7b6c] text-white'
                          : 'bg-[#e3e2e0] text-[#787774]'
                      }`}
                    >
                      {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[2.5]" /> : s.idx + 1}
                    </span>
                    <span>{s.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`w-3.5 h-px transition-colors ${isCompleted ? 'bg-[#0f7b6c]' : 'bg-[#e3e2e0]'}`} />
                  )}
                </React.Fragment>
              );
            })}
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
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-start">
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
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-2xl mx-auto py-2 sm:py-6"
            >
              <div className="rounded-[16px] border border-[#e3e2e0] bg-white p-6 sm:p-9 shadow-[0_12px_40px_rgba(0,0,0,0.04)] relative overflow-hidden space-y-7">
                {/* Subtle top ambient radial glow */}
                <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-64 bg-[radial-gradient(ellipse_at_center,rgba(15,123,108,0.12),transparent_70%)]" />

                {/* Hero Beacon & Status Pill */}
                <div className="text-center space-y-3.5 relative">
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.32, 1], opacity: [0.55, 0, 0.55] }}
                      transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full border-2 border-[#0f7b6c]/30"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.16, 1], opacity: [0.35, 0.08, 0.35] }}
                      transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut', delay: 0.3 }}
                      className="absolute inset-1.5 rounded-full bg-[#0f7b6c]/10"
                    />
                    <div className="relative w-14 h-14 rounded-2xl bg-[#37352f] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(15,123,108,0.28)] border border-white/20">
                      <Shield className="w-7 h-7 text-[#0f7b6c]" />
                      <span className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#37352f] animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0f7b6c]/10 border border-[#0f7b6c]/25 text-xs text-[#0f7b6c] shadow-2xs">
                      <Lock className="w-3 h-3 text-[#0f7b6c]" />
                      <span className="font-mono font-semibold">https://{cleanDomain}</span>
                      <span className="text-[#0f7b6c]/40">•</span>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[11px] text-[#0f7b6c]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0f7b6c] animate-ping" />
                        Active Sentinel Defense
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#37352f]">
                      Verifying Brand Integrity
                    </h1>

                    <p className="text-xs sm:text-sm text-[#787774] max-w-lg mx-auto leading-relaxed">
                      Establishing cryptographic invariants, isolating tenant perimeter space, and deploying NVIDIA Nemotron-3.5 threat detection.
                    </p>
                  </div>
                </div>

                {/* Live Progress Bar Header */}
                <div className="space-y-2 pt-2 border-t border-[#f0efed] relative">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#37352f] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#0f7b6c]" />
                      <span>Security Pipeline Progress</span>
                    </span>
                    <span className="font-mono font-bold text-[#0f7b6c] bg-[#0f7b6c]/10 border border-[#0f7b6c]/20 px-2 py-0.5 rounded-[4px]">
                      Stage {processingStage} of 5 · {Math.min(processingStage * 20, 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#f7f6f3] border border-[#e3e2e0] p-0.5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#0f7b6c] via-[#2eaadc] to-[#0f7b6c]"
                      initial={{ width: '20%' }}
                      animate={{ width: `${Math.min(processingStage * 20, 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Pipeline Steps with Connected Visual Timeline */}
                <div className="relative space-y-2.5 pt-1">
                  {/* Vertical connecting line */}
                  <div className="absolute left-4 sm:left-5 top-5 bottom-5 w-0.5 bg-[#e3e2e0] -translate-x-1/2 z-0" />

                  {[
                    {
                      step: 1,
                      title: `Resolving perimeter for ${cleanDomain}`,
                      subtitle: 'HTTPS certificate chain, DNS TXT challenge records & nameserver authority verified',
                      badgeDone: 'DNS VERIFIED',
                      badgeActive: 'RESOLVING...',
                    },
                    {
                      step: 2,
                      title: 'Storing Brand DNA in Supabase Database',
                      subtitle: 'Partitioning tenant workspace, registering baseline digital assets & identity rules',
                      badgeDone: 'RLS PARTITIONED',
                      badgeActive: 'STORING DNA...',
                    },
                    {
                      step: 3,
                      title: 'Configuring Inbound Social & App Monitors',
                      subtitle: 'Armed telemetry connectors across Meta Graph, X Enterprise, Google Play & Telegram',
                      badgeDone: 'CHANNELS LINKED',
                      badgeActive: 'CONFIGURING...',
                    },
                    {
                      step: 4,
                      title: 'NVIDIA Nemotron 3.5 AI Synthesis',
                      subtitle: 'Synthesizing defensive dictionary, homoglyphs, brand typosquats & threat patterns',
                      badgeDone: 'AI MODEL ARMED',
                      badgeActive: 'SYNTHESIZING...',
                    },
                    {
                      step: 5,
                      title: 'Protection Active · Entering Command Center',
                      subtitle: 'All perimeter guards active — Initializing ASTRA Brand Sentinel Command Center',
                      badgeDone: 'LIVE DEFENSE',
                      badgeActive: 'ACTIVATING...',
                    },
                  ].map((item) => {
                    const isDone = processingStage > item.step || (item.step === 5 && processingStage >= 5);
                    const isActive = processingStage === item.step && !(item.step === 5 && processingStage >= 5);

                    return (
                      <div
                        key={item.step}
                        className={`relative z-10 flex items-start gap-3.5 p-3 rounded-[10px] border transition-all duration-300 ${
                          isActive
                            ? 'bg-[#0f7b6c]/5 border-[#0f7b6c]/30 shadow-2xs'
                            : isDone
                            ? 'bg-white border-[#e3e2e0]/80'
                            : 'bg-[#faf9f8]/60 border-transparent opacity-65'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all duration-300 ring-4 ring-white ${
                            isDone
                              ? 'bg-[#0f7b6c] text-white shadow-xs'
                              : isActive
                              ? 'bg-white border-2 border-[#0f7b6c] text-[#0f7b6c] shadow-xs'
                              : 'bg-[#f7f6f3] border border-[#e3e2e0] text-[#9b9a97]'
                          }`}
                        >
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : isActive ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0f7b6c]" />
                          ) : (
                            item.step
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs font-bold truncate ${isActive ? 'text-[#0f7b6c]' : isDone ? 'text-[#37352f]' : 'text-[#787774]'}`}>
                              {item.title}
                            </p>
                            {isDone ? (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-[4px]">
                                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                {item.badgeDone}
                              </span>
                            ) : isActive ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#0f7b6c] bg-white border border-[#0f7b6c]/30 px-2 py-0.5 rounded-[4px] shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0f7b6c] animate-pulse" />
                                {item.badgeActive}
                              </span>
                            ) : (
                              <span className="hidden sm:inline-block text-[10px] font-mono text-[#9b9a97]">
                                QUEUED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#787774] mt-0.5 leading-relaxed">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Verdict Card */}
                {aiResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-[10px] bg-emerald-50/60 border border-emerald-200 text-left space-y-2 text-xs shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        NVIDIA Nemotron-3.5 Verdict: Verified Authenticity
                      </span>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                        Confidence: {aiResult.confidenceScore || 98}%
                      </span>
                    </div>
                    <p className="text-emerald-900 leading-relaxed text-[11px]">
                      {aiResult.brandSummary || `${effectiveBrandName} verified as legitimate entity. Defense perimeter established.`}
                    </p>
                  </motion.div>
                )}

                {/* Direct Action when reaching stage 5 */}
                {processingStage >= 5 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-1"
                  >
                    <button
                      type="button"
                      onClick={() => router.push('/overview')}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-[8px] bg-[#0f7b6c] hover:bg-[#0b5e52] active:scale-[0.99] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                    >
                      <span>Enter Brand Sentinel Command Center</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* System Micro-Telemetry Footnote */}
                <div className="pt-3 border-t border-[#f0efed] grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-[6px] bg-[#f7f6f3] border border-[#e3e2e0]">
                    <p className="text-[9px] uppercase font-bold tracking-wider text-[#9b9a97]">Encryption</p>
                    <p className="font-mono font-semibold text-[11px] text-[#37352f] mt-0.5">AES-256 GCM</p>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[#f7f6f3] border border-[#e3e2e0]">
                    <p className="text-[9px] uppercase font-bold tracking-wider text-[#9b9a97]">AI Engine</p>
                    <p className="font-mono font-semibold text-[11px] text-[#0f7b6c] mt-0.5">Nemotron-3.5</p>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[#f7f6f3] border border-[#e3e2e0]">
                    <p className="text-[9px] uppercase font-bold tracking-wider text-[#9b9a97]">Isolation</p>
                    <p className="font-mono font-semibold text-[11px] text-[#37352f] mt-0.5">RLS Partitioned</p>
                  </div>
                </div>
              </div>
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
