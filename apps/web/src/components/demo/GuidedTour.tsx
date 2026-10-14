'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  X,
  RotateCcw,
  Zap,
  Shield,
  Eye,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Activity,
  LogOut,
  Radio,
  ExternalLink,
  Compass,
} from 'lucide-react';
import { useDemo, TOUR_STEPS, type TourStep } from '@/providers/DemoProvider';
import { TourCompletionModal } from './TourCompletionModal';

// ─────────────────────────────────────────────
// CINEMATIC INTRO METADATA PER FEATURE ROUTE
// ─────────────────────────────────────────────
interface CinematicIntroMeta {
  headline: string;
  explanation: string;
  badge: string;
  icon: string;
}

const FEATURE_CINEMATIC_INTROS: Record<string, CinematicIntroMeta> = {
  '/guide': {
    headline: "Onboard your Brand DNA…",
    explanation: "Locking in official apex domains & verified handles. If it's not on this allowlist, it's fake. Zero cap.",
    badge: "BRAND GROUND TRUTH",
    icon: "🧬",
  },
  '/brands': {
    headline: "Verified brand registry…",
    explanation: "Cryptographically anchoring your digital footprint. Any lookalike trying to clone this gets flagged on sight.",
    badge: "ALLOWLIST MATRIX",
    icon: "🛡️",
  },
  '/connectors': {
    headline: "Live data ingestion tunnels…",
    explanation: "Hooked up to X, IG, LinkedIn & Telegram via Composio with zero credential exposure.",
    badge: "COMPOSIO REAL-TIME",
    icon: "🔌",
  },
  '/overview': {
    headline: "Perimeter threat radar…",
    explanation: "NVIDIA Nemotron sweeping open registries and social surfaces 24/7 in sub-seconds.",
    badge: "AI COMMAND CENTER",
    icon: "📡",
  },
  '/sightings': {
    headline: "Let's investigate suspicious domains…",
    explanation: "Discover how Astra tracks typosquatting, fast-flux DNS, and live credential harvesting payloads.",
    badge: "RAW TELEMETRY ARCHIVE",
    icon: "🌐",
  },
  '/alerts': {
    headline: "Meet your social impersonation detector…",
    explanation: "Catching homoglyphs like '@NexBànk_Help' with sneaky accented characters before customers get scammed.",
    badge: "INCIDENT TRIAGE",
    icon: "🔍",
  },
  '/campaigns': {
    headline: "Connecting the dots across coordinated attacks…",
    explanation: "Operation ShadowBank mapped: 8 linked phishing nodes and a rogue APK tied to one threat actor.",
    badge: "ATTACK TOPOLOGY",
    icon: "🕸️",
  },
  '/apps': {
    headline: "Intercepting rogue mobile APKs…",
    explanation: "Stopping SMS-stealing spyware APKs and bad certs on Telegram before app store distribution.",
    badge: "MOBILE APP RADAR",
    icon: "📱",
  },
  '/responses': {
    headline: "Take action before attackers damage your reputation…",
    explanation: "Cryptographic evidence packets dispatched to Cloudflare and Meta in one tap. Threat neutralized.",
    badge: "ONE-CLICK TAKEDOWNS",
    icon: "⚡",
  },
};

function getRouteKey(route: string): string {
  if (route.startsWith('/campaigns')) return '/campaigns';
  return route.split('?')[0] || route;
}

// ─────────────────────────────────────────────
// GENERATIVE STREAMING TEXT COMPONENT
// ─────────────────────────────────────────────
function GenerativeStreamText({
  text,
  speed = 8,
  onComplete,
}: {
  text: string;
  speed?: number;
  onComplete?: () => void;
}) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setDisplayedLength(0);
    setIsDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      if (i >= text.length) {
        setDisplayedLength(text.length);
        setIsDone(true);
        clearInterval(interval);
        if (onComplete) onComplete();
      } else {
        setDisplayedLength(i);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span>
      {text.slice(0, displayedLength)}
      {!isDone && (
        <span className="inline-block w-1.5 h-3.5 bg-[#0f7b6c] ml-1 animate-pulse align-middle" />
      )}
    </span>
  );
}

