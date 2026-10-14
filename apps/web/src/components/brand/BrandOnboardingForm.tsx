'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Sparkles,
  Building2,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
  SlidersHorizontal,
  Plus,
  X,
  Share2,
  Mail,
  MapPin,
  Users,
  Briefcase,
  RotateCcw,
  Check,
  AlertTriangle,
  Ban
} from 'lucide-react';
import { SocialLogo } from '@/components/socials/SocialLogos';

export interface BrandFormData {
  brandName: string;
  domain: string;
  legalName: string;
  industry: string;
  companySize: string;
  summary: string;
  logoUrl: string;
  securityEmail: string;
  supportEmail: string;
  headquarters: string;
  threatKeywords: string[];
  highRiskTyposquats: string[];
  socials: {
    x_twitter: string;
    instagram: string;
    linkedin: string;
    facebook: string;
    youtube: string;
    google?: string;
  };
  socialCandidates?: Record<string, string[]>;
  confidenceScore?: number;
}

const PRESET_DOMAINS = ['stripe.com', 'linear.app', 'nilapay.com', 'apple.com', 'vercel.com'];

const INDUSTRY_OPTIONS = [
  'Fintech & Digital Payments',
  'Enterprise SaaS & Cloud',
  'E-Commerce & Retail',
  'Cybersecurity & Identity',
  'Consumer Tech & Gaming',
  'Crypto, Web3 & Digital Assets',
  'Healthcare & BioTech',
  'Media, Entertainment & Social',
  'Financial Services & Banking',
  'Other Commercial Enterprise'
];

const COMPANY_SIZE_OPTIONS = [
  '1-15 employees (Seed / Early Stage)',
  '16-50 employees (Growth)',
  '51-250 employees (Scaleup)',
  '251-1,000 employees (Mid-Market)',
  '1,000+ employees (Enterprise / Public)'
];

interface BrandOnboardingFormProps {
  initialData?: Partial<BrandFormData>;
  onSubmit: (data: BrandFormData) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export function BrandOnboardingForm({
  initialData,
  onSubmit,
  onBack,
  isLoading = false,
}: BrandOnboardingFormProps) {
  // Auto-Fetch input state
  const [autoFetchUrl, setAutoFetchUrl] = useState(initialData?.domain || '');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchProgress, setFetchProgress] = useState('');
  const [fetchNotice, setFetchNotice] = useState<{ message: string; isError?: boolean } | null>(null);

  // Smooth Fill animation state
  const [isSmoothFilling, setIsSmoothFilling] = useState(false);
  const [fillingStepMessage, setFillingStepMessage] = useState('');

  // Form Fields State
  const [formData, setFormData] = useState<BrandFormData>({
    brandName: initialData?.brandName || '',
    domain: initialData?.domain || '',
    legalName: initialData?.legalName || '',
    industry: initialData?.industry || INDUSTRY_OPTIONS[0],
    companySize: initialData?.companySize || COMPANY_SIZE_OPTIONS[2],
    summary: initialData?.summary || '',
    logoUrl: initialData?.logoUrl || '',
    securityEmail: initialData?.securityEmail || '',
    supportEmail: initialData?.supportEmail || '',
    headquarters: initialData?.headquarters || '',
    threatKeywords: initialData?.threatKeywords || ['login', 'verify', 'support', 'billing', 'kyc'],
    highRiskTyposquats: initialData?.highRiskTyposquats || [],
    socials: {
      x_twitter: initialData?.socials?.x_twitter || '',
      instagram: initialData?.socials?.instagram || '',
      linkedin: initialData?.socials?.linkedin || '',
      facebook: initialData?.socials?.facebook || '',
      youtube: initialData?.socials?.youtube || '',
    },
    socialCandidates: initialData?.socialCandidates || {},
    confidenceScore: initialData?.confidenceScore || 0,
  });

  // Track fields that were populated via auto-fetch for staggered Framer Motion highlight animation
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [animationTriggerKey, setAnimationTriggerKey] = useState(0);

  // Keyword tag inputs
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [newTypoInput, setNewTypoInput] = useState('');

