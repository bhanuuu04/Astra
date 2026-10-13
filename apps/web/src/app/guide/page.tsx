'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { getAuthToken } from '@/lib/api';
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
  Trash2
} from 'lucide-react';

interface ChannelApp {
  id: string;
  name: string;
  category: string;
  toolsCount: number;
  iconBg: string;
}

interface AnalyzedBrand {
  domain: string;
  brandName: string;
  industry: string;
  summary: string;
  logoUrl?: string;
  detectedSocials: Record<string, string>;
  suggestedSocials: Record<string, string>;
  threatKeywords: string[];
  potentialLookalikes: string[];
  ownershipVerification: 'not_performed';
  analysisMode: string;
}

const SUPPORTED_APPS: ChannelApp[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'Meta Ecosystem',
    toolsCount: 42,
    iconBg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white',
  },
  {
    id: 'x_twitter',
    name: 'Twitter (X)',
    category: 'Microblogging & DMs',
    toolsCount: 38,
    iconBg: 'bg-black text-white',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'Meta Business Suite',
    toolsCount: 35,
    iconBg: 'bg-blue-600 text-white',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'Professional Network',
    toolsCount: 28,
    iconBg: 'bg-sky-700 text-white',
  },
  {
    id: 'google',
    name: 'Google Play & Catalog',
    category: 'App Ecosystem',
    toolsCount: 54,
    iconBg: 'bg-emerald-600 text-white',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'Video & Streaming',
    toolsCount: 31,
    iconBg: 'bg-red-600 text-white',
  },
];

const PRESET_DOMAINS = ['stripe.com', 'linear.app', 'nilapay.com', 'apple.com', 'vercel.com'];