// ─────────────────────────────────────────────
// SPOTLIGHT WITH AUTO-SCROLL TO SECTION
// ─────────────────────────────────────────────
interface SpotlightInfo {
  rect: { top: number; left: number; width: number; height: number };
  targetTitle?: string;
}

function useSpotlight(selector?: string, padding = 12, enabled = true) {
  const [spotlight, setSpotlight] = useState<SpotlightInfo | null>(null);

  useEffect(() => {
    if (!selector || !enabled) {
      setSpotlight(null);
      return;
    }

    let isMounted = true;
    let retryTimer: NodeJS.Timeout | null = null;
    let attempts = 0;

    const measureAndScroll = () => {
      attempts++;
      const el = document.querySelector(selector) as HTMLElement | null;

      if (el && isMounted) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {}

        const updateRect = () => {
          if (!isMounted) return;
          const liveRect = el.getBoundingClientRect();
          setSpotlight({
            rect: {
              top: Math.max(0, liveRect.top - padding),
              left: Math.max(0, liveRect.left - padding),
              width: liveRect.width + padding * 2,
              height: liveRect.height + padding * 2,
            },
          });
        };

        updateRect();
        setTimeout(updateRect, 150);
        setTimeout(updateRect, 350);
        return;
      }

      if (attempts < 35 && isMounted) {
        retryTimer = setTimeout(measureAndScroll, 80);
      } else if (isMounted) {
        setSpotlight(null);
      }
    };

    measureAndScroll();

    const handleUpdate = () => {
      const el = selector ? (document.querySelector(selector) as HTMLElement | null) : null;
      if (el && isMounted) {
        const liveRect = el.getBoundingClientRect();
        setSpotlight({
          rect: {
            top: Math.max(0, liveRect.top - padding),
            left: Math.max(0, liveRect.left - padding),
            width: liveRect.width + padding * 2,
            height: liveRect.height + padding * 2,
          },
        });
      }
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [selector, padding, enabled]);

  return spotlight;
}

// ─────────────────────────────────────────────
// FULL-SCREEN CINEMATIC FEATURE INTRODUCTION
// ─────────────────────────────────────────────
function CinematicFeatureIntro({
  stepNumber,
  totalSteps,
  targetTitle,
  intro,
  onDismiss,
}: {
  stepNumber: number;
  totalSteps: number;
  targetTitle: string;
  intro: CinematicIntroMeta;
  onDismiss: () => void;
}) {
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    setTypedChars(0);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTypedChars(i);
      if (i >= intro.headline.length) {
        clearInterval(interval);
      }
    }, 22);

    // Auto-advance after 1.8s
    const timer = setTimeout(() => {
      onDismiss();
    }, 1800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [intro, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100000] flex flex-col justify-between bg-[#070b14] text-white p-6 sm:p-10 select-none overflow-hidden"
    >
      {/* Background glow effects */}
      <div className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(15,123,108,0.22),transparent_70%)] blur-[80px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full">
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
            <p className="text-[10px] text-slate-500 font-medium">{intro.badge}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer backdrop-blur-md"
        >
          <span>Skip Intro</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </div>

      {/* Center Cinematic Typewriter Presentation */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-2xl shadow-[0_0_40px_rgba(15,123,108,0.3)]">
            {intro.icon}
          </div>
        </motion.div>

        {/* Step Badge */}
        <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Step {stepNumber} of {totalSteps} · {targetTitle}</span>
        </div>

        {/* Big Centered Typewriter Headline */}
        <div className="min-h-[80px] sm:min-h-[96px] flex items-center justify-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            <span>{intro.headline.slice(0, typedChars)}</span>
            <span className="inline-block w-2 sm:w-2.5 h-7 sm:h-10 bg-emerald-400 ml-1.5 align-middle animate-pulse" />
          </h1>
        </div>

        {/* Explanation text fading in underneath */}
        <motion.p
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed"
        >
          {intro.explanation}
        </motion.p>
      </div>

      {/* Bottom Loading Strip */}
      <div className="relative z-10 max-w-md mx-auto w-full text-center">
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8, ease: 'linear' }}
          />
        </div>
        <span className="text-[11px] font-mono text-slate-500">Entering {targetTitle}…</span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// MAIN GUIDED TOUR CONTROLLER
