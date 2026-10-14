'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  X,
  RotateCcw,
  Map,
  ChevronRight,
  Zap,
  Shield,
  Eye,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Check,
  CheckCircle2,
  Activity,
  LogOut,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useDemo, TOUR_STEPS, type TourStep } from '@/providers/DemoProvider';

// ─────────────────────────────────────────────
// GENERATIVE STREAMING TEXT COMPONENT
// ─────────────────────────────────────────────
function GenerativeStreamText({
  text,
  speed = 10,
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
      i += 3; // Streams 3 chars per tick for smooth, snappy filling
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

function useSpotlight(selector?: string, padding = 12) {
  const [spotlight, setSpotlight] = useState<SpotlightInfo | null>(null);

  useEffect(() => {
    if (!selector) {
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
        // 1. Smooth scroll to the target section taking fixed bars into account
        const r = el.getBoundingClientRect();
        const absoluteTop = r.top + window.scrollY;
        // Vertically center with topbar and dock offset
        const targetScrollY = Math.max(0, absoluteTop - (window.innerHeight - r.height) / 2);

        window.scrollTo({
          top: targetScrollY,
          behavior: 'smooth',
        });

        // 2. Measure bounding rect
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
        setTimeout(updateRect, 650);
        return;
      }

      // Retry every 90ms for up to 3.5s to wait for async Next.js page rendering
      if (attempts < 38 && isMounted) {
        retryTimer = setTimeout(measureAndScroll, 90);
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
  }, [selector, padding]);

  return spotlight;
}

// ─────────────────────────────────────────────
// MAIN GUIDED TOUR COMPONENT
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
    nextTourStep,
    prevTourStep,
    exitDemoMode,
    goToStep,
  } = useDemo();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [showDetails, setShowDetails] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(true);

  // Directly handle next step with instant route transition
  const handleNext = () => {
    const nextIdx = Math.min(tourStep + 1, TOUR_STEPS.length - 1);
    const targetStep = TOUR_STEPS[nextIdx];
    if (!targetStep) return;

    goToStep(nextIdx);

    if (targetStep.route !== pathname) {
      router.push(targetStep.route + '?demo=true');
    }
  };

  // Directly handle prev step with instant route transition
  const handlePrev = () => {
    const prevIdx = Math.max(tourStep - 1, 0);
    const targetStep = TOUR_STEPS[prevIdx];
    if (!targetStep) return;

    goToStep(prevIdx);

    if (targetStep.route !== pathname) {
      router.push(targetStep.route + '?demo=true');
    }
  };

  // Keep tour step aligned if user navigated directly
  useEffect(() => {
    if (!tourActive) return;
    const stepOnRoute = TOUR_STEPS.findIndex((s) => s.route === pathname);
    if (stepOnRoute !== -1 && TOUR_STEPS[tourStep]?.route !== pathname) {
      goToStep(stepOnRoute);
    }
  }, [pathname, tourActive, tourStep, goToStep]);

  // Generative AI scanning state on each step change
  useEffect(() => {
    setIsSynthesizing(true);
    const timer = setTimeout(() => {
      setIsSynthesizing(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [tourStep]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!tourActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        setShowDetails((v) => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tourActive, tourStep, pathname]);

  // Measure and smooth-scroll to the targeted section
  const spotlight = useSpotlight(
    currentTourStep?.targetSelector,
    currentTourStep?.spotlightPadding ?? 12
  );

  // If on login/signup page or demo is not active or not mounted yet, completely unmount!
  if (!mounted || !isDemoMode || !tourActive || !currentTourStep) return null;
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) return null;

  const isFirst = tourStep === 0;
  const isLast = tourStep === TOUR_STEPS.length - 1;
  const nextStepMeta = !isLast ? TOUR_STEPS[tourStep + 1] : null;

  // Fully purge demo session and redirect to /sign-in
  const handleExitDemo = () => {
    exitDemoMode();
    router.push('/sign-in');
  };

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {/* ─────────────────────────────────────────────────────────────
          1. SECTION SCROLL & SPOTLIGHT HIGHLIGHT WITH PINNED BADGE
         ───────────────────────────────────────────────────────────── */}
      {spotlight && (
        <>
          {/* Spotlight border with glow around the targeted section */}
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
            {/* Pinned section focus tag */}
            <div className="absolute -top-3.5 left-4 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0f7b6c] text-white text-[10px] font-bold shadow-md tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>Section Focus · {currentTourStep.title}</span>
            </div>
          </motion.div>

          {/* Animated pulsing dashed radar ring */}
          <motion.div
            key={`pulse-${tourStep}`}
            animate={{ opacity: [0.15, 0.45, 0.15], scale: [0.995, 1.008, 0.995] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="fixed z-[10001] rounded-2xl pointer-events-none"
            style={{
              top: spotlight.rect.top - 4,
              left: spotlight.rect.left - 4,
              width: spotlight.rect.width + 8,
              height: spotlight.rect.height + 8,
              border: '2px dashed rgba(15, 123, 108, 0.55)',
            }}
          />
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. GENERATIVE EXPLANATION CARD (Smooth typing & finding reveal)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            key={`details-${tourStep}`}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="pointer-events-auto fixed bottom-22 left-1/2 -translate-x-1/2 z-[10004] w-[calc(100vw-32px)] max-w-xl rounded-2xl border border-[#e3e2e0] bg-white/98 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden"
          >
            {/* Top gradient accent */}
            <div className="h-1 w-full bg-gradient-to-r from-[#0f7b6c] via-cyan-600 to-[#0f7b6c]" />

            <div className="p-4 sm:p-5">
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg leading-none">{currentTourStep.icon}</span>
                  <span className="rounded-full bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Guided Tour · Step {currentTourStep.stepNumber}
                  </span>
                  <span className="text-xs font-semibold text-[#787774] truncate hidden sm:inline">
                    {currentTourStep.title}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => goToStep(0)}
                    title="Restart from step 1"
                    aria-label="Restart tour from step 1"
                    className="rounded-md p-1 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDetails(false)}
                    title="Minimize explanation"
                    aria-label="Minimize explanation card"
                    className="rounded-md p-1 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Generative AI Telemetry Tag */}
              <div className="mb-2.5">
                {isSynthesizing ? (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-[#0f7b6c]/8 border border-[#0f7b6c]/20 px-2.5 py-1 text-[11px] font-medium text-[#0f7b6c]">
                    <Activity className="h-3.5 w-3.5 animate-spin" />
                    <span>Nemotron AI Sweeping Perimeter · Finding threat vectors…</span>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-[#0f7b6c]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#0f7b6c]" />
                    <span>{currentTourStep.telemetryBadge || 'Perimeter Synthesis Complete'}</span>
                    <span className="text-[10px] text-[#0f7b6c]/80 font-mono">· 98% AI confidence</span>
                  </motion.div>
                )}
              </div>

              {/* Headline */}
              <h3 className="text-base sm:text-lg font-bold text-[#37352f] leading-snug">
                {currentTourStep.headline}
              </h3>

              {/* Generative streaming description text */}
              <p className="mt-2 text-xs text-[#787774] leading-relaxed min-h-[42px]">
                <GenerativeStreamText text={currentTourStep.description} speed={10} />
              </p>

              {/* Forensic Findings Chips (Discovered items reveal) */}
              {currentTourStep.findingsDiscovered && currentTourStep.findingsDiscovered.length > 0 && (
                <div className="mt-3.5 flex flex-wrap gap-1.5 pt-2 border-t border-[#f0efed]">
                  {currentTourStep.findingsDiscovered.map((finding, idx) => (
                    <motion.div
                      key={finding}
                      initial={{ opacity: 0, y: 6, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.15 + idx * 0.08, duration: 0.2 }}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#f7f6f3] border border-[#e3e2e0] text-[11px] font-medium text-[#37352f]"
                    >
                      <Shield className="w-3 h-3 text-[#0f7b6c]" />
                      <span>{finding}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Interaction Hint */}
              {currentTourStep.interactionHint && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#0f7b6c]/20 bg-[#0f7b6c]/5 px-3 py-1.5 text-xs font-semibold text-[#0f7b6c]">
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  <span>{currentTourStep.interactionHint}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          4. DOCKED SHORT NAVIGATION CONTROLLER
         ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="pointer-events-auto fixed bottom-4 left-1/2 -translate-x-1/2 z-[10005] w-[calc(100vw-24px)] max-w-2xl"
      >
        <div className="rounded-2xl border border-[#e3e2e0] bg-white/95 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)] px-3.5 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          {/* Left: Step Badge & Headline */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20 hover:bg-[#0f7b6c]/20 transition cursor-pointer"
              title={showDetails ? 'Minimize details' : 'Show details'}
              aria-label={showDetails ? 'Minimize details' : 'Show details'}
            >
              <Sparkles className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] px-2 py-0.5 text-[10px] font-bold">
                  Step {currentTourStep.stepNumber}
                </span>
                <span className="text-xs font-bold text-[#37352f] truncate">
                  {currentTourStep.title}
                </span>
              </div>
              <p className="text-[11px] text-[#787774] truncate hidden sm:block">
                {currentTourStep.headline}
              </p>
            </div>
          </div>

          {/* Right: Short Navigation Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 rounded-lg border border-[#e3e2e0] bg-white px-3 py-1.5 text-xs font-semibold text-[#787774] hover:text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer shadow-2xs"
                title="Go to previous step (Left Arrow)"
                aria-label="Go to previous step"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>
            )}

            {isLast ? (
              <motion.button
                type="button"
                onClick={handleExitDemo}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-1.5 rounded-xl bg-[#0f7b6c] hover:bg-[#0c6357] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Finish &amp; Sign In</span>
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={handleNext}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-1.5 rounded-xl bg-[#0f7b6c] hover:bg-[#0c6357] px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer ring-2 ring-[#0f7b6c]/20"
                title="Go to next step (Right Arrow)"
                aria-label="Go to next step"
              >
                <span>Next{nextStepMeta ? `: ${nextStepMeta.title}` : ''}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </motion.button>
            )}

            {/* Explicit Exit Demo Button: Clears all demo state & redirects to /sign-in */}
            <button
              type="button"
              onClick={handleExitDemo}
              title="Exit BYTE XL Demo and return to sign-in page"
              aria-label="Exit BYTE XL Demo"
              className="flex items-center gap-1 rounded-lg border border-[#e3e2e0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#787774] hover:text-[#eb5757] hover:border-rose-200 hover:bg-rose-50 transition cursor-pointer shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Exit Demo</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FLOATING TOUR LAUNCHER (When tour is minimized)
// ─────────────────────────────────────────────
export function TourLauncher() {
  const [mounted, setMounted] = useState(false);
  const { isDemoMode, tourActive, startTour } = useDemo();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // If on login/signup page or not in demo mode or not mounted yet, NEVER render launcher!
  if (!mounted || !isDemoMode || tourActive) return null;
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) return null;

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
      <Zap className="h-4 w-4 text-[#0f7b6c]" />
      <span>Resume BYTE XL Tour</span>
    </motion.button>
  );
}
