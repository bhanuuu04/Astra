'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  Info,
} from 'lucide-react';
import { useDemo, TOUR_STEPS, type TourStep } from '@/providers/DemoProvider';

// ─────────────────────────────────────────────
// SPOTLIGHT: highlights a DOM element
// ─────────────────────────────────────────────
interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function useSpotlight(selector?: string, padding = 10) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        top: Math.max(0, r.top - padding),
        left: Math.max(0, r.left - padding),
        width: r.width + padding * 2,
        height: r.height + padding * 2,
      });
    };

    const timer = setTimeout(measure, 300);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [selector, padding]);

  return rect;
}

// ─────────────────────────────────────────────
// TOUR PROGRESS DOTS (Light Theme)
// ─────────────────────────────────────────────
function TourProgressDots({
  current,
  total,
  onGoTo,
}: {
  current: number;
  total: number;
  onGoTo: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5" role="tablist" aria-label="Tour navigation progress">
      {Array.from({ length: total }).map((_, i) => {
        const stepMeta = TOUR_STEPS[i];
        const isActive = i === current;
        const isCompleted = i < current;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onGoTo(i)}
            title={`Step ${i + 1}: ${stepMeta?.title || ''}`}
            aria-label={`Go to step ${i + 1}: ${stepMeta?.title || ''}`}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              isActive
                ? 'w-6 h-2 bg-[#0f7b6c] shadow-xs'
                : isCompleted
                ? 'w-2 h-2 bg-[#0f7b6c]/50 hover:bg-[#0f7b6c]'
                : 'w-2 h-2 bg-[#e3e2e0] hover:bg-[#9b9a97]'
            }`}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// CHAPTER MENU (Tour Map)
// ─────────────────────────────────────────────
function ChapterMenu({
  current,
  onClose,
}: {
  current: number;
  onClose: () => void;
}) {
  const { goToStep } = useDemo();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 12 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10010] w-[calc(100vw-32px)] max-w-md rounded-2xl border border-[#e3e2e0] bg-white/98 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e3e2e0] bg-[#fafaf9]">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-[#0f7b6c]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#37352f]">BYTE XL Tour Map</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Tour Map"
          className="rounded-md p-1 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="py-2 max-h-[60vh] overflow-y-auto divide-y divide-[#f7f6f3]">
        {TOUR_STEPS.map((step, i) => (
          <button
            key={step.id}
            type="button"
            onClick={() => {
              goToStep(i);
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs transition cursor-pointer hover:bg-[#f7f6f3] ${
              i === current
                ? 'bg-[#0f7b6c]/10 text-[#0f7b6c] font-bold'
                : 'text-[#787774] hover:text-[#37352f]'
            }`}
          >
            <span className="text-base shrink-0">{step.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-[#9b9a97]">Step {i + 1}</span>
                <span className="font-semibold text-[#37352f] truncate">{step.title}</span>
              </div>
              <p className="text-[11px] text-[#787774] truncate">{step.headline}</p>
            </div>
            {i < current && (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#0f7b6c] text-[10px] font-bold">
                ✓
              </span>
            )}
            {i === current && (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0f7b6c] text-white text-[9px] font-bold">
                ●
              </span>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// FLOATING TOUR DOCK & CONTROLLER
// ─────────────────────────────────────────────
export function GuidedTour() {
  const router = useRouter();
  const {
    isDemoMode,
    tourActive,
    tourStep,
    currentTourStep,
    nextTourStep,
    prevTourStep,
    skipTour,
    goToStep,
  } = useDemo();

  const [showChapterMenu, setShowChapterMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const prevStepRef = useRef<number>(-1);
  const navLockRef = useRef(false);

  // Auto-route on step change
  useEffect(() => {
    if (!currentTourStep || !tourActive) return;
    if (prevStepRef.current === tourStep) return;
    prevStepRef.current = tourStep;

    if (navLockRef.current) return;
    navLockRef.current = true;
    router.push(currentTourStep.route);
    setTimeout(() => {
      navLockRef.current = false;
    }, 500);
  }, [tourStep, currentTourStep, tourActive, router]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!tourActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in form inputs
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextTourStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevTourStep();
      } else if (e.key === 'Escape') {
        if (showChapterMenu) setShowChapterMenu(false);
        else setShowDetails((v) => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tourActive, nextTourStep, prevTourStep, showChapterMenu]);

  const spotlightRect = useSpotlight(
    currentTourStep?.targetSelector,
    currentTourStep?.spotlightPadding ?? 10
  );

  if (!isDemoMode || !tourActive || !currentTourStep) return null;

  const isFirst = tourStep === 0;
  const isLast = tourStep === TOUR_STEPS.length - 1;
  const nextStepMeta = !isLast ? TOUR_STEPS[tourStep + 1] : null;

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {/* Target element spotlight border & halo (non-blocking) */}
      {spotlightRect && (
        <>
          <motion.div
            key={`spotlight-${tourStep}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed z-[10001] rounded-xl pointer-events-none"
            style={{
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
              boxShadow: '0 0 0 2px #0f7b6c, 0 0 0 5px rgba(15, 123, 108, 0.20), 0 0 25px rgba(15, 123, 108, 0.25)',
            }}
          />
          <motion.div
            key={`pulse-${tourStep}`}
            animate={{ opacity: [0.15, 0.45, 0.15], scale: [0.99, 1.01, 0.99] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="fixed z-[10001] rounded-xl pointer-events-none"
            style={{
              top: spotlightRect.top - 4,
              left: spotlightRect.left - 4,
              width: spotlightRect.width + 8,
              height: spotlightRect.height + 8,
              border: '2px dashed rgba(15, 123, 108, 0.5)',
            }}
          />
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EXPANDABLE CONTEXT CARD (Floating directly above navigation)
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
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{currentTourStep.icon}</span>
                  <span className="rounded-full bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Step {currentTourStep.stepNumber} of {currentTourStep.totalSteps}
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

              <h3 className="text-base sm:text-lg font-bold text-[#37352f] leading-snug">
                {currentTourStep.headline}
              </h3>
              <p className="mt-1.5 text-xs text-[#787774] leading-relaxed">
                {currentTourStep.description}
              </p>

              {currentTourStep.interactionHint && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#0f7b6c]/20 bg-[#0f7b6c]/5 px-3 py-1.5 text-xs font-medium text-[#0f7b6c]">
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  <span>{currentTourStep.interactionHint}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          SHORT FLOATING NAVIGATION CONTROLLER (Always docked at bottom)
         ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="pointer-events-auto fixed bottom-4 left-1/2 -translate-x-1/2 z-[10005] w-[calc(100vw-24px)] max-w-4xl"
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
                <span className="rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] px-1.5 py-0.5 text-[10px] font-bold">
                  {currentTourStep.stepNumber}/{currentTourStep.totalSteps}
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

          {/* Center: Progress dots (desktop only) */}
          <div className="hidden md:flex items-center px-2">
            <TourProgressDots
              current={tourStep}
              total={TOUR_STEPS.length}
              onGoTo={goToStep}
            />
          </div>

          {/* Right: Short Navigation Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowChapterMenu((v) => !v)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#e3e2e0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#787774] hover:text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer shadow-2xs"
              title="View all 12 tour steps"
              aria-label="View all 12 tour steps"
            >
              <Map className="h-3.5 w-3.5 text-[#0f7b6c]" />
              <span>Tour Map</span>
            </button>

            {!isFirst && (
              <button
                type="button"
                onClick={prevTourStep}
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
                onClick={skipTour}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-1.5 rounded-xl bg-[#0f7b6c] hover:bg-[#0c6357] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Finish Tour</span>
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={nextTourStep}
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

            <button
              type="button"
              onClick={skipTour}
              title="Skip or exit tour"
              aria-label="Skip or exit tour"
              className="rounded-lg p-1.5 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tour Map Modal */}
      <AnimatePresence>
        {showChapterMenu && (
          <div className="pointer-events-auto">
            <ChapterMenu
              current={tourStep}
              onClose={() => setShowChapterMenu(false)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// FLOATING TOUR LAUNCHER (When tour is minimized)
// ─────────────────────────────────────────────
export function TourLauncher() {
  const { isDemoMode, tourActive, startTour } = useDemo();
  if (!isDemoMode || tourActive) return null;

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