// ─────────────────────────────────────────────
export function GuidedTour() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const {
    isDemoMode,
    tourActive,
    tourStep,
    currentTourStep,
    exitDemoMode,
    skipTour,
    goToStep,
  } = useDemo();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tour lifecycle state
  const [tourPhase, setTourPhase] = useState<'idle' | 'cinematic_intro' | 'page_entering' | 'completed'>('idle');
  const [introMeta, setIntroMeta] = useState<{ stepNumber: number; totalSteps: number; targetTitle: string; intro: CinematicIntroMeta } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Measure and scroll only when idle
  const isSpotlightEnabled = tourPhase === 'idle' && !isMinimized;
  const spotlight = useSpotlight(
    currentTourStep?.targetSelector,
    currentTourStep?.spotlightPadding ?? 12,
    isSpotlightEnabled
  );

  const navigatingToRouteRef = useRef<string | null>(null);

  // Directly handle next step with coordinated cinematic sequence
  const handleNext = () => {
    if (tourStep >= TOUR_STEPS.length - 1) {
      setTourPhase('completed');
      return;
    }

    const nextIdx = tourStep + 1;
    const targetStep = TOUR_STEPS[nextIdx];
    if (!targetStep) return;

    if (targetStep.route !== pathname) {
      // 1. Route transition: show full-screen cinematic intro
      const routeKey = getRouteKey(targetStep.route);
      const introData = FEATURE_CINEMATIC_INTROS[routeKey] || {
        headline: `Entering ${targetStep.title}…`,
        explanation: targetStep.description,
        badge: 'SECURITY MODULE',
        icon: targetStep.icon || '🛡️',
      };

      setIntroMeta({
        stepNumber: targetStep.stepNumber,
        totalSteps: targetStep.totalSteps,
        targetTitle: targetStep.title,
        intro: introData,
      });

      setTourPhase('cinematic_intro');
      navigatingToRouteRef.current = targetStep.route;

      // 2. Preload and navigate route in background
      router.push(targetStep.route + '?demo=true');
      goToStep(nextIdx);
    } else {
      // Same route step change
      goToStep(nextIdx);
    }
  };

  // Directly handle previous step
  const handlePrev = () => {
    const prevIdx = Math.max(tourStep - 1, 0);
    const targetStep = TOUR_STEPS[prevIdx];
    if (!targetStep) return;

    if (targetStep.route !== pathname) {
      navigatingToRouteRef.current = targetStep.route;
      router.push(targetStep.route + '?demo=true');
    }
    goToStep(prevIdx);
  };

  // Dismiss cinematic intro and reveal the page
  const handleDismissIntro = () => {
    setTourPhase('page_entering');
    setTimeout(() => {
      setTourPhase('idle');
    }, 200);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!tourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (tourPhase === 'cinematic_intro') {
          handleDismissIntro();
        } else {
          handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (tourPhase === 'idle') handlePrev();
      } else if (e.key === 'Escape') {
        if (tourPhase === 'cinematic_intro') {
          handleDismissIntro();
        } else {
          setIsMinimized((v) => !v);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tourActive, tourStep, tourPhase, pathname]);

  // Keep tour step aligned if user navigated directly outside the tour
  useEffect(() => {
    if (!tourActive) return;

    // If an in-flight tour navigation is happening, check if we reached destination
    if (navigatingToRouteRef.current) {
      if (pathname === navigatingToRouteRef.current) {
        navigatingToRouteRef.current = null;
      }
      return; // Do not clobber tourStep during tour-driven navigation!
    }

    // Only sync if user manually navigated to another route
    if (TOUR_STEPS[tourStep]?.route !== pathname) {
      const stepOnRoute = TOUR_STEPS.findIndex((s) => s.route === pathname);
      if (stepOnRoute !== -1) {
        goToStep(stepOnRoute);
      }
    }
  }, [pathname, tourActive, tourStep, goToStep]);

  // If on login/signup page or demo is not active or not mounted yet, completely unmount!
  if (!mounted || !isDemoMode || !tourActive || !currentTourStep) return null;
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname === '/demo') return null;

  const isFirst = tourStep === 0;
  const isLast = tourStep === TOUR_STEPS.length - 1;
  const nextStepMeta = !isLast ? TOUR_STEPS[tourStep + 1] : null;

  const handleExitDemo = () => {
    exitDemoMode();
    router.push('/sign-in');
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. FULL-SCREEN CINEMATIC FEATURE INTRODUCTION
          (Only active during route transitions — NO other tour UI underneath)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {tourPhase === 'cinematic_intro' && introMeta && (
          <CinematicFeatureIntro
            stepNumber={introMeta.stepNumber}
            totalSteps={introMeta.totalSteps}
            targetTitle={introMeta.targetTitle}
            intro={introMeta.intro}
            onDismiss={handleDismissIntro}
          />
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          2. SPOTLIGHT HIGHLIGHT AROUND TARGETED COMPONENT
          (Only active when settled in idle phase)
         ───────────────────────────────────────────────────────────── */}
      {tourPhase === 'idle' && spotlight && (
        <div className="fixed inset-0 z-[10000] pointer-events-none">
          <motion.div
            key={`spotlight-${tourStep}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed z-[10001] rounded-2xl pointer-events-none"
            style={{
              top: spotlight.rect.top,
              left: spotlight.rect.left,
              width: spotlight.rect.width,
              height: spotlight.rect.height,
              boxShadow: '0 0 0 2px #0f7b6c, 0 0 0 6px rgba(15, 123, 108, 0.20), 0 10px 40px rgba(15, 123, 108, 0.22)',
            }}
          >
            <div className="absolute -top-3.5 left-4 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0f7b6c] text-white text-[10px] font-bold shadow-md tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>Section Focus · {currentTourStep.title}</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. ONE SINGLE CONTEXTUAL TOUR PANEL
          (Consolidated narrative + controls. No duplicate bottom dock!)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {tourPhase === 'idle' && (
          <motion.div
            key={`tour-panel-${tourStep}`}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="pointer-events-auto fixed bottom-5 left-1/2 -translate-x-1/2 z-[10005] w-[calc(100vw-32px)] max-w-2xl rounded-2xl border border-[#e3e2e0] bg-white/98 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.14)] p-4 sm:p-5 overflow-hidden"
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0f7b6c] via-cyan-500 to-[#0f7b6c]" />

            {/* Row 1: Header */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base">{currentTourStep.icon}</span>
                <span className="rounded-full bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Step {currentTourStep.stepNumber} of {currentTourStep.totalSteps} · {currentTourStep.title}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{currentTourStep.telemetryBadge || 'Perimeter Active'}</span>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goToStep(0)}
                  title="Restart from step 1"
                  className="rounded-md p-1 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={skipTour}
                  title="Close tour"
                  className="rounded-md p-1 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Row 2: Headline & Description */}
            <h3 className="text-base sm:text-lg font-bold text-[#37352f] leading-snug">
              {currentTourStep.headline}
            </h3>
            <p className="mt-1 text-xs text-[#787774] leading-relaxed">
              <GenerativeStreamText text={currentTourStep.description} speed={8} />
            </p>

            {/* Discovered Forensic Chips */}
            {currentTourStep.findingsDiscovered && currentTourStep.findingsDiscovered.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-[#f0efed]">
                {currentTourStep.findingsDiscovered.map((finding) => (
                  <span
                    key={finding}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f7f6f3] border border-[#e3e2e0] text-[10px] font-medium text-[#37352f]"
                  >
                    <Shield className="w-2.5 h-2.5 text-[#0f7b6c]" />
                    <span>{finding}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Interactive Hint */}
            {currentTourStep.interactionHint && (
              <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-[#0f7b6c]/20 bg-[#0f7b6c]/5 px-2.5 py-1 text-xs font-semibold text-[#0f7b6c]">
                <Eye className="h-3.5 w-3.5 shrink-0" />
                <span>{currentTourStep.interactionHint}</span>
              </div>
            )}

            {/* Row 3: Integrated Navigation Controls */}
            <div className="mt-3.5 pt-3 border-t border-[#f0efed] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExitDemo}
                  className="text-xs text-[#787774] hover:text-[#eb5757] font-medium flex items-center gap-1.5 transition cursor-pointer py-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit Demo</span>
                </button>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <button
                  type="button"
                  onClick={skipTour}
                  className="text-xs text-[#787774] hover:text-[#37352f] font-medium transition cursor-pointer py-1"
                >
                  Skip Tour
                </button>
              </div>

              {/* Progress Dots */}
              <div className="hidden md:flex items-center gap-1.5">
                {TOUR_STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => goToStep(idx)}
                    title={`Go to step ${idx + 1}: ${s.title}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === tourStep ? 'w-5 bg-[#0f7b6c]' : 'w-1.5 bg-[#e3e2e0] hover:bg-[#9b9a97]'
                    }`}
                  />
                ))}
              </div>

              {/* Prev & Next Controls */}
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="flex items-center gap-1 rounded-lg border border-[#e3e2e0] bg-white px-3 py-1.5 text-xs font-semibold text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer shadow-2xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>
                )}

                {isLast ? (
                  <button
                    type="button"
                    onClick={() => setTourPhase('completed')}
                    className="flex items-center gap-1.5 rounded-lg bg-[#0f7b6c] hover:bg-[#0c6357] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Finish Tour</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 rounded-lg bg-[#0f7b6c] hover:bg-[#0c6357] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer ring-2 ring-[#0f7b6c]/20"
                  >
                    <span>Next{nextStepMeta ? `: ${nextStepMeta.title}` : ''}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          4. TOUR COMPLETION MODAL
         ───────────────────────────────────────────────────────────── */}
      <TourCompletionModal
        isOpen={tourPhase === 'completed'}
        onClose={() => setTourPhase('idle')}
        onRestartTour={() => {
          goToStep(0);
          setTourPhase('idle');
          const firstStep = TOUR_STEPS[0];
          if (firstStep && firstStep.route !== pathname) {
            router.push(firstStep.route + '?demo=true');
          }
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// FLOATING TOUR LAUNCHER (When tour is dismissed/skipped)
// ─────────────────────────────────────────────
export function TourLauncher() {
  const [mounted, setMounted] = useState(false);
  const { isDemoMode, tourActive, startTour } = useDemo();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isDemoMode || tourActive) return null;
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname === '/demo') return null;

  return (
    <motion.button
      type="button"
      onClick={startTour}
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl border border-[#0f7b6c]/30 bg-white/95 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-[#0f7b6c] shadow-[0_10px_30px_rgba(15,123,108,0.22)] hover:bg-[#f7f6f3] transition cursor-pointer"
    >
      <Compass className="h-4 w-4 text-[#0f7b6c]" />
      <span>Resume BYTE XL Tour</span>
    </motion.button>
  );
}