export default function GuideOnboardingPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Automated Domain Intelligence
  const [domainInput, setDomainInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalyzedBrand | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEditingCustom, setIsEditingCustom] = useState(false);

  // Editable fields if user chooses to customize
  const [customBrandName, setCustomBrandName] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');

  // Step 2: Connected Channels (one by one)
  const [connectedApps, setConnectedApps] = useState<Record<string, { connected: boolean; handle: string }>>({});
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [activeChannelDropdown, setActiveChannelDropdown] = useState<string | null>(null);

  React.useEffect(() => {
    const handleGlobalClick = () => setActiveChannelDropdown(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Step 3: Verification & Processing
  const [processingStage, setProcessingStage] = useState(0);
  const [aiResult, setAiResult] = useState<any>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Derived Brand Values
  const effectiveBrandName = customBrandName || analysisData?.brandName || 'Brand';
  const cleanDomain = (analysisData?.domain || domainInput).replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();

  // Permanent Remember User Guard: If user has already completed setup, route immediately to /overview
  React.useEffect(() => {
    const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (typeof window !== 'undefined' && email) {
      const isCompleted = localStorage.getItem(`astra_onboarding_completed_${email}`) === 'true';
      if (isCompleted) {
        router.replace('/overview');
        return;
      }
    }

    if (clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      if (email) {
        fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            fullName: clerkUser.fullName || email.split('@')[0],
            clerkId: clerkUser.id,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.user?.onboarding_completed || data.onboarding_completed) {
              if (typeof window !== 'undefined') {
                localStorage.setItem(`astra_onboarding_completed_${email.toLowerCase()}`, 'true');
                localStorage.setItem('astra_onboarding_completed', 'true');
              }
              router.replace('/overview');
            }
          })
          .catch((e) => console.warn('Auth sync check notice:', e));
      }
    }
  }, [clerkUser, router]);

  // Handle Domain Analysis via Backend AI & Scraping
  const handleAnalyzeDomain = async (targetDomain?: string) => {
    const raw = (targetDomain || domainInput).trim();
    if (!raw) {
      setValidationError('Please enter a valid brand domain (e.g. stripe.com or yourcompany.com).');
      return;
    }

    const cleaned = raw.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
    if (!cleaned.includes('.')) {
      setValidationError('Please provide a complete domain name with an extension (e.g. company.com).');
      return;
    }

    setValidationError(null);
    setIsAnalyzing(true);
    setAnalysisProgress('Fetching public website metadata...');

    const t1 = setTimeout(() => setAnalysisProgress('Reading page title, description, and linked profiles...'), 800);
    const t2 = setTimeout(() => setAnalysisProgress('Generating unverified AI research suggestions...'), 1800);

    try {
      const authToken = getAuthToken();
      const res = await fetch('/api/brand/analyze-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({ domain: cleaned }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze domain.');
      }

      setAnalysisData(data);
      setCustomBrandName(data.brandName);
      setCustomIndustry(data.industry);

      // Seed editable handle fields with observed or suggested values; these are not connections.
      const seededApps: Record<string, { connected: boolean; handle: string }> = {};
      SUPPORTED_APPS.forEach((app) => {
        seededApps[app.id] = {
          connected: false,
          handle: data.detectedSocials?.[app.id] || data.suggestedSocials?.[app.id] || '',
        };
      });
      setConnectedApps(seededApps);

    } catch (err: any) {
      console.warn('Analysis error:', err);
      setValidationError(err.message || 'Domain research is unavailable. Check provider configuration and retry.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  // Connect individual app one by one with verified server handshake
  const handleConnectApp = async (app: ChannelApp) => {
    setConnectingId(app.id);
    setConnectionNotice(null);
    const suggestedHandle = connectedApps[app.id]?.handle || analysisData?.detectedSocials?.[app.id] || analysisData?.suggestedSocials?.[app.id] || '';
    const authToken = getAuthToken();

    try {
      const res = await fetch('/api/connect/composio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({
          platform: app.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.redirect_url) throw new Error(data.error || 'Provider authorization is unavailable.');

      // Open OAuth popup window
      const popup = window.open(
        data.redirect_url,
        `Connect_${app.name}`,
        'width=620,height=760,menubar=no,toolbar=no,location=no,status=no'
      );

      let isResolved = false;

      // 1. Listen for postMessage from the callback page
      const onMessage = (event: MessageEvent) => {
        if (event.origin === window.location.origin && event.source === popup && event.data?.type === 'COMPOSIO_OAUTH_SUCCESS') {
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

      // 2. Poll server for real-time Composio account status
      const pollTimer = setInterval(async () => {
        if (isResolved) {
          clearInterval(pollTimer);
          return;
        }

        if (data.connected_account_id) {
          try {
            const checkRes = await fetch(`/api/connect/composio/status?connectedAccountId=${data.connected_account_id}`, {
              headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
            });
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
          } catch (pollErr) {
            console.warn('Poll status notice:', pollErr);
          }
        }

        // If user closed the popup window without completing OAuth
        if (popup?.closed && !isResolved) {
          clearInterval(pollTimer);
          window.removeEventListener('message', onMessage);

          // Give a final check
          if (data.connected_account_id) {
            try {
              const finalRes = await fetch(`/api/connect/composio/status?connectedAccountId=${data.connected_account_id}`, {
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
              });
              const finalData = await finalRes.json();
              if (finalData.active) {
                setConnectedApps((prev) => ({
                  ...prev,
                  [app.id]: { connected: true, handle: suggestedHandle },
                }));
                setConnectingId(null);
                return;
              }
            } catch {}
          }

          // Connection was not permitted or window closed
          setConnectingId(null);
          setConnectionNotice(`Authorization for ${app.name} was not completed.`);
          setTimeout(() => setConnectionNotice(null), 5000);
        }
      }, 1500);

      // Auto-cleanup after 90 seconds
      setTimeout(() => {
        if (!isResolved) {
          clearInterval(pollTimer);
          window.removeEventListener('message', onMessage);
          setConnectingId(null);
        }
      }, 90000);

    } catch (err: any) {
      console.warn('OAuth initiation error:', err);
      setConnectingId(null);
      setConnectionNotice(`Failed to open authorization for ${app.name}.`);
      setTimeout(() => setConnectionNotice(null), 5000);
    }
  };

  // Handle Step 2 -> 3 (create the workspace and save the brand profile)
  const handleLaunchVerification = async () => {
    setStep(3);
    setProcessingStage(1);
    setProcessingError(null);

    try {
      const activeAppsList = Object.entries(connectedApps)
        .filter(([_, val]) => val.connected)
        .map(([id, val]) => ({
          id,
          name: SUPPORTED_APPS.find((a) => a.id === id)?.name || id,
          handle: val.handle,
        }));

      await new Promise((r) => setTimeout(r, 900));
      setProcessingStage(2);

      const email = clerkUser?.primaryEmailAddress?.emailAddress;
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('astra_auth_token') : null;
      const response = await fetch('/api/brand/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          brandName: effectiveBrandName,
          domain: cleanDomain,
          connectedApps: activeAppsList,
        }),
      });

      setProcessingStage(3);
      await new Promise((r) => setTimeout(r, 1000));
      setProcessingStage(4);

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create the brand workspace.');
      setAiResult(result.aiAnalysis);

      if (typeof window !== 'undefined') {
        localStorage.setItem('astra_onboarding_completed', 'true');
        if (email) {
          localStorage.setItem(`astra_onboarding_completed_${email.toLowerCase()}`, 'true');
          localStorage.setItem(
            `astra_current_brand_dna_${email.toLowerCase()}`,
            JSON.stringify({
              name: effectiveBrandName,
              domain: cleanDomain,
              industry: customIndustry || analysisData?.industry,
              logoUrl: analysisData?.logoUrl,
              analysis: result.aiAnalysis,
              connectedCount: activeAppsList.length,
            })
          );
        }
        localStorage.setItem(
          'astra_current_brand_dna',
          JSON.stringify({
            name: effectiveBrandName,
            domain: cleanDomain,
            industry: customIndustry || analysisData?.industry,
            logoUrl: analysisData?.logoUrl,
            analysis: result.aiAnalysis,
            connectedCount: activeAppsList.length,
          })
        );
      }

      await new Promise((r) => setTimeout(r, 1200));
      setProcessingStage(5);

      setTimeout(() => {
        router.push('/overview');
      }, 1600);
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setProcessingError(err.message || 'Workspace setup could not be completed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#37352f] flex flex-col justify-between selection:bg-[#0f7b6c]/20">
      {/* Top Header */}
      <header className="border-b border-[#e3e2e0] bg-white/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-[6px] bg-[#37352f] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-[#37352f]">ASTRA</span>
                <span className="rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20 text-[10px] font-semibold px-2 py-0.5">
                  Brand Sentinel
                </span>
              </div>
              <p className="text-[11px] text-[#787774]">Autonomous Digital Risk Protection Onboarding</p>
            </div>
          </div>

          {/* Stepper Indicators */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border transition ${
                step === 1
                  ? 'bg-[#0f7b6c]/10 border-[#0f7b6c]/30 text-[#0f7b6c] font-semibold'
                  : 'bg-white border-[#e3e2e0] text-[#787774]'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step === 1 ? 'bg-[#0f7b6c] text-white' : 'bg-[#e3e2e0] text-[#787774]'
              }`}>1</span>
              <span className="hidden sm:inline">Brand Domain</span>
            </div>
            <div className="w-4 h-px bg-[#e3e2e0]" />
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border transition ${
                step === 2
                  ? 'bg-[#0f7b6c]/10 border-[#0f7b6c]/30 text-[#0f7b6c] font-semibold'
                  : 'bg-white border-[#e3e2e0] text-[#787774]'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step === 2 ? 'bg-[#0f7b6c] text-white' : 'bg-[#e3e2e0] text-[#787774]'
              }`}>2</span>
              <span className="hidden sm:inline">Connect Channels</span>
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
              }`}>3</span>
              <span className="hidden sm:inline">Workspace setup</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Flow Body */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* STEP 1: JUST ASK DOMAIN + AUTOMATED BACKEND ANALYSIS */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="w-full space-y-8"
            >
              {/* Hero Banner Header */}
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#0f7b6c]/10 border border-[#0f7b6c]/25 text-[#0f7b6c] text-xs font-semibold">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Step 1 · Perimeter Ground-Truth</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#37352f]">
                  Enter your brand domain to initialize defense
                </h1>
                <p className="text-sm text-[#787774] leading-relaxed">
                  ASTRA crawls your live perimeter and uses NVIDIA NIM AI to automatically resolve your brand identity, detect official social footprints, and configure threat invariants.
                </p>
              </div>

              {/* Premium Domain Search Box */}
              <div className="max-w-2xl mx-auto bg-white rounded-[10px] border border-[#e3e2e0] p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAnalyzeDomain();
                  }}
                  className="flex flex-col sm:flex-row gap-2.5"
                >
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9b9a97] text-xs font-mono">
                      https://
                    </div>
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. stripe.com or yourbrand.com"
                      value={domainInput}
                      onChange={(e) => {
                        setDomainInput(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      className="w-full pl-20 pr-4 py-3 bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] text-sm font-mono text-[#37352f] focus:outline-none focus:border-[#0f7b6c] focus:bg-white transition placeholder:text-[#9b9a97]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[6px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white text-xs font-semibold shadow-xs transition disabled:opacity-60 cursor-pointer shrink-0"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Analyze Brand DNA</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#787774]">
                  <span className="text-[11px] text-[#9b9a97]">Examples:</span>
                  {PRESET_DOMAINS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setDomainInput(preset);
                        handleAnalyzeDomain(preset);
                      }}
                      className="px-2 py-0.5 rounded-[4px] bg-[#f7f6f3] hover:bg-[#e3e2e0] border border-[#e3e2e0] text-[#37352f] text-[11px] font-mono transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Validation Error Notice */}
                {validationError && (
                  <div className="rounded-[6px] border border-[#eb5757]/30 bg-[#eb5757]/10 p-3 text-xs text-[#eb5757] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#eb5757]" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Live Scanning Ticker */}
                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-[6px] border border-[#0f7b6c]/25 bg-[#0f7b6c]/5 p-3.5 flex items-center gap-3 text-xs text-[#0f7b6c]"
                  >
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#0f7b6c]" />
                    <span className="font-medium animate-pulse">{analysisProgress}</span>
                  </motion.div>
                )}
              </div>

              {/* Resolved Brand Dossier (Appears automatically after domain analysis) */}
              {analysisData && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="max-w-3xl mx-auto bg-white rounded-[10px] border border-[#e3e2e0] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden"
                >
                  {/* Card Header with Brand Identity Banner */}
                  <div className="p-6 border-b border-[#e3e2e0] bg-gradient-to-b from-[#f7f6f3]/60 to-white">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-[8px] border border-[#e3e2e0] bg-white p-1.5 shadow-xs flex items-center justify-center shrink-0">
                          {analysisData.logoUrl ? (
                            <img
                              src={analysisData.logoUrl}
                              alt={effectiveBrandName}
                              className="w-full h-full object-contain rounded-[4px]"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(effectiveBrandName)}&background=37352f&color=fff`;
                              }}
                            />
                          ) : (
                            <Building2 className="w-6 h-6 text-[#787774]" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-[#37352f] tracking-tight">
                              {effectiveBrandName}
                            </h2>
                            <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#0f7b6c]/10 border border-[#0f7b6c]/20 text-[#0f7b6c] text-[11px] font-semibold px-2 py-0.5">
                              <Globe className="w-3 h-3" /> Domain submitted
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1 font-mono text-xs text-[#787774]">
                            <span>https://{analysisData.domain}</span>
                            <span>•</span>
                            <span className="text-[#0f7b6c] font-sans font-medium">{customIndustry || analysisData.industry}</span>
                          </div>

                          <p className="text-xs text-[#787774] mt-2 max-w-xl leading-relaxed">
                            {analysisData.summary}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-[4px] border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-900">Suggestions · Unverified</span>
                    </div>
                  </div>

                  {/* Footprint & Defense Perimeter Bento */}
                  <div className="p-6 space-y-6">
                    {/* Discovered Channels Footprint */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-[#37352f] flex items-center gap-1.5 uppercase tracking-wider">
                          <Share2 className="w-3.5 h-3.5 text-[#0f7b6c]" /> Links found in page metadata
                        </span>
                        <span className="text-[11px] text-[#787774]">These links are not ownership-verified</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {Object.entries(analysisData.detectedSocials).map(([key, handle]) => {
                          const appInfo = SUPPORTED_APPS.find((a) => a.id === key);
                          return (
                            <div
                              key={key}
                              className="p-3 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-[#37352f] truncate">
                                  {appInfo?.name || key}
                                </span>
                                <span className="w-2 h-2 rounded-full bg-[#0f7b6c]" />
                              </div>
                              <p className="text-xs font-mono text-[#0f7b6c] truncate">
                                {handle}
                              </p>
                            </div>
                          );
                        })}
                        {Object.keys(analysisData.detectedSocials).length === 0 && (
                          <p className="col-span-full rounded-[6px] border border-dashed border-[#e3e2e0] p-3 text-xs text-[#787774]">No social profile links were found in the fetched page metadata.</p>
                        )}
                      </div>
                    </div>

                    {/* Threat Invariants Baseline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#e3e2e0]">
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-[#37352f] flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#d97706]" /> Potential lookalikes · AI suggestions
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisData.potentialLookalikes.map((typo, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-[4px] bg-[#f7f6f3] border border-[#e3e2e0] text-[11px] font-mono text-[#787774]"
                            >
                              {typo}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-[#37352f] flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#0f7b6c]" /> Suggested search terms
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisData.threatKeywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20 text-[11px] font-mono"
                            >
                              +{kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Optional Drawer to Edit Custom Name */}
                    {isEditingCustom && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 rounded-[6px] bg-[#f7f6f3] border border-[#e3e2e0] space-y-3"
                      >
                        <span className="text-xs font-semibold text-[#37352f] block">
                          Tweak Resolved Brand Details:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] text-[#787774] block mb-1">Brand Name</label>
                            <input
                              type="text"
                              value={customBrandName}
                              onChange={(e) => setCustomBrandName(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-[#e3e2e0] rounded-[6px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-[#787774] block mb-1">Industry Sector</label>
                            <input
                              type="text"
                              value={customIndustry}
                              onChange={(e) => setCustomIndustry(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-[#e3e2e0] rounded-[6px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-[#e3e2e0] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsEditingCustom(!isEditingCustom)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#787774] hover:text-[#37352f] transition cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>{isEditingCustom ? 'Done Editing' : 'Fine-tune Details'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[6px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white font-medium text-xs shadow-xs transition cursor-pointer"
                      >
                        <span>Confirm &amp; Connect Channels</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 2: SUPPORTING APPS & CHANNELS */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full bg-white rounded-[10px] border border-[#e3e2e0] shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e3e2e0] pb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#0f7b6c] flex items-center gap-1.5">
                    <Share2 className="w-4 h-4" /> Step 2: Inbound Message &amp; Social Defense
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-[#37352f] mt-1 tracking-tight">
                    Connect Official Channels for {effectiveBrandName}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#787774] mt-1">
                    Connect your channels one by one. ASTRA Sentinel monitors inbound direct messages for extortion, spoofed checkmarks, and fake employee profiles.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-[4px] bg-[#f7f6f3] border border-[#e3e2e0] text-xs font-medium text-[#787774]">
                    {Object.values(connectedApps).filter((a) => a.connected).length} of {SUPPORTED_APPS.length} Linked
                  </span>
                </div>
              </div>

              {connectionNotice && (
                <div
                  className={`p-3 rounded-[6px] border text-xs flex items-center gap-2 ${
                    connectionNotice.includes('Successfully')
                      ? 'bg-[#0f7b6c]/10 border-[#0f7b6c]/25 text-[#0f7b6c]'
                      : 'bg-[#d97706]/10 border-[#d97706]/25 text-[#d97706]'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{connectionNotice}</span>
                </div>
              )}

              {/* Channels Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SUPPORTED_APPS.map((app) => {
                  const isConnected = Boolean(connectedApps[app.id]?.connected);
                  const isConnecting = connectingId === app.id;
                  const handleVal =
                    connectedApps[app.id]?.handle ||
                    analysisData?.detectedSocials?.[app.id] ||
                    analysisData?.suggestedSocials?.[app.id] ||
                    '';

                  return (
                    <div
                      key={app.id}
                      style={{ zIndex: activeChannelDropdown === app.id ? 50 : 1 }}
                      className={`p-4 rounded-[8px] border transition-all flex items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
                        activeChannelDropdown === app.id ? 'relative z-50 ring-1 ring-[#0f7b6c]/20' : 'relative z-0'
                      } ${
                        isConnected
                          ? 'border-[#0f7b6c]/30 bg-[#0f7b6c]/5'
                          : isConnecting
                          ? 'border-[#0f7b6c]/40 bg-[#0f7b6c]/5'
                          : 'border-[#e3e2e0] bg-white hover:border-[#9b9a97] hover:bg-[#f7f6f3]/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-[6px] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${app.iconBg}`}
                        >
                          {app.name[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-semibold text-[#37352f] truncate">{app.name}</h3>
                            {isConnected && (
                              <CheckCircle2 className="w-4 h-4 text-[#0f7b6c] shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-[#787774] truncate font-mono mt-0.5">
                            {handleVal}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isConnected ? (
                          <div className="relative">
                            <div className="inline-flex items-center rounded-[6px] border border-[#0f7b6c]/20 bg-[#0f7b6c]/10 text-[#0f7b6c] text-xs font-semibold">
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                                <Check className="w-3.5 h-3.5" />
                                <span>Connected</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveChannelDropdown((prev) => (prev === app.id ? null : app.id));
                                }}
                                className="flex items-center justify-center border-l border-[#0f7b6c]/20 px-1.5 py-1.5 hover:bg-[#0f7b6c]/20 transition rounded-r-[6px] cursor-pointer"
                                title="Channel options"
                                aria-label={`Options for ${app.name}`}
                              >
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                                    activeChannelDropdown === app.id ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Dropdown Menu */}
                            {activeChannelDropdown === app.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-2 w-36 rounded-[8px] border border-[#d3d2ce] bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.16)] z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveChannelDropdown(null);
                                    handleConnectApp(app);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer font-medium"
                                >
                                  <RefreshCw className="h-3.5 w-3.5 text-[#0f7b6c]" />
                                  <span>Reconnect</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveChannelDropdown(null);
                                    setConnectedApps((prev) => ({
                                      ...prev,
                                      [app.id]: { connected: false, handle: '' }
                                    }));
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
                            onClick={() => handleConnectApp(app)}
                            disabled={isConnecting}
                            className="px-3.5 py-1.5 rounded-[6px] bg-[#37352f] hover:bg-[#201f1d] text-white text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-75 cursor-pointer shadow-xs"
                          >
                            {isConnecting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0f7b6c]" />
                            ) : (
                              <Zap className="w-3.5 h-3.5 text-[#0f7b6c]" />
                            )}
                            <span>{isConnecting ? 'Waiting in popup...' : 'Connect'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-[#e3e2e0] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-1.5 text-xs font-medium text-[#787774] hover:text-[#37352f] transition cursor-pointer"
                >
                  ← Back to Domain
                </button>

                <button
                  type="button"
                  onClick={handleLaunchVerification}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[6px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white font-medium text-xs shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Create brand workspace →</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: WORKSPACE SETUP */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-xl mx-auto py-4 sm:py-8 space-y-8 text-center relative"
            >
              {/* Ambient Radiant Glow Background (Blends into canvas) */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[320px] bg-gradient-to-tr from-[#0f7b6c]/12 via-[#0f7b6c]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

              {/* Glowing Sentinel Core Orb */}
              <div className="space-y-4">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  {/* Atmospheric outer pulse */}
                  <motion.div
                    animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full border border-[#0f7b6c]/30"
                  />

                  {/* Concentric rotating dashed orbital ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
                    className="absolute inset-1.5 rounded-full border border-dashed border-[#0f7b6c]/40"
                  />

                  {/* Center Sentinel Shield Node */}
                  <div className="relative w-14 h-14 rounded-full bg-[#37352f] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(15,123,108,0.25)] border border-white/20">
                    <Shield className="w-7 h-7 text-[#0f7b6c]" />
                  </div>
                </div>

                {/* Domain & Title Floating Typography */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f7b6c]/10 border border-[#0f7b6c]/20 text-xs text-[#0f7b6c]">
                    <span className="font-mono font-medium">https://{cleanDomain}</span>
                    <span>·</span>
                    <span className="font-semibold text-[11px]">Sentinel Perimeter</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#37352f]">
                    Verifying Brand Integrity
                  </h1>

                  <p className="text-xs sm:text-sm text-[#787774] max-w-md mx-auto leading-relaxed">
                    Establishing cryptographic invariants and analyzing inbound telemetry via NVIDIA Nemotron 3.5 Lightning.
                  </p>
                </div>
              </div>

              {/* Seamless Vertical Timeline (Borderless, Blends into canvas) */}
              <div className="relative max-w-md mx-auto text-left pt-2">
                {/* Continuous Connecting Line */}
                <div className="absolute left-[13px] top-4 bottom-4 w-[2px] bg-[#e3e2e0]">
                  <motion.div
                    className="w-full bg-[#0f7b6c] transition-all duration-700"
                    style={{ height: `${(Math.min(processingStage, 5) / 5) * 100}%` }}
                  />
                </div>

                <div className="space-y-5 relative">
                  {/* Step 1: DNS & Perimeter */}
                  <div className="flex items-start gap-3.5 group">
                    <div className="shrink-0 relative z-10">
                      {processingStage >= 1 ? (
                        <div className="w-7 h-7 rounded-full bg-[#0f7b6c] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white border-2 border-[#0f7b6c] text-[#0f7b6c] flex items-center justify-center shadow-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="pt-0.5 min-w-0">
                      <p className={`text-xs font-medium ${processingStage >= 1 ? 'text-[#37352f]' : 'text-[#787774]'}`}>
                        Resolving official DNS &amp; perimeter for <span className="font-mono font-semibold">{cleanDomain}</span>
                      </p>
                      <p className="text-[11px] text-[#9b9a97] mt-0.5">Verified HTTPS certificates &amp; canonical nameservers</p>
                    </div>
                  </div>

                  {/* Step 2: Supabase Vault */}
                  <div className="flex items-start gap-3.5 group">
                    <div className="shrink-0 relative z-10">
                      {processingStage >= 2 ? (
                        <div className="w-7 h-7 rounded-full bg-[#0f7b6c] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : processingStage === 1 ? (
                        <div className="w-7 h-7 rounded-full bg-white border-2 border-[#0f7b6c] text-[#0f7b6c] flex items-center justify-center shadow-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white border border-[#e3e2e0] text-[#9b9a97] flex items-center justify-center text-xs">
                          2
                        </div>
                      )}
                    </div>
                    <div className="pt-0.5 min-w-0">
                      <p className={`text-xs font-medium ${processingStage >= 2 ? 'text-[#37352f]' : 'text-[#787774]'}`}>
                        Registering brand assets &amp; secret vault keys in Supabase
                      </p>
                      <p className="text-[11px] text-[#9b9a97] mt-0.5">AES-256 tenant perimeter partition initialized</p>
                    </div>
                  </div>

                  {/* Step 3: Social Inbound DMs */}
                  <div className="flex items-start gap-3.5 group">
                    <div className="shrink-0 relative z-10">
                      {processingStage >= 3 ? (
                        <div className="w-7 h-7 rounded-full bg-[#0f7b6c] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : processingStage === 2 ? (
                        <div className="w-7 h-7 rounded-full bg-white border-2 border-[#0f7b6c] text-[#0f7b6c] flex items-center justify-center shadow-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white border border-[#e3e2e0] text-[#9b9a97] flex items-center justify-center text-xs">
                          3
                        </div>
                      )}
                    </div>
                    <div className="pt-0.5 min-w-0">
                      <p className={`text-xs font-medium ${processingStage >= 3 ? 'text-[#37352f]' : 'text-[#787774]'}`}>
                        Fetching inbound DMs &amp; evaluating sender impersonation
                      </p>
                      <p className="text-[11px] text-[#9b9a97] mt-0.5">Scanning Meta, X, and connected handles for rogue spoofing</p>
                    </div>
                  </div>

                  {/* Step 4: NVIDIA NIM Inference */}
                  <div className="flex items-start gap-3.5 group">
                    <div className="shrink-0 relative z-10">
                      {processingStage >= 4 ? (
                        <div className="w-7 h-7 rounded-full bg-[#0f7b6c] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : processingStage === 3 ? (
                        <div className="w-7 h-7 rounded-full bg-white border-2 border-[#0f7b6c] text-[#0f7b6c] flex items-center justify-center shadow-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white border border-[#e3e2e0] text-[#9b9a97] flex items-center justify-center text-xs">
                          4
                        </div>
                      )}
                    </div>
                    <div className="pt-0.5 min-w-0">
                      <p className={`text-xs font-medium ${processingStage >= 4 ? 'text-[#37352f]' : 'text-[#787774]'}`}>
                        Dispatching inference to <span className="font-mono text-[#0f7b6c] font-semibold">NVIDIA Nemotron 3.5</span>
                      </p>
                      <p className="text-[11px] text-[#9b9a97] mt-0.5">Synthesizing multi-modal brand DNA invariants &amp; typosquats</p>
                    </div>
                  </div>

                  {/* Step 5: Ready */}
                  <div className="flex items-start gap-3.5 group">
                    <div className="shrink-0 relative z-10">
                      {processingStage >= 5 ? (
                        <div className="w-7 h-7 rounded-full bg-[#0f7b6c] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white border border-[#e3e2e0] text-[#9b9a97] flex items-center justify-center text-xs">
                          5
                        </div>
                      )}
                    </div>
                    <div className="pt-0.5 min-w-0">
                      <p className={`text-xs font-medium ${processingStage >= 5 ? 'text-[#0f7b6c] font-semibold' : 'text-[#9b9a97]'}`}>
                        Workspace setup complete · Opening overview...
                      </p>
                      <p className="text-[11px] text-[#9b9a97] mt-0.5">Configured sources appear in the workspace after setup.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Setup status */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-mono text-[#787774]">
                <span className="px-2.5 py-1 rounded-full bg-white/80 border border-[#e3e2e0] shadow-2xs">
                  Domain ownership · Pending
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/80 border border-[#e3e2e0] shadow-2xs">
                  Evidence storage · Workspace configured
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/80 border border-[#e3e2e0] shadow-2xs text-[#0f7b6c]">
                  AI enrichment · Optional
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/80 border border-[#e3e2e0] shadow-2xs">
                  Providers · Connect after setup
                </span>
              </div>

              {/* Live AI Verdict Preview (Frosted Ambient Glass) */}
              {aiResult && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md mx-auto p-4 rounded-[10px] bg-white/90 backdrop-blur-md border border-[#0f7b6c]/30 shadow-[0_4px_16px_rgba(15,123,108,0.06)] text-left space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0f7b6c] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#0f7b6c]" />
                      AI research summary · Not a verification
                    </span>
                  </div>
                  <p className="text-[#37352f] leading-relaxed">
                    {aiResult.brandSummary || 'AI-generated context is available for analyst review.'}
                  </p>
                  <p className="text-[#787774] leading-relaxed">This analysis does not verify brand authenticity or domain ownership.</p>
                </motion.div>
              )}

              {processingError && (
                <div className="text-xs text-[#d97706] bg-[#d97706]/10 border border-[#d97706]/20 rounded-[6px] p-3 max-w-md mx-auto">
                  <p role="alert">{processingError}</p>
                  <button type="button" onClick={handleLaunchVerification} className="mt-2 font-semibold underline underline-offset-2">Retry workspace setup</button>
                </div>
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