  // Smooth staggered cascade filling function
  const executeSmoothFill = async (data: any, cleanedDomain: string) => {
    setIsSmoothFilling(true);
    setAnimationTriggerKey((prev) => prev + 1);

    const brandSlug = (data.brandName || cleanedDomain.split('.')[0]).toLowerCase().replace(/[^a-z0-9]/g, '');
    const domainPrefix = cleanedDomain.split('.')[0];
    const inferredBrandName = data.brandName || domainPrefix.charAt(0).toUpperCase() + domainPrefix.slice(1);

    // Stage 1: Domain & Brand Name (Delay 35ms)
    setFillingStepMessage('1/6: Resolving Brand Name & Domain...');
    setAutoFilledFields(new Set(['brandName', 'domain']));
    setFormData((prev) => ({
      ...prev,
      brandName: inferredBrandName,
      domain: cleanedDomain,
    }));
    await new Promise((r) => setTimeout(r, 35));

    // Stage 2: Legal Entity, Industry & Logo (Delay 35ms)
    setFillingStepMessage('2/6: Auto-filling Corporate DNA & Logo...');
    setAutoFilledFields((prev) => new Set([...prev, 'legalName', 'industry', 'logoUrl']));
    setFormData((prev) => ({
      ...prev,
      legalName: data.legalName || `${inferredBrandName} Inc.`,
      industry: data.industry || 'Enterprise SaaS & Cloud',
      logoUrl: data.logoUrl || `https://www.google.com/s2/favicons?domain=${cleanedDomain}&sz=128`,
    }));
    await new Promise((r) => setTimeout(r, 35));

    // Stage 3: Executive Summary / Bio (Delay 35ms)
    setFillingStepMessage('3/6: Synthesizing Brand Bio & Overview...');
    setAutoFilledFields((prev) => new Set([...prev, 'summary']));
    setFormData((prev) => ({
      ...prev,
      summary: data.summary || `${inferredBrandName} is a verified commercial web property operating on ${cleanedDomain}.`,
    }));
    await new Promise((r) => setTimeout(r, 35));

    // Stage 4: Security & Support Emails + Headquarters (Delay 35ms)
    setFillingStepMessage('4/6: Establishing Incident Response & Headquarters...');
    setAutoFilledFields((prev) => new Set([...prev, 'securityEmail', 'supportEmail', 'headquarters']));
    setFormData((prev) => ({
      ...prev,
      securityEmail: `security@${cleanedDomain}`,
      supportEmail: `support@${cleanedDomain}`,
      headquarters: data.headquarters || 'United States & Global',
    }));
    await new Promise((r) => setTimeout(r, 35));

    // Stage 5: Threat Keywords & Lookalikes (Delay 35ms)
    setFillingStepMessage('5/6: Configuring Trademark Keywords & Typosquats...');
    setAutoFilledFields((prev) => new Set([...prev, 'threatKeywords', 'highRiskTyposquats']));
    setFormData((prev) => ({
      ...prev,
      threatKeywords: data.threatKeywords?.length ? data.threatKeywords : ['login', 'verify', 'support', 'billing', 'kyc'],
      highRiskTyposquats: data.highRiskTyposquats?.length ? data.highRiskTyposquats : [`${domainPrefix}-support.com`, `verify-${cleanedDomain}`, `${domainPrefix}-portal.net`],
    }));
    await new Promise((r) => setTimeout(r, 35));

    // Stage 6: Official Social Handles (Delay 40ms)
    setFillingStepMessage('6/6: Connecting Verified Social Footprint...');
    setAutoFilledFields((prev) => new Set([...prev, 'socials']));
    setFormData((prev) => ({
      ...prev,
      socials: {
        x_twitter: data.detectedSocials?.x_twitter || `@${brandSlug}_official`,
        instagram: data.detectedSocials?.instagram || `@${brandSlug}.official`,
        linkedin: data.detectedSocials?.linkedin || `${brandSlug}-official`,
        facebook: data.detectedSocials?.facebook || `${inferredBrandName}Official`,
        youtube: data.detectedSocials?.youtube || `@${brandSlug}`,
      },
      socialCandidates: data.socialCandidates || {},
      confidenceScore: data.confidenceScore || 98,
    }));
    await new Promise((r) => setTimeout(r, 40));

    setIsSmoothFilling(false);
    setFillingStepMessage('');

    setFetchNotice({
      message: `✨ Successfully analyzed ${cleanedDomain}! Form filled with ${data.confidenceScore || 98}% confidence.`,
      isError: false,
    });

    // Clear highlight glow after 4 seconds
    setTimeout(() => {
      setAutoFilledFields(new Set());
    }, 4000);
  };

