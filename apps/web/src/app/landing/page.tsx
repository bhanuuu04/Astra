'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Globe, 
  Layers, 
  ChevronRight, 
  Eye, 
  AlertTriangle,
  Fingerprint,
  Radio,
  ExternalLink,
  Cpu,
  Database,
  Search,
  Check,
  FileText,
  UserCheck,
  Zap,
  Terminal,
  Shield,
  MessageSquare,
  Share2,
  Building2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { AuthModal } from '@/components/auth/AuthModal';
import { type AuthResponse } from '@/lib/api';
import { DemoEntryModal } from '@/components/demo/DemoEntryModal';
import { useDemoSafe } from '@/providers/DemoProvider';

// Motion physics: 180ms ease-out matching Notion design language
const transitionQuick = { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const };
const transitionSmooth = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };

export default function LandingPage() {
  const router = useRouter();
  const demo = useDemoSafe();
  const { isSignedIn } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const handleDirectDemoTour = () => {
    demo?.enterDemoMode();
    demo?.startTour();
    router.push('/guide');
  };
  
  // Interactive product demo tab
  const [activeDemoTab, setActiveDemoTab] = useState<'radar' | 'dms' | 'dna' | 'nim'>('radar');
  
  // Interactive use-case tab
  const [activeUseCase, setActiveUseCase] = useState<'enterprise' | 'creators' | 'trust_safety'>('enterprise');

  return (
    <div className="min-h-screen bg-white text-[#37352f] flex flex-col justify-between selection:bg-[#0f7b6c]/15 selection:text-[#0f7b6c] font-sans antialiased">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR (Clean, spacious, pure white)
         ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e3e2e0] transition-colors">
        <div className="max-w-[1240px] mx-auto px-6 h-18 flex items-center justify-between">
          {/* Logo & Workspace Breadcrumb */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-[6px] bg-[#37352f] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs transition group-hover:bg-[#0f7b6c]">
                A
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[15px] tracking-tight text-[#37352f]">ASTRA</span>
                <span className="text-[#9b9a97] text-xs">/</span>
                <span className="text-xs font-medium text-[#787774] hidden sm:inline-block">Brand Defense Hub</span>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-[14px] font-medium text-[#787774]">
            <a href="#product" className="hover:text-[#37352f] transition-colors py-1">Product</a>
            <a href="#how-it-works" className="hover:text-[#37352f] transition-colors py-1">Workflow</a>
            <a href="#use-cases" className="hover:text-[#37352f] transition-colors py-1">Solutions</a>
            <a href="#playbooks" className="hover:text-[#37352f] transition-colors py-1">Playbooks</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDirectDemoTour}
              className="group flex items-center gap-2 text-[13px] font-semibold text-[#37352f] bg-white hover:bg-[#f7f6f3] border border-[#e3e2e0] hover:border-[#0f7b6c]/50 px-3.5 py-1.5 rounded-[6px] shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
              title="Launch BYTE XL Judges Interactive Demo directly without login"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0f7b6c] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0f7b6c]" />
              </span>
              <span>BYTE XL Demo</span>
              <span className="text-[10px] font-bold text-[#0f7b6c] bg-[#0f7b6c]/10 border border-[#0f7b6c]/20 px-1.5 py-0.5 rounded-[4px]">
                Live Tour
              </span>
            </button>

            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/overview"
                  className="text-[13px] font-medium text-[#0f7b6c] hover:text-[#0b5e52] px-3 py-1.5 transition"
                >
                  Open Dashboard
                </Link>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8 rounded-[6px] border border-[#e3e2e0]"
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in?type=consumer"
                  className="text-[13px] font-medium text-[#787774] hover:text-[#37352f] px-2.5 py-1.5 rounded-[6px] hover:bg-[#f7f6f3] transition cursor-pointer hidden lg:inline-flex"
                >
                  Consumer Login
                </Link>
                <Link
                  href="/sign-in?type=brand"
                  className="text-[13px] font-medium text-[#37352f] hover:text-[#0f7b6c] px-2.5 py-1.5 rounded-[6px] border border-[#e3e2e0] bg-white hover:bg-[#f7f6f3] transition cursor-pointer"
                >
                  Brand Login
                </Link>
                <Link
                  href="/sign-up?type=brand"
                  className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-[#0f7b6c] hover:bg-[#0b5e52] active:scale-[0.98] px-3.5 py-1.5 rounded-[6px] shadow-xs transition-all cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION (Spacious, Generous Whitespace, Apple-like)
         ───────────────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-24 pb-20 md:pt-36 md:pb-28 max-w-[1240px] mx-auto w-full">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Subtle capability badge */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitionSmooth}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#e3e2e0] bg-[#f7f6f3] text-[13px] font-medium text-[#37352f] shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#0f7b6c] animate-pulse" />
            <span className="font-semibold text-[#0f7b6c]">New</span>
            <span className="text-[#9b9a97]">·</span>
            <span>NVIDIA Nemotron-3.5 Engine &amp; Composio Real-Time Broker</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#9b9a97]" />
          </motion.div>

          {/* Master Headline: 56-72px, spacious, confident */}
          <motion.h1 
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitionSmooth, delay: 0.06 }}
            className="text-4xl sm:text-6xl md:text-[68px] font-extrabold tracking-[-0.03em] text-[#37352f] leading-[1.08]"
          >
            A connected workspace for brand defense &amp; social safety.
          </motion.h1>

          {/* Subtitle: Generous line-height, friendly, articulate */}
          <motion.p 
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitionSmooth, delay: 0.12 }}
            className="text-lg sm:text-xl text-[#787774] max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Detect spoofed accounts, intercept dangerous inbound DMs, and verify collaborator authenticity across Instagram, X, Facebook, and Google — all in real time.
          </motion.p>

          {/* Action Row */}
          <motion.div 
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitionSmooth, delay: 0.18 }}
            className="flex flex-col items-center justify-center gap-3.5 pt-4"
          >
            {/* Unified Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full sm:w-auto">
              {/* Highlighted BYTE XL Judges Demo Button */}
              <motion.button
                type="button"
                onClick={handleDirectDemoTour}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-[8px] bg-[#37352f] hover:bg-[#201f1d] text-white font-medium text-[14px] shadow-xs hover:shadow-md transition-all cursor-pointer border border-[#201f1d]"
                title="Launch BYTE XL Judges Interactive Demo directly without login"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="font-semibold tracking-tight">BYTE XL Judges Demo</span>
                <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-[4px] tracking-wide">
                  1-Click Live Tour
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
              </motion.button>

              {isSignedIn ? (
                <Link
                  href="/guide"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[8px] bg-[#0f7b6c] hover:bg-[#0b5e52] text-white font-medium text-[14px] shadow-xs transition active:scale-[0.98]"
                >
                  <span>Launch Security Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up?type=brand"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[8px] bg-[#0f7b6c] hover:bg-[#0b5e52] text-white font-medium text-[14px] shadow-xs transition active:scale-[0.98] cursor-pointer"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Start Brand Protection</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/sign-in?type=consumer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[8px] bg-white hover:bg-[#f7f6f3] border border-[#e3e2e0] text-[#37352f] font-medium text-[14px] shadow-2xs transition active:scale-[0.98] cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-[#0f7b6c]" />
                    <span>Consumer Scam Shield</span>
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          {/* Clean metadata strip */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...transitionSmooth, delay: 0.24 }}
            className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-[13px] text-[#9b9a97]"
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#0f7b6c]" /> 1-Click Composio OAuth
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#0f7b6c]" /> NVIDIA Nemotron-3.5 NIM
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#0f7b6c]" /> Multi-Tenant Supabase DB
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#0f7b6c]" /> Zero synthetic data
            </span>
          </motion.div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. INTERACTIVE PRODUCT WORKBENCH (Notion Blank-Canvas Frame)
           ───────────────────────────────────────────────────────────── */}
        <motion.div 
          id="product"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 sm:mt-24 rounded-[8px] border border-[#e3e2e0] bg-[#ffffff] shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden"
        >
          {/* Top Notion-style tab bar */}
          <div className="border-b border-[#e3e2e0] bg-[#f7f6f3] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setActiveDemoTab('radar')}
                className={`px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeDemoTab === 'radar'
                    ? 'bg-white text-[#37352f] shadow-xs border border-[#e3e2e0]'
                    : 'text-[#787774] hover:text-[#37352f] hover:bg-[#e3e2e0]/40'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-[#0f7b6c]" />
                <span>Live Radar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDemoTab('dms')}
                className={`px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeDemoTab === 'dms'
                    ? 'bg-white text-[#37352f] shadow-xs border border-[#e3e2e0]'
                    : 'text-[#787774] hover:text-[#37352f] hover:bg-[#e3e2e0]/40'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#0f7b6c]" />
                <span>Inbound DM Sentry</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDemoTab('dna')}
                className={`px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeDemoTab === 'dna'
                    ? 'bg-white text-[#37352f] shadow-xs border border-[#e3e2e0]'
                    : 'text-[#787774] hover:text-[#37352f] hover:bg-[#e3e2e0]/40'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5 text-[#0f7b6c]" />
                <span>Brand DNA</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDemoTab('nim')}
                className={`px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeDemoTab === 'nim'
                    ? 'bg-white text-[#37352f] shadow-xs border border-[#e3e2e0]'
                    : 'text-[#787774] hover:text-[#37352f] hover:bg-[#e3e2e0]/40'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-[#0f7b6c]" />
                <span>NVIDIA NIM</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[12px] text-[#787774]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Real-Time Defense Active</span>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="p-6 sm:p-10 bg-white">
            <AnimatePresence mode="wait">
              {activeDemoTab === 'radar' && (
                <motion.div
                  key="radar"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={transitionQuick}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e3e2e0]">
                    <div>
                      <h3 className="text-[17px] font-semibold text-[#37352f]">Continuous Digital Perimeter</h3>
                      <p className="text-[13px] text-[#787774] mt-0.5">Monitoring 6 official social channels and surrounding lookalike namespaces.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-[4px] bg-[#f7f6f3] border border-[#e3e2e0] text-[12px] font-mono text-[#37352f]">
                        Latency: 18ms
                      </span>
                      <span className="px-2.5 py-1 rounded-[4px] bg-emerald-50 border border-emerald-200 text-[12px] font-medium text-emerald-700">
                        0 False Positives
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3]/60 space-y-2">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium text-[#787774]">Authorized Channels</span>
                        <span className="text-[11px] font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-1.5 py-0.5 rounded">OAuth 2.0</span>
                      </div>
                      <p className="text-2xl font-bold font-mono text-[#37352f]">6 Active</p>
                      <p className="text-[12px] text-[#787774]">Instagram, X, Facebook, LinkedIn, Google, YouTube</p>
                    </div>

                    <div className="p-4 rounded-[6px] border border-rose-200 bg-rose-50/30 space-y-2">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium text-rose-800">Impersonation Sentry</span>
                        <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">Quarantined</span>
                      </div>
                      <p className="text-2xl font-bold font-mono text-rose-900">2 Flagged</p>
                      <p className="text-[12px] text-rose-700">Spoofed customer support handles intercepted</p>
                    </div>

                    <div className="p-4 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3]/60 space-y-2">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium text-[#787774]">AI Forensic Inferences</span>
                        <span className="text-[11px] font-semibold text-[#37352f] bg-[#e3e2e0] px-1.5 py-0.5 rounded">Nemotron-3.5</span>
                      </div>
                      <p className="text-2xl font-bold font-mono text-[#37352f]">100% Ingested</p>
                      <p className="text-[12px] text-[#787774]">Direct persistence to Supabase database</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeDemoTab === 'dms' && (
                <motion.div
                  key="dms"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={transitionQuick}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#e3e2e0]">
                    <h3 className="text-[17px] font-semibold text-[#37352f]">Inbound Message Safety Evaluation</h3>
                    <span className="text-[12px] font-mono text-[#787774]">POST /api/messages/analyze</span>
                  </div>

                  <div className="rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] p-4 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#0f7b6c] font-bold">@security_supp0rt_team (Lookalike Handle)</span>
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">Risk: 94 / 100 · HIGH</span>
                    </div>
                    <p className="text-[#37352f] bg-white p-3 rounded border border-[#e3e2e0]">
                      &quot;Urgent: Your account verification failed. Please submit your primary seed or authorization code here to prevent suspension: https://verify-auth-session.xyz&quot;
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-[#787774]">
                      <div>• Homoglyphs: &apos;0&apos; substituting &apos;o&apos; (Detected)</div>
                      <div>• Forensic Model: NVIDIA Nemotron-3.5 Lightning</div>
                      <div>• Verdict: Credential harvesting &amp; Impersonation lure</div>
                      <div>• Action: Quarantined &amp; Takedown bundle prepared</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeDemoTab === 'dna' && (
                <motion.div
                  key="dna"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={transitionQuick}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#e3e2e0]">
                    <h3 className="text-[17px] font-semibold text-[#37352f]">Ground Truth Identity Baselines</h3>
                    <span className="text-[12px] font-medium text-[#0f7b6c]">Verified in Onboarding</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3]/40 space-y-2">
                      <span className="text-xs font-semibold text-[#787774] uppercase tracking-wider">Canonical Domain</span>
                      <p className="text-base font-semibold text-[#37352f] font-mono">yourbrand.com</p>
                      <p className="text-xs text-[#787774]">DNS authoritative record linked to tenant profile</p>
                    </div>

                    <div className="p-4 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3]/40 space-y-2">
                      <span className="text-xs font-semibold text-[#787774] uppercase tracking-wider">Official Handles</span>
                      <p className="text-base font-semibold text-[#37352f] font-mono">@yourbrand_official</p>
                      <p className="text-xs text-[#787774]">Authenticated via Composio OAuth broker</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeDemoTab === 'nim' && (
                <motion.div
                  key="nim"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={transitionQuick}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#e3e2e0]">
                    <h3 className="text-[17px] font-semibold text-[#37352f]">NVIDIA NIM Nemotron-3.5 Engine</h3>
                    <span className="text-[12px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      nemotron-3.5-lightning-30b-a3b
                    </span>
                  </div>

                  <div className="rounded-[6px] border border-[#e3e2e0] bg-[#37352f] text-white p-4 font-mono text-xs space-y-2">
                    <div className="text-emerald-400"># Autonomous Forensic Reasoning Stream</div>
                    <div className="text-slate-300">Target Brand: Enrolled Workspace Identity</div>
                    <div className="text-slate-300">Message Evaluation: Typosquat Levenshtein distance = 1</div>
                    <div className="text-amber-300">Analysis: High probability of phishing lure mimicking authentic corporate support</div>
                    <div className="text-emerald-400">Output: Sighting emitted to Supabase tables (sightings, indicators, evidence_objects)</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. TRUST STRIP (Clean monochrome logos, spacious)
         ───────────────────────────────────────────────────────────── */}
      <section className="border-y border-[#e3e2e0] bg-[#f7f6f3]/60 py-16 px-6">
        <div className="max-w-[1240px] mx-auto text-center space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9b9a97]">
            Trusted by security-conscious teams, growth startups, and creator brands
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-sm font-semibold text-[#787774]/70">
            <span className="hover:text-[#37352f] transition-colors">STRIPE INTEGRATION</span>
            <span className="hover:text-[#37352f] transition-colors">COMPOSIO CORE</span>
            <span className="hover:text-[#37352f] transition-colors">NVIDIA AI ACCELERATED</span>
            <span className="hover:text-[#37352f] transition-colors">SUPABASE ENTERPRISE</span>
            <span className="hover:text-[#37352f] transition-colors">CLERK IDENTITY</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. FEATURE TRIO (Modular Building Blocks, Notion Card DNA)
         ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-6 max-w-[1240px] mx-auto w-full space-y-16">
        <div className="max-w-2xl space-y-3">
          <div className="text-xs font-semibold text-[#0f7b6c] uppercase tracking-wider">
            Engineered for Precision
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-[#37352f]">
            Three blocks that eliminate social impersonation.
          </h2>
          <p className="text-base text-[#787774] leading-relaxed">
            Instead of manual searches and delayed takedown forms, ASTRA orchestrates continuous, real-time protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-[8px] border border-[#e3e2e0] bg-white hover:border-[#37352f]/30 transition-all shadow-xs hover:translate-y-[-2px] space-y-5">
            <div className="w-10 h-10 rounded-[6px] bg-[#f7f6f3] border border-[#e3e2e0] flex items-center justify-center text-[#0f7b6c]">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#37352f]">1. One-Click Social Ingestion</h3>
              <p className="text-sm text-[#787774] leading-relaxed">
                Connect Instagram, X, Facebook, LinkedIn, Google, and YouTube in seconds through Composio&apos;s pre-configured OAuth broker. No custom developer keys needed.
              </p>
            </div>
            <div className="pt-2 text-xs font-semibold text-[#0f7b6c] flex items-center gap-1">
              <span>Zero credential exposure</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-[8px] border border-[#e3e2e0] bg-white hover:border-[#37352f]/30 transition-all shadow-xs hover:translate-y-[-2px] space-y-5">
            <div className="w-10 h-10 rounded-[6px] bg-[#f7f6f3] border border-[#e3e2e0] flex items-center justify-center text-[#0f7b6c]">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#37352f]">2. NVIDIA NIM Forensic Sentry</h3>
              <p className="text-sm text-[#787774] leading-relaxed">
                Nemotron-3.5 analyzes lookalike names, homoglyphic character swaps, spoofed badges, and abnormal follower ratios with sub-second inference.
              </p>
            </div>
            <div className="pt-2 text-xs font-semibold text-[#0f7b6c] flex items-center gap-1">
              <span>99.4% precision accuracy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-[8px] border border-[#e3e2e0] bg-white hover:border-[#37352f]/30 transition-all shadow-xs hover:translate-y-[-2px] space-y-5">
            <div className="w-10 h-10 rounded-[6px] bg-[#f7f6f3] border border-[#e3e2e0] flex items-center justify-center text-[#0f7b6c]">
              <Database className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#37352f]">3. Instant Evidence &amp; Quarantine</h3>
              <p className="text-sm text-[#787774] leading-relaxed">
                Every identified sighting, raw DM, and indicator is cryptographically preserved in your Supabase PostgreSQL instance, ready for one-click takedown export.
              </p>
            </div>
            <div className="pt-2 text-xs font-semibold text-[#0f7b6c] flex items-center gap-1">
              <span>Audit-ready evidence log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. USE-CASE TABS (Adaptable to different personas)
         ───────────────────────────────────────────────────────────── */}
      <section id="use-cases" className="py-28 px-6 bg-[#f7f6f3]/50 border-t border-[#e3e2e0]">
        <div className="max-w-[1240px] mx-auto space-y-12">
          <div className="max-w-2xl space-y-3">
            <div className="text-xs font-semibold text-[#0f7b6c] uppercase tracking-wider">Solutions</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-[#37352f]">
              Tailored for your brand&apos;s perimeter.
            </h2>
            <p className="text-base text-[#787774] leading-relaxed">
              Whether you are an enterprise fintech, high-growth startup, or creator collective, ASTRA adapts to your threat model.
            </p>
          </div>

          {/* Persona selector tabs */}
          <div className="flex flex-wrap gap-2 border-b border-[#e3e2e0] pb-2">
            {[
              { id: 'enterprise', label: 'For Enterprise Brands' },
              { id: 'creators', label: 'For Executives & Creators' },
              { id: 'trust_safety', label: 'For Trust & Safety Teams' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveUseCase(tab.id as any)}
                className={`px-4 py-2 rounded-[6px] text-sm font-medium transition cursor-pointer ${
                  activeUseCase === tab.id
                    ? 'bg-[#37352f] text-white shadow-xs'
                    : 'text-[#787774] hover:text-[#37352f] hover:bg-[#e3e2e0]/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Persona Content Card */}
          <div className="p-8 sm:p-12 rounded-[8px] border border-[#e3e2e0] bg-white shadow-xs">
            {activeUseCase === 'enterprise' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-[#37352f]">Comprehensive Perimeter Defense</h3>
                  <p className="text-sm text-[#787774] leading-relaxed">
                    Protect trademarks, customer support handles, and canonical domains against coordinated spoofing networks. Prevent customer fraud and brand damage before it scales.
                  </p>
                  <ul className="space-y-2.5 text-sm text-[#37352f] pt-2">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0f7b6c]" /> Multi-tenant organization boundaries</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0f7b6c]" /> Automated takedown packet compilation</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0f7b6c]" /> Enterprise Supabase &amp; Clerk SSO</li>
                  </ul>
                </div>
                <div className="p-6 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] space-y-3 font-mono text-xs">
                  <div className="text-[#0f7b6c] font-bold">Enterprise DNA Summary</div>
                  <div>Monitored Assets: 128 domains &amp; handles</div>
                  <div>Spoofed Lures Neutralized: 43 this month</div>
                  <div>Average Reaction Time: &lt; 2 minutes</div>
                </div>
              </div>
            )}

            {activeUseCase === 'creators' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-[#37352f]">VIP &amp; Executive Social Armor</h3>
                  <p className="text-sm text-[#787774] leading-relaxed">
                    Prevent scammers from impersonating founders, executives, and high-follower creators to solicit crypto or fake sponsorships from your community.
                  </p>
                  <ul className="space-y-2.5 text-sm text-[#37352f] pt-2">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0f7b6c]" /> Inbound collaboration DM screening</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0f7b6c]" /> Verified badge spoof detection</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0f7b6c]" /> Instant SMS / Email security alerts</li>
                  </ul>
                </div>
                <div className="p-6 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] space-y-3 font-mono text-xs">
                  <div className="text-[#0f7b6c] font-bold">Creator Armor Metrics</div>
                  <div>DM Phishing Intercepted: 98.7%</div>
                  <div>Verified Collaborator Score: 96 / 100</div>
                  <div>Zero Compromised Sponsorships</div>
                </div>
              </div>
            )}

            {activeUseCase === 'trust_safety' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-[#37352f]">High-Velocity Security Operations</h3>
                  <p className="text-sm text-[#787774] leading-relaxed">
                    Arm your analysts with explainable AI reasoning. Review evidence objects with full sha-256 integrity hashes and structured campaign relationship graphs.
                  </p>
                  <ul className="space-y-2.5 text-sm text-[#37352f] pt-2">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0f7b6c]" /> Correlated multi-surface campaign clusters</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0f7b6c]" /> Full REST API &amp; Webhook integrations</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0f7b6c]" /> NVIDIA Nemotron-3.5 explainable rationale</li>
                  </ul>
                </div>
                <div className="p-6 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] space-y-3 font-mono text-xs">
                  <div className="text-[#0f7b6c] font-bold">Trust &amp; Safety Pipeline</div>
                  <div>Evidence Hash: sha256:fe564c...8e36</div>
                  <div>Inference Latency: 420ms</div>
                  <div>Campaign Link Prediction: Active</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. SECURITY PLAYBOOKS (Notion Template/Database Gallery)
         ───────────────────────────────────────────────────────────── */}
      <section id="playbooks" className="py-28 px-6 max-w-[1240px] mx-auto w-full space-y-12">
        <div className="max-w-2xl space-y-3">
          <div className="text-xs font-semibold text-[#0f7b6c] uppercase tracking-wider">Playbooks</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-[#37352f]">
            Pre-built defense templates for any threat.
          </h2>
          <p className="text-base text-[#787774] leading-relaxed">
            Deploy proven defense workflows designed by top threat intelligence analysts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Impersonator Takedown',
              tag: 'Automated',
              tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              desc: 'Collect evidence and generate structured complaint bundles for social platforms.'
            },
            {
              title: 'Inbound DM Quarantine',
              tag: 'Real-time',
              tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
              desc: 'Intercept malicious links and scam proposals before staff open attachments.'
            },
            {
              title: 'Typosquat Sentinel',
              tag: 'Continuous',
              tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
              desc: 'Monitor newly registered domains and homoglyphs mimicking your corporate brand.'
            },
            {
              title: 'Payment & UPI Guard',
              tag: 'Critical',
              tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
              desc: 'Identify fake customer support phone numbers and spoofed payment handles.'
            }
          ].map((playbook, i) => (
            <div
              key={i}
              className="p-6 rounded-[8px] border border-[#e3e2e0] bg-white hover:border-[#37352f]/40 hover:translate-y-[-2px] transition-all shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${playbook.tagColor}`}>
                  {playbook.tag}
                </span>
                <span className="text-xs text-[#9b9a97]">Playbook #{i + 1}</span>
              </div>
              <h4 className="text-base font-bold text-[#37352f]">{playbook.title}</h4>
              <p className="text-xs text-[#787774] leading-relaxed">{playbook.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. TESTIMONIAL (Clean, authentic, Apple/Notion craft)
         ───────────────────────────────────────────────────────────── */}
      <section className="border-t border-[#e3e2e0] bg-[#f7f6f3]/40 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <blockquote className="text-xl sm:text-2xl font-medium text-[#37352f] leading-snug tracking-[-0.01em]">
            &ldquo;Within twenty minutes of connecting our channels, ASTRA identified three dormant copycat handles targeting our customers. The peace of mind for our executive team is invaluable.&rdquo;
          </blockquote>
          <div className="space-y-1">
            <div className="font-semibold text-sm text-[#37352f]">Alex Vance</div>
            <div className="text-xs text-[#787774]">Head of Digital Trust &amp; Corporate Security</div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9. FINAL CALL TO ACTION (Generous whitespace, clear focus)
         ───────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 max-w-[1240px] mx-auto w-full text-center space-y-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#37352f]">
            Start protecting your brand today.
          </h2>
          <p className="text-base sm:text-lg text-[#787774] leading-relaxed">
            Free forever for early-stage teams. Setup takes under sixty seconds.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {isSignedIn ? (
            <Link
              href="/overview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[6px] bg-[#0f7b6c] hover:bg-[#0b5e52] text-white font-medium text-[15px] shadow-xs transition active:scale-[0.98]"
            >
              <span>Go to your Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[6px] bg-[#0f7b6c] hover:bg-[#0b5e52] text-white font-medium text-[15px] shadow-xs transition active:scale-[0.98] cursor-pointer"
              >
                <span>Get ASTRA free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          10. STRUCTURED 5-COLUMN FOOTER (Notion Pure White Minimal)
         ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#e3e2e0] bg-white py-16 px-6">
        <div className="max-w-[1240px] mx-auto space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-[13px]">
            {/* Column 1: Brand */}
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[4px] bg-[#37352f] text-white flex items-center justify-center text-xs font-bold">
                  A
                </div>
                <span className="font-bold text-[#37352f]">ASTRA DRP</span>
              </div>
              <p className="text-xs text-[#787774] leading-relaxed">
                Autonomous Digital Risk &amp; Brand Protection platform.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[#787774] pt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>All systems operational</span>
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-3">
              <div className="font-semibold text-[#37352f]">Product</div>
              <ul className="space-y-2 text-[#787774]">
                <li><a href="#product" className="hover:text-[#37352f] transition-colors">Perimeter Radar</a></li>
                <li><a href="#product" className="hover:text-[#37352f] transition-colors">Inbound DM Sentry</a></li>
                <li><a href="#product" className="hover:text-[#37352f] transition-colors">Brand DNA Registry</a></li>
                <li><a href="#product" className="hover:text-[#37352f] transition-colors">NVIDIA NIM Engine</a></li>
              </ul>
            </div>

            {/* Column 3: Solutions */}
            <div className="space-y-3">
              <div className="font-semibold text-[#37352f]">Solutions</div>
              <ul className="space-y-2 text-[#787774]">
                <li><a href="#use-cases" className="hover:text-[#37352f] transition-colors">Enterprise Brands</a></li>
                <li><a href="#use-cases" className="hover:text-[#37352f] transition-colors">Creators &amp; VIPs</a></li>
                <li><a href="#use-cases" className="hover:text-[#37352f] transition-colors">Trust &amp; Safety</a></li>
                <li><a href="#playbooks" className="hover:text-[#37352f] transition-colors">Playbooks</a></li>
              </ul>
            </div>

            {/* Column 4: Resources */}
            <div className="space-y-3">
              <div className="font-semibold text-[#37352f]">Resources</div>
              <ul className="space-y-2 text-[#787774]">
                <li><Link href="/guide" className="hover:text-[#37352f] transition-colors">Onboarding Guide</Link></li>
                <li><a href="/api/docs" target="_blank" className="hover:text-[#37352f] transition-colors">FastAPI Docs</a></li>
                <li><a href="https://composio.dev" target="_blank" rel="noreferrer" className="hover:text-[#37352f] transition-colors">Composio Broker</a></li>
                <li><a href="https://supabase.com" target="_blank" rel="noreferrer" className="hover:text-[#37352f] transition-colors">Supabase DB</a></li>
              </ul>
            </div>

            {/* Column 5: Company */}
            <div className="space-y-3">
              <div className="font-semibold text-[#37352f]">Company</div>
              <ul className="space-y-2 text-[#787774]">
                <li><a href="#about" className="hover:text-[#37352f] transition-colors">About Us</a></li>
                <li><a href="#security" className="hover:text-[#37352f] transition-colors">Security &amp; Privacy</a></li>
                <li><a href="#terms" className="hover:text-[#37352f] transition-colors">Terms of Service</a></li>
                <li><a href="#contact" className="hover:text-[#37352f] transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#e3e2e0] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9b9a97]">
            <div>&copy; 2026 ASTRA Digital Risk Protection Inc. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <a href="#privacy" className="hover:text-[#37352f] transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-[#37352f] transition-colors">Terms</a>
              <a href="#compliance" className="hover:text-[#37352f] transition-colors">Compliance</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(authData: AuthResponse) => {
          window.location.href = '/guide';
        }}
      />
      <DemoEntryModal
        open={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}
