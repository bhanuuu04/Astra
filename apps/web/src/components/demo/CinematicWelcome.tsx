'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  Cpu,
  Globe,
  Radio,
  Fingerprint,
} from 'lucide-react';
import { useDemo } from '@/providers/DemoProvider';

// ─────────────────────────────────────────────
// CINEMATIC MESSAGES SEQUENCE
// ─────────────────────────────────────────────
const CINEMATIC_MESSAGES = [
  {
    subtitle: 'BYTE XL JUDGES EVALUATION',
    headline: 'Welcome to Astra.',
    tagline: 'Autonomous Digital Risk Protection & Perimeter Defense.',
  },
  {
    subtitle: 'NVIDIA NEMOTRON PERIMETER RADAR',
    headline: 'Discovering impersonation threats.',
    tagline: 'Sweeping open registries, social surfaces, and rogue app stores.',
  },
  {
    subtitle: 'CRYPTOGRAPHIC GROUND TRUTH',
    headline: 'Your brand. Your identity. Protected.',
    tagline: 'Zero-friction triage with one-click cryptographic takedown packets.',
  },
];

// ─────────────────────────────────────────────
// PRELOAD STAGES
// ─────────────────────────────────────────────
const PRELOAD_STAGES = [
  { label: 'Initializing Astra', icon: Cpu },
  { label: 'Preparing brand intelligence', icon: Fingerprint },
  { label: 'Mapping impersonation threats', icon: Radio },
  { label: 'Securing your demo environment', icon: Lock },
];