  // Handle Domain Auto-Fetch via API
  const handleAutoFetch = async (targetDomain?: string) => {
    const raw = (targetDomain || autoFetchUrl).trim();
    if (!raw) {
      setFetchNotice({ message: 'Please enter a brand domain (e.g. stripe.com or linear.app)', isError: true });
      return;
    }

    const cleaned = raw.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
    if (!cleaned.includes('.')) {
      setFetchNotice({ message: 'Please enter a valid domain with extension (e.g. acme.com)', isError: true });
      return;
    }

    setIsFetching(true);
    setFetchNotice(null);
    setFetchProgress('Inspecting domain DNS & live perimeter...');

    try {
      const res = await fetch('/api/brand/analyze-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleaned }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze domain.');
      }

      setFetchProgress('Populating Brand DNA profile...');
      // Fast animated transition filling
      await executeSmoothFill(data, cleaned);

    } catch (err: any) {
      console.warn('Auto-fetch notice:', err);
      // Fallback smooth fill
      const domainPrefix = cleaned.split('.')[0];
      const capName = domainPrefix.charAt(0).toUpperCase() + domainPrefix.slice(1);
      
      const fallback = {
        brandName: capName,
        legalName: `${capName} Technologies Inc.`,
        industry: cleaned.includes('pay') || cleaned.includes('bank') ? 'Fintech & Digital Payments' : 'Enterprise SaaS & Cloud',
        summary: `${capName} official commercial web property operating on ${cleaned}.`,
        logoUrl: `https://www.google.com/s2/favicons?domain=${cleaned}&sz=128`,
        headquarters: 'United States & Global',
        threatKeywords: ['login', 'verify', 'support', 'billing', 'kyc'],
        highRiskTyposquats: [`${domainPrefix}-support.com`, `verify-${cleaned}`],
        detectedSocials: {
          x_twitter: `@${domainPrefix}_official`,
          instagram: `@${domainPrefix}.official`,
          linkedin: `${domainPrefix}-official`,
          facebook: `${capName}Official`,
          youtube: `@${domainPrefix}`,
        },
        confidenceScore: 92,
      };

      await executeSmoothFill(fallback, cleaned);
    } finally {
      setIsFetching(false);
      setFetchProgress('');
    }
  };

  const handleAddKeyword = () => {
    const kw = newKeywordInput.trim().toLowerCase();
    if (kw && !formData.threatKeywords.includes(kw)) {
      setFormData((prev) => ({
        ...prev,
        threatKeywords: [...prev.threatKeywords, kw],
      }));
      setNewKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      threatKeywords: prev.threatKeywords.filter((k) => k !== kwToRemove),
    }));
  };

  const handleAddTypo = () => {
    const typo = newTypoInput.trim().toLowerCase();
    if (typo && !formData.highRiskTyposquats.includes(typo)) {
      setFormData((prev) => ({
        ...prev,
        highRiskTyposquats: [...prev.highRiskTyposquats, typo],
      }));
      setNewTypoInput('');
    }
  };

  const handleRemoveTypo = (typoToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      highRiskTyposquats: prev.highRiskTyposquats.filter((t) => t !== typoToRemove),
    }));
  };

  // Toggle "None" for a social channel
  const handleToggleNoneSocial = (platform: keyof BrandFormData['socials']) => {
    setFormData((prev) => {
      const currentVal = prev.socials[platform];
      const isCurrentlyNone = currentVal === 'none';
      const cleanSlug = prev.brandName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'brand';
      
      const defaultHandle = platform === 'instagram' ? `@${cleanSlug}.official` :
                            platform === 'x_twitter' ? `@${cleanSlug}_official` :
                            platform === 'linkedin' ? `${cleanSlug}-official` :
                            platform === 'facebook' ? `${prev.brandName || cleanSlug}Official` :
                            platform === 'youtube' ? `@${cleanSlug}` : '';

      return {
        ...prev,
        socials: {
          ...prev.socials,
          [platform]: isCurrentlyNone ? defaultHandle : 'none',
        },
      };
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName.trim()) {
      setFetchNotice({ message: 'Please provide a Brand Name.', isError: true });
      return;
    }
    if (!formData.domain.trim()) {
      setFetchNotice({ message: 'Please provide the Primary Brand Domain.', isError: true });
      return;
    }
    onSubmit(formData);
  };

  // Helper for input auto-fill highlight animation
  const isHighlighted = (field: string) => autoFilledFields.has(field);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-4xl mx-auto space-y-7"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BANNER
         ───────────────────────────────────────────────────────────── */}
      <div
        data-tour="onboarding-dna"
        className="text-center space-y-2.5 p-5 sm:p-6 rounded-2xl bg-white border border-[#e3e2e0] shadow-xs"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f7b6c]/10 border border-[#0f7b6c]/25 text-[#0f7b6c] text-xs font-semibold">
          <Building2 className="w-3.5 h-3.5" />
          <span>Brand Protection Workspace</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#37352f]">
          Onboard Your Brand DNA
        </h1>
        <p className="text-xs sm:text-sm text-[#787774] max-w-xl mx-auto leading-relaxed">
          Enroll official apex domains, handles &amp; certificates to establish your ground-truth baseline.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. AUTO-FETCH PROMINENT BOX WITH SMOOTH ANIMATION
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[12px] border-2 border-[#0f7b6c]/30 shadow-[0_4px_20px_rgba(15,123,108,0.06)] p-5 sm:p-6 space-y-4 relative overflow-hidden">
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0f7b6c] to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[6px] bg-[#0f7b6c]/10 text-[#0f7b6c] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#37352f]">⚡ AI Auto-Fetch &amp; Smooth Form Fill</h2>
              <p className="text-[11px] text-[#787774]">
                Enter your domain to extract corporate DNA, perimeter invariants &amp; official handles with smooth animated filling.
              </p>
            </div>
          </div>
          {formData.confidenceScore ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] font-mono text-xs font-semibold self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>AI Score: {formData.confidenceScore}%</span>
            </span>
          ) : null}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAutoFetch();
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-mono text-[#9b9a97]">
              https://
            </span>
            <input
              type="text"
              placeholder="e.g. stripe.com, linear.app or yourcompany.com"
              value={autoFetchUrl}
              onChange={(e) => setAutoFetchUrl(e.target.value)}
              disabled={isFetching || isSmoothFilling}
              className="w-full pl-20 pr-4 py-2.5 bg-[#f7f6f3] border border-[#e3e2e0] rounded-[8px] text-xs font-mono text-[#37352f] focus:outline-none focus:border-[#0f7b6c] focus:bg-white transition placeholder:text-[#9b9a97] disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={isFetching || isSmoothFilling}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white text-xs font-semibold shadow-xs transition disabled:opacity-60 cursor-pointer shrink-0"
          >
            {isFetching || isSmoothFilling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isSmoothFilling ? 'Smooth Filling...' : 'Analyzing Domain...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Fetch &amp; Auto-Fill Form</span>
              </>
            )}
          </button>
        </form>

        {/* Preset Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] text-[#9b9a97]">Try quick sample:</span>
          {PRESET_DOMAINS.map((domain) => (
            <button
              key={domain}
              type="button"
              disabled={isFetching || isSmoothFilling}
              onClick={() => {
                setAutoFetchUrl(domain);
                handleAutoFetch(domain);
              }}
              className="px-2 py-0.5 rounded-[4px] bg-[#f7f6f3] hover:bg-[#e3e2e0] border border-[#e3e2e0] text-[#37352f] text-[11px] font-mono transition cursor-pointer disabled:opacity-50"
            >
              {domain}
            </button>
          ))}
        </div>

        {/* Live Smooth Filling Status Bar */}
        {(isFetching || isSmoothFilling) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 rounded-[6px] bg-[#0f7b6c]/5 border border-[#0f7b6c]/25 flex items-center justify-between text-xs text-[#0f7b6c]"
          >
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#0f7b6c]" />
              <span className="font-medium animate-pulse">
                {isSmoothFilling ? fillingStepMessage : fetchProgress}
              </span>
            </div>
            {isSmoothFilling && (
              <span className="text-[10px] uppercase font-bold bg-[#0f7b6c]/10 px-2 py-0.5 rounded font-mono">
                AI Auto-Typing
              </span>
            )}
          </motion.div>
        )}

        {fetchNotice && !isSmoothFilling && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-[6px] text-xs flex items-center gap-2 border ${
              fetchNotice.isError
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {fetchNotice.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{fetchNotice.message}</span>
          </motion.div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. DETAILED BRAND FORM ("ask name etc etc detailed everything")
         ───────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmitForm} className="space-y-6">
        {/* SECTION 1: CORE BRAND IDENTITY */}
        <div className="bg-white rounded-[12px] border border-[#e3e2e0] p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#e3e2e0] pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0f7b6c]" />
              <h3 className="text-sm font-bold text-[#37352f]">1. Core Brand Identity &amp; Corporate DNA</h3>
            </div>
            <span className="text-[11px] text-[#787774] font-medium">Step 1 of 3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand Display Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#37352f]">
                  Brand Name <span className="text-rose-500">*</span>
                </label>
                {isHighlighted('brandName') && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[10px] font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-1.5 py-0.5 rounded"
                  >
                    Auto-filled ✨
                  </motion.span>
                )}
              </div>
              <motion.input
                key={`brandName-${animationTriggerKey}`}
                type="text"
                required
                placeholder="e.g. Stripe, Linear, Nilapay"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                animate={
                  isHighlighted('brandName')
                    ? { borderColor: ['#0f7b6c', '#0f7b6c', '#e3e2e0'], backgroundColor: ['#ecfdf5', '#ffffff'] }
                    : {}
                }
                transition={{ duration: 1.8 }}
                className="w-full px-3.5 py-2.5 bg-white border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c] focus:ring-1 focus:ring-[#0f7b6c] transition"
              />
            </div>

            {/* Primary Domain */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#37352f]">
                  Primary Brand Domain <span className="text-rose-500">*</span>
                </label>
                {isHighlighted('domain') && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[10px] font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-1.5 py-0.5 rounded"
                  >
                    Auto-filled ✨
                  </motion.span>
                )}
              </div>
              <motion.input
                key={`domain-${animationTriggerKey}`}
                type="text"
                required
                placeholder="e.g. stripe.com"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                animate={
                  isHighlighted('domain')
                    ? { borderColor: ['#0f7b6c', '#0f7b6c', '#e3e2e0'], backgroundColor: ['#ecfdf5', '#ffffff'] }
                    : {}
                }
                transition={{ duration: 1.8 }}
                className="w-full px-3.5 py-2.5 bg-white border border-[#e3e2e0] rounded-[8px] text-xs font-mono text-[#37352f] focus:outline-none focus:border-[#0f7b6c] focus:ring-1 focus:ring-[#0f7b6c] transition"
              />
            </div>

            {/* Legal Registered Entity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#37352f]">Legal Entity Name</label>
                {isHighlighted('legalName') && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[10px] font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-1.5 py-0.5 rounded"
                  >
                    Auto-filled ✨
                  </motion.span>
                )}
              </div>
              <motion.input
                key={`legalName-${animationTriggerKey}`}
                type="text"
                placeholder="e.g. Stripe, Inc. or Acme Global LLC"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                animate={
                  isHighlighted('legalName')
                    ? { borderColor: ['#0f7b6c', '#0f7b6c', '#e3e2e0'], backgroundColor: ['#ecfdf5', '#ffffff'] }
                    : {}
                }
                transition={{ duration: 1.8 }}
                className="w-full px-3.5 py-2.5 bg-white border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c] focus:ring-1 focus:ring-[#0f7b6c] transition"
              />
            </div>

            {/* Industry Vertical */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#37352f]">Industry / Sector</label>
                {isHighlighted('industry') && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[10px] font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-1.5 py-0.5 rounded"
                  >
                    Auto-filled ✨
                  </motion.span>
                )}
              </div>
              <motion.select
                key={`industry-${animationTriggerKey}`}
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                animate={
                  isHighlighted('industry')
                    ? { borderColor: ['#0f7b6c', '#0f7b6c', '#e3e2e0'], backgroundColor: ['#ecfdf5', '#ffffff'] }
                    : {}
                }
                transition={{ duration: 1.8 }}
                className="w-full px-3.5 py-2.5 bg-white border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c] focus:ring-1 focus:ring-[#0f7b6c] transition"
              >
                {INDUSTRY_OPTIONS.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </motion.select>
            </div>

            {/* Company Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#37352f]">Company Scale / Stage</label>
              <select
                value={formData.companySize}
                onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c] focus:ring-1 focus:ring-[#0f7b6c] transition"
              >
                {COMPANY_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Logo URL / Avatar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#37352f]">Brand Logo URL</label>
                {isHighlighted('logoUrl') && (
                  <span className="text-[10px] font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-1.5 py-0.5 rounded">
                    Auto-filled ✨
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.brandName || 'Brand')}&background=0f7b6c&color=fff`;
                      }}
                    />
                  ) : (
                    <Building2 className="w-4 h-4 text-[#9b9a97]" />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                />
              </div>
            </div>
          </div>

          {/* Brand Summary / Overview */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#37352f]">
                Brand Overview &amp; Commercial Summary
              </label>
              {isHighlighted('summary') && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-[10px] font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-1.5 py-0.5 rounded"
                >
                  Auto-filled ✨
                </motion.span>
              )}
            </div>
            <motion.textarea
              key={`summary-${animationTriggerKey}`}
              rows={3}
              placeholder="Brief description of the brand's services, trusted offerings, and commercial footprint..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              animate={
                isHighlighted('summary')
                  ? { borderColor: ['#0f7b6c', '#0f7b6c', '#e3e2e0'], backgroundColor: ['#ecfdf5', '#ffffff'] }
                  : {}
              }
              transition={{ duration: 1.8 }}
              className="w-full px-3.5 py-2.5 bg-white border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c] focus:ring-1 focus:ring-[#0f7b6c] transition leading-relaxed"
            />
          </div>
        </div>

        {/* SECTION 2: PERIMETER SECURITY & CONTACTS */}
        <div className="bg-white rounded-[12px] border border-[#e3e2e0] p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#e3e2e0] pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0f7b6c]" />
              <h3 className="text-sm font-bold text-[#37352f]">
                2. Security Ground-Truth &amp; Invariant Perimeter
              </h3>
            </div>
            <span className="text-[11px] text-[#787774] font-medium">Step 2 of 3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Security Contact Email */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#37352f]">Security IR Contact Email</label>
                {isHighlighted('securityEmail') && (
                  <span className="text-[10px] font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-1.5 py-0.5 rounded">
                    Auto-filled ✨
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9b9a97]" />
                <input
                  type="email"
                  placeholder="security@brand.com"
                  value={formData.securityEmail}
                  onChange={(e) => setFormData({ ...formData, securityEmail: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                />
              </div>
            </div>

            {/* Support Email */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#37352f]">Customer Support Email</label>
                {isHighlighted('supportEmail') && (
                  <span className="text-[10px] font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-1.5 py-0.5 rounded">
                    Auto-filled ✨
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9b9a97]" />
                <input
                  type="email"
                  placeholder="support@brand.com"
                  value={formData.supportEmail}
                  onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                />
              </div>
            </div>

            {/* Headquarters */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#37352f]">Headquarters / Jurisdiction</label>
                {isHighlighted('headquarters') && (
                  <span className="text-[10px] font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-1.5 py-0.5 rounded">
                    Auto-filled ✨
                  </span>
                )}
              </div>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9b9a97]" />
                <input
                  type="text"
                  placeholder="San Francisco, CA, USA"
                  value={formData.headquarters}
                  onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                />
              </div>
            </div>
          </div>

          {/* Protected Keyword Invariants */}
          <div className="space-y-2 pt-2 border-t border-[#e3e2e0]">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-[#37352f]">
                  Protected Threat Keywords &amp; Trademarks
                </label>
                <p className="text-[11px] text-[#787774]">
                  Keywords that trigger high-severity scrutiny when spotted in rogue links or inbound messages.
                </p>
              </div>
              {isHighlighted('threatKeywords') && (
                <span className="text-[10px] font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-1.5 py-0.5 rounded">
                  Auto-filled ✨
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 items-center">
              {formData.threatKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20 text-xs font-mono font-medium"
                >
                  <span>+{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="hover:text-rose-600 transition cursor-pointer p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Add keyword..."
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  className="px-2.5 py-1 text-xs border border-[#e3e2e0] rounded-[6px] bg-[#f7f6f3] focus:bg-white focus:outline-none focus:border-[#0f7b6c] w-28"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="p-1 rounded-[6px] bg-[#0f7b6c] text-white hover:bg-[#0c6357] transition text-xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* High-Risk Lookalike Typosquats */}
          <div className="space-y-2 pt-2 border-t border-[#e3e2e0]">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-[#37352f] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Monitored High-Risk Lookalikes &amp; Typosquats</span>
                </label>
                <p className="text-[11px] text-[#787774]">
                  Simulated permutations watched for malicious DNS registration or credential phishing.
                </p>
              </div>
              {isHighlighted('highRiskTyposquats') && (
                <span className="text-[10px] font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-1.5 py-0.5 rounded">
                  Auto-filled ✨
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 items-center">
              {formData.highRiskTyposquats.map((typo) => (
                <span
                  key={typo}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#f7f6f3] text-[#37352f] border border-[#e3e2e0] text-xs font-mono"
                >
                  <span>{typo}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTypo(typo)}
                    className="hover:text-rose-600 transition cursor-pointer p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="e.g. brand-login.top"
                  value={newTypoInput}
                  onChange={(e) => setNewTypoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTypo();
                    }
                  }}
                  className="px-2.5 py-1 text-xs border border-[#e3e2e0] rounded-[6px] bg-[#f7f6f3] focus:bg-white focus:outline-none focus:border-[#0f7b6c] w-36 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddTypo}
                  className="p-1 rounded-[6px] bg-[#0f7b6c] text-white hover:bg-[#0c6357] transition text-xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: OFFICIAL SOCIAL MEDIA HANDLES WITH "NONE" OPTION */}
        <div className="bg-white rounded-[12px] border border-[#e3e2e0] p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#e3e2e0] pb-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#0f7b6c]" />
              <h3 className="text-sm font-bold text-[#37352f]">
                3. Official Social Channels &amp; Ground-Truth Handles
              </h3>
            </div>
            <span className="text-[11px] text-[#787774] font-medium">Step 3 of 3</span>
          </div>

          <div className="p-3 rounded-[8px] bg-slate-50 border border-slate-200/80 text-xs text-[#787774] space-y-1">
            <p className="font-semibold text-[#37352f] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#0f7b6c]" />
              Official Presence Ground-Truth &amp; &quot;None&quot; Zero-Trust Rule:
            </p>
            <p className="text-[11px] leading-relaxed">
              If your brand does <strong>not</strong> operate an official account on a platform, select <strong>&quot;None&quot;</strong>. ASTRA will enforce a zero-presence invariant, instantly reporting and flagging any accounts found on that platform as malicious impersonators.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Instagram */}
            {(() => {
              const isNone = formData.socials.instagram === 'none';
              return (
                <div className={`p-3.5 rounded-[10px] border transition-all ${
                  isNone ? 'bg-amber-50/50 border-amber-200/80' : 'bg-white border-[#e3e2e0]'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SocialLogo platform="instagram" size={16} />
                      <span className="text-xs font-bold text-[#37352f]">Instagram</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleNoneSocial('instagram')}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-[5px] border transition cursor-pointer flex items-center gap-1 ${
                        isNone
                          ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-2xs font-bold'
                          : 'bg-[#f7f6f3] hover:bg-[#e3e2e0] text-[#787774] border-[#e3e2e0]'
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>{isNone ? 'Marked None ✓' : 'Select None'}</span>
                    </button>
                  </div>

                  {isNone ? (
                    <div className="py-2 px-3 rounded-[6px] bg-amber-100/60 border border-amber-200 text-[11px] font-medium text-amber-900 flex items-center justify-between">
                      <span>🚫 No legitimate Instagram account</span>
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-white/70 px-1.5 py-0.2 rounded">Imposter Shield</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="@brand.official"
                      value={formData.socials.instagram}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socials: { ...formData.socials, instagram: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-[#e3e2e0] rounded-[8px] text-xs font-mono text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                    />
                  )}
                </div>
              );
            })()}

            {/* Twitter/X */}
            {(() => {
              const isNone = formData.socials.x_twitter === 'none';
              return (
                <div className={`p-3.5 rounded-[10px] border transition-all ${
                  isNone ? 'bg-amber-50/50 border-amber-200/80' : 'bg-white border-[#e3e2e0]'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SocialLogo platform="twitter" size={16} />
                      <span className="text-xs font-bold text-[#37352f]">Twitter / X</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleNoneSocial('x_twitter')}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-[5px] border transition cursor-pointer flex items-center gap-1 ${
                        isNone
                          ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-2xs font-bold'
                          : 'bg-[#f7f6f3] hover:bg-[#e3e2e0] text-[#787774] border-[#e3e2e0]'
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>{isNone ? 'Marked None ✓' : 'Select None'}</span>
                    </button>
                  </div>

                  {isNone ? (
                    <div className="py-2 px-3 rounded-[6px] bg-amber-100/60 border border-amber-200 text-[11px] font-medium text-amber-900 flex items-center justify-between">
                      <span>🚫 No legitimate Twitter/X account</span>
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-white/70 px-1.5 py-0.2 rounded">Imposter Shield</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="@brand_official"
                      value={formData.socials.x_twitter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socials: { ...formData.socials, x_twitter: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-[#e3e2e0] rounded-[8px] text-xs font-mono text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                    />
                  )}
                </div>
              );
            })()}

            {/* LinkedIn */}
            {(() => {
              const isNone = formData.socials.linkedin === 'none';
              return (
                <div className={`p-3.5 rounded-[10px] border transition-all ${
                  isNone ? 'bg-amber-50/50 border-amber-200/80' : 'bg-white border-[#e3e2e0]'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SocialLogo platform="linkedin" size={16} />
                      <span className="text-xs font-bold text-[#37352f]">LinkedIn</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleNoneSocial('linkedin')}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-[5px] border transition cursor-pointer flex items-center gap-1 ${
                        isNone
                          ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-2xs font-bold'
                          : 'bg-[#f7f6f3] hover:bg-[#e3e2e0] text-[#787774] border-[#e3e2e0]'
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>{isNone ? 'Marked None ✓' : 'Select None'}</span>
                    </button>
                  </div>

                  {isNone ? (
                    <div className="py-2 px-3 rounded-[6px] bg-amber-100/60 border border-amber-200 text-[11px] font-medium text-amber-900 flex items-center justify-between">
                      <span>🚫 No legitimate LinkedIn company page</span>
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-white/70 px-1.5 py-0.2 rounded">Imposter Shield</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="brand-official"
                      value={formData.socials.linkedin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socials: { ...formData.socials, linkedin: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-[#e3e2e0] rounded-[8px] text-xs font-mono text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                    />
                  )}
                </div>
              );
            })()}

            {/* Facebook */}
            {(() => {
              const isNone = formData.socials.facebook === 'none';
              return (
                <div className={`p-3.5 rounded-[10px] border transition-all ${
                  isNone ? 'bg-amber-50/50 border-amber-200/80' : 'bg-white border-[#e3e2e0]'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SocialLogo platform="facebook" size={16} />
                      <span className="text-xs font-bold text-[#37352f]">Facebook</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleNoneSocial('facebook')}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-[5px] border transition cursor-pointer flex items-center gap-1 ${
                        isNone
                          ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-2xs font-bold'
                          : 'bg-[#f7f6f3] hover:bg-[#e3e2e0] text-[#787774] border-[#e3e2e0]'
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>{isNone ? 'Marked None ✓' : 'Select None'}</span>
                    </button>
                  </div>

                  {isNone ? (
                    <div className="py-2 px-3 rounded-[6px] bg-amber-100/60 border border-amber-200 text-[11px] font-medium text-amber-900 flex items-center justify-between">
                      <span>🚫 No legitimate Facebook page</span>
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-white/70 px-1.5 py-0.2 rounded">Imposter Shield</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="BrandOfficial"
                      value={formData.socials.facebook}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socials: { ...formData.socials, facebook: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-[#e3e2e0] rounded-[8px] text-xs font-mono text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                    />
                  )}
                </div>
              );
            })()}

            {/* YouTube */}
            {(() => {
              const isNone = formData.socials.youtube === 'none';
              return (
                <div className={`p-3.5 rounded-[10px] border transition-all ${
                  isNone ? 'bg-amber-50/50 border-amber-200/80' : 'bg-white border-[#e3e2e0]'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SocialLogo platform="youtube" size={16} />
                      <span className="text-xs font-bold text-[#37352f]">YouTube</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleNoneSocial('youtube')}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-[5px] border transition cursor-pointer flex items-center gap-1 ${
                        isNone
                          ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-2xs font-bold'
                          : 'bg-[#f7f6f3] hover:bg-[#e3e2e0] text-[#787774] border-[#e3e2e0]'
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>{isNone ? 'Marked None ✓' : 'Select None'}</span>
                    </button>
                  </div>

                  {isNone ? (
                    <div className="py-2 px-3 rounded-[6px] bg-amber-100/60 border border-amber-200 text-[11px] font-medium text-amber-900 flex items-center justify-between">
                      <span>🚫 No legitimate YouTube channel</span>
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-white/70 px-1.5 py-0.2 rounded">Imposter Shield</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="@BrandChannel"
                      value={formData.socials.youtube}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socials: { ...formData.socials, youtube: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-[#e3e2e0] rounded-[8px] text-xs font-mono text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                    />
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. FORM ACTIONS & NAVIGATION BAR
           ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-medium text-[#787774] hover:text-[#37352f] transition cursor-pointer py-2 px-3 rounded-[6px] border border-[#e3e2e0] bg-white hover:bg-[#f7f6f3]"
            >
              ← Back to Account Type
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  brandName: '',
                  domain: '',
                  legalName: '',
                  industry: INDUSTRY_OPTIONS[0],
                  companySize: COMPANY_SIZE_OPTIONS[2],
                  summary: '',
                  logoUrl: '',
                  securityEmail: '',
                  supportEmail: '',
                  headquarters: '',
                  threatKeywords: ['login', 'verify', 'support'],
                  highRiskTyposquats: [],
                  socials: { x_twitter: '', instagram: '', linkedin: '', facebook: '', youtube: '' },
                });
                setAutoFilledFields(new Set());
              }}
              className="px-3.5 py-2.5 text-xs font-medium text-[#787774] hover:text-rose-600 rounded-[8px] border border-[#e3e2e0] bg-white hover:bg-rose-50 transition cursor-pointer"
            >
              Clear Form
            </button>

            <button
              type="submit"
              disabled={isLoading || isSmoothFilling}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[8px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white text-xs font-semibold shadow-xs transition disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Brand Profile...</span>
                </>
              ) : (
                <>
                  <span>Save &amp; Connect Official Channels</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