export function CinematicWelcome({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const router = useRouter();
  const { enterDemoMode, startTour } = useDemo();

  const [messageIndex, setMessageIndex] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(12);
  const [isTransitioningOut, setIsTransitioningOut] = useState(false);

  const currentMsg = CINEMATIC_MESSAGES[messageIndex];
  const fullText = currentMsg.headline;

  // 1. Parallel Route & Resource Prefetching
  useEffect(() => {
    // Prime demo mode in local storage
    enterDemoMode();

    // Prefetch all key application routes in parallel
    const routes = [
      '/guide',
      '/overview',
      '/brands',
      '/sightings',
      '/alerts',
      '/consumer',
      '/campaigns/demo-camp-001',
      '/apps',
      '/responses',
      '/connectors',
      '/settings',
    ];

    routes.forEach((route) => {
      try {
        router.prefetch(route);
      } catch {}
    });
  }, [enterDemoMode, router]);

  // 2. Character-by-character typewriter effect for the active message headline
  useEffect(() => {
    setTypedChars(0);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTypedChars(i);
      if (i >= fullText.length) {
        clearInterval(interval);
      }
    }, 28); // 28ms natural cadence

    return () => clearInterval(interval);
  }, [messageIndex, fullText]);

  const handleAdvance = useCallback(() => {
    if (isTransitioningOut) return;
    setIsTransitioningOut(true);

    enterDemoMode();
    startTour();

    if (onComplete) {
      onComplete();
    } else {
      setTimeout(() => {
        router.push('/guide?demo=true');
      }, 400);
    }
  }, [isTransitioningOut, enterDemoMode, startTour, onComplete, router]);

  // 3. Coordinate message transitions & preload progress stages
  useEffect(() => {
    // Progress counter ticker
    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return Math.min(100, prev + 3);
      });
    }, 90);

    // Stage advance timers
    const stage1Timer = setTimeout(() => setStageIndex(1), 900);
    const stage2Timer = setTimeout(() => setStageIndex(2), 1800);
    const stage3Timer = setTimeout(() => setStageIndex(3), 2700);

    // Message 1 -> Message 2 transition
    const msg2Timer = setTimeout(() => {
      setMessageIndex(1);
    }, 2200);

    // Message 2 -> Message 3 transition
    const msg3Timer = setTimeout(() => {
      setMessageIndex(2);
    }, 4400);

    // Auto-advance to dashboard once fully initialized
    const completionTimer = setTimeout(() => {
      handleAdvance();
    }, 6600);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stage1Timer);
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);
      clearTimeout(msg2Timer);
      clearTimeout(msg3Timer);
      clearTimeout(completionTimer);
    };
  }, [handleAdvance]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isTransitioningOut ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100000] flex flex-col justify-between bg-[#070b14] text-slate-100 font-sans select-none overflow-hidden"
    >
      {/* ─────────────────────────────────────────────────────────────
          ATMOSPHERIC BACKGROUND EFFECTS
         ───────────────────────────────────────────────────────────── */}
      {/* Ambient gradient glow in top-center */}
      <div className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(15,123,108,0.22),transparent_70%)] blur-[90px]" />
      {/* Cyan sub-glow */}
      <div className="pointer-events-none absolute bottom-[-15%] right-[-10%] w-[600px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.12),transparent_70%)] blur-[100px]" />

      {/* Subtle tactical grid lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          1. TOP BAR
         ───────────────────────────────────────────────────────────── */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0f7b6c] to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_20px_rgba(15,123,108,0.4)]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-sm text-white">ASTRA</span>
              <span className="text-slate-600 text-xs">/</span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                BYTE XL DEMO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Digital Risk Protection Platform</p>
          </div>
        </div>

        {/* Skip to Interactive Tour Button */}
        <motion.button
          type="button"
          onClick={handleAdvance}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="group flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer backdrop-blur-md"
        >
          <span>Enter Live Tour</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-400 transition-transform group-hover:translate-x-0.5" />
        </motion.button>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. CENTER CINEMATIC TYPEWRITER HERO
         ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full text-center py-8">
        {/* Animated Brand Hologram Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/15 backdrop-blur-xl flex items-center justify-center shadow-[0_0_50px_rgba(15,123,108,0.35)]">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-2xl border border-dashed border-emerald-400/30"
            />
            <Shield className="w-9 h-9 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-300">
            ARMED
          </div>
        </motion.div>

        {/* Message Category Badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMsg.subtitle}
            initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            transition={{ duration: 0.35 }}
            className="mb-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{currentMsg.subtitle}</span>
          </motion.div>
        </AnimatePresence>

        {/* Dynamic Typewritten Headline */}
        <div className="min-h-[96px] sm:min-h-[120px] flex items-center justify-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            <span>{fullText.slice(0, typedChars)}</span>
            <span className="inline-block w-2 sm:w-2.5 h-8 sm:h-12 bg-emerald-400 ml-1.5 align-middle animate-pulse" />
          </h1>
        </div>

        {/* Tagline Reveal */}
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMsg.tagline}
            initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
            transition={{ duration: 0.4 }}
            className="mt-4 text-sm sm:text-base text-slate-400 max-w-xl mx-auto font-normal leading-relaxed"
          >
            {currentMsg.tagline}
          </motion.p>
        </AnimatePresence>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. BOTTOM PRELOADING DOCK & PROGRESS STAGES
         ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full max-w-3xl mx-auto px-6 pb-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-5 sm:p-6 shadow-2xl">
          {/* Progress Bar & Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                Preloading Threat Baseline
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {progressPercent}%
            </span>
          </div>

          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-5">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full"
              initial={{ width: '12%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ ease: 'linear', duration: 0.15 }}
            />
          </div>

          {/* 4 Subtle Progress Stages */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRELOAD_STAGES.map((stage, idx) => {
              const isPast = stageIndex > idx || progressPercent === 100;
              const isCurrent = stageIndex === idx && progressPercent < 100;
              const StageIcon = stage.icon;

              return (
                <div
                  key={stage.label}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                    isPast
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : isCurrent
                      ? 'bg-white/10 border-white/20 text-white shadow-sm'
                      : 'bg-white/[0.02] border-white/5 text-slate-500'
                  }`}
                >
                  <div className="shrink-0">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <StageIcon className={`w-3.5 h-3.5 ${isCurrent ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />
                    )}
                  </div>
                  <span className="text-[11px] font-medium truncate leading-tight">
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Enrolled Brand Indicator */}
          <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Target Brands:</span>
              <span className="text-slate-200 font-bold">NexBank Financial</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-200 font-bold">Vercel</span>
            </div>
            <span className="text-emerald-400/80">Synthetic Isolated Sandbox</span>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
