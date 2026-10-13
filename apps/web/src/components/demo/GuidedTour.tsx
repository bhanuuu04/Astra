'use client';

import React, { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import { useDemo, TOUR_STEPS, type TourStep } from '@/providers/DemoProvider';

// ─────────────────────────────────────────────
// SPOTLIGHT: highlights a DOM element
// ─────────────────────────────────────────────
interface SpotlightRect { top: number; left: number; width: number; height: number }

function useSpotlight(selector?: string, padding = 12) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (!selector) { setRect(null); return; }

    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - padding,
        left: r.left - padding,
        width: r.width + padding * 2,
        height: r.height + padding * 2,
      });
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const timer = setTimeout(measure, 350);
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
// PROGRESS DOTS (Light Theme)
// ─────────────────────────────────────────────
function TourProgressDots({ current, total, onGoTo }: { current: number; total: number; onGoTo: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onGoTo(i)}
          aria-label={`Go to step ${i + 1}`}
          className={`rounded-full transition-all duration-300 cursor-pointer ${
            i === current
              ? 'w-5 h-2 bg-[#0f7b6c]'
              : i < current
              ? 'w-2 h-2 bg-[#0f7b6c]/40'
              : 'w-2 h-2 bg-[#e3e2e0]'
          }`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// TOUR CARD / TOOLTIP (Light Theme)
// ─────────────────────────────────────────────
function TourCard({
  step,
  onNext,
  onPrev,
  onSkip,
  onRestart,
  spotlightRect,
}: {
  step: TourStep;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onRestart: () => void;
  spotlightRect: SpotlightRect | null;
}) {
  const isFirst = step.stepNumber === 1;
  const isLast = step.stepNumber === step.totalSteps;
  const { goToStep } = useDemo();

  // Position tooltip relative to spotlight
  const getCardStyle = (): React.CSSProperties => {
    if (!spotlightRect || step.tooltipPosition === 'center') {
      return {
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(480px, calc(100vw - 48px))',
        zIndex: 10001,
      };
    }

    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const cardW = 440;
    const cardH = 300;

    let top = 0, left = 0;

    switch (step.tooltipPosition) {
      case 'bottom':
        top = Math.min(spotlightRect.top + spotlightRect.height + 16, viewH - cardH - 16);
        left = Math.max(16, Math.min(spotlightRect.left, viewW - cardW - 16));
        break;
      case 'top':
        top = Math.max(16, spotlightRect.top - cardH - 16);
        left = Math.max(16, Math.min(spotlightRect.left, viewW - cardW - 16));
        break;
      case 'right':
        top = Math.max(16, spotlightRect.top);
        left = Math.min(spotlightRect.left + spotlightRect.width + 16, viewW - cardW - 16);
        break;
      case 'left':
        top = Math.max(16, spotlightRect.top);
        left = Math.max(16, spotlightRect.left - cardW - 16);
        break;
      default:
        top = viewH / 2 - cardH / 2;
        left = viewW / 2 - cardW / 2;
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardW}px`,
      zIndex: 10001,
    };
  };

  return (
    <motion.div
      key={step.id}
      style={getCardStyle()}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="rounded-2xl border border-[#e3e2e0] bg-white/98 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden"
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0f7b6c] via-cyan-600 to-[#0f7b6c]" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{step.icon}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0f7b6c]">
            Step {step.stepNumber} of {step.totalSteps}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRestart}
            title="Restart tour from step 1"
            className="rounded-lg p-1.5 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onSkip}
            title="Skip tour"
            className="rounded-lg p-1.5 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        <h3 className="text-lg font-bold text-[#37352f] leading-snug">{step.headline}</h3>
        <p className="mt-2 text-xs leading-relaxed text-[#787774]">{step.description}</p>

        {step.interactionHint && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#0f7b6c]/20 bg-[#0f7b6c]/5 px-3 py-2">
            <Eye className="h-3.5 w-3.5 shrink-0 text-[#0f7b6c]" />
            <span className="text-xs font-semibold text-[#0f7b6c]">{step.interactionHint}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#e3e2e0] bg-[#fafaf9] px-5 py-3">
        <TourProgressDots
          current={step.stepNumber - 1}
          total={step.totalSteps}
          onGoTo={goToStep}
        />

        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              type="button"
              onClick={onPrev}
              className="flex items-center gap-1.5 rounded-lg border border-[#e3e2e0] bg-white px-3 py-1.5 text-xs font-medium text-[#787774] hover:text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Prev
            </button>
          )}

          {isLast ? (
            <button
              type="button"
              onClick={onSkip}
              className="flex items-center gap-1.5 rounded-lg bg-[#0f7b6c] hover:bg-[#0c6357] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5" /> Finish Tour
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-1.5 rounded-lg bg-[#0f7b6c] hover:bg-[#0c6357] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// CHAPTER MENU (Light Theme)
// ─────────────────────────────────────────────
function ChapterMenu({ current, onClose }: { current: number; onClose: () => void }) {
  const { goToStep } = useDemo();
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-5 top-1/2 -translate-y-1/2 z-[10002] w-64 rounded-2xl border border-[#e3e2e0] bg-white/98 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e3e2e0] bg-[#fafaf9]">
        <span className="text-xs font-bold uppercase tracking-wider text-[#37352f]">Tour Map</span>
        <button type="button" onClick={onClose} className="text-[#9b9a97] hover:text-[#37352f] cursor-pointer"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="py-1.5 max-h-80 overflow-y-auto">
        {TOUR_STEPS.map((step, i) => (
          <button
            key={step.id}
            type="button"
            onClick={() => { goToStep(i); onClose(); }}
            className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs transition cursor-pointer hover:bg-[#f7f6f3] ${
              i === current
                ? 'bg-[#0f7b6c]/10 text-[#0f7b6c] font-bold'
                : 'text-[#787774] hover:text-[#37352f]'
            }`}
          >
            <span className="text-sm shrink-0">{step.icon}</span>
            <span className="truncate">{step.title}</span>
            {i < current && <span className="ml-auto text-[#0f7b6c] font-bold shrink-0">✓</span>}
            {i === current && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0f7b6c] shrink-0" />}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// MAIN GUIDED TOUR OVERLAY (Light Theme)
// ─────────────────────────────────────────────
export function GuidedTour() {
  const router = useRouter();
  const {
    isDemoMode, tourActive, tourStep, currentTourStep,
    nextTourStep, prevTourStep, skipTour, goToStep,
  } = useDemo();
  const [showChapterMenu, setShowChapterMenu] = useState(false);
  const prevStepRef = useRef<number>(-1);
  const navLockRef = useRef(false);

  // Navigate to the correct route when step changes
  useEffect(() => {
    if (!currentTourStep || !tourActive) return;
    if (prevStepRef.current === tourStep) return;
    prevStepRef.current = tourStep;

    if (navLockRef.current) return;
    navLockRef.current = true;
    router.push(currentTourStep.route);
    setTimeout(() => { navLockRef.current = false; }, 600);
  }, [tourStep, currentTourStep, tourActive, router]);

  const spotlightRect = useSpotlight(
    currentTourStep?.targetSelector,
    currentTourStep?.spotlightPadding ?? 12
  );

  if (!isDemoMode || !tourActive || !currentTourStep) return null;

  const hasSpotlight = !!spotlightRect && currentTourStep.tooltipPosition !== 'center';

  return (
    <AnimatePresence mode="wait">
      {/* Dimmed backdrop overlay */}
      <motion.div
        key="tour-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] pointer-events-none"
        style={{
          background: hasSpotlight
            ? `radial-gradient(ellipse at ${(spotlightRect!.left + spotlightRect!.width / 2) / window.innerWidth * 100}% ${(spotlightRect!.top + spotlightRect!.height / 2) / window.innerHeight * 100}%, transparent ${Math.max(spotlightRect!.width, spotlightRect!.height) * 0.52}px, rgba(15,23,42,0.40) ${Math.max(spotlightRect!.width, spotlightRect!.height) * 0.78}px)`
            : 'rgba(15,23,42,0.35)',
        }}
      />

      {/* Spotlight border */}
      {hasSpotlight && (
        <motion.div
          key="spotlight"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed z-[10001] rounded-xl pointer-events-none"
          style={{
            top: spotlightRect!.top,
            left: spotlightRect!.left,
            width: spotlightRect!.width,
            height: spotlightRect!.height,
            boxShadow: `0 0 0 2px #0f7b6c, 0 0 0 5px rgba(15, 123, 108, 0.25), 0 0 24px rgba(15, 123, 108, 0.35)`,
          }}
        />
      )}

      {/* Animated pulse ring */}
      {hasSpotlight && (
        <motion.div
          key="pulse"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 0.35, 0], scale: [0.95, 1.05, 1.05] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          className="fixed z-[10000] rounded-xl pointer-events-none"
          style={{
            top: spotlightRect!.top - 6,
            left: spotlightRect!.left - 6,
            width: spotlightRect!.width + 12,
            height: spotlightRect!.height + 12,
            border: `2px solid #0f7b6c`,
          }}
        />
      )}

      {/* Tour Card */}
      <AnimatePresence mode="wait">
        <TourCard
          key={`card-${tourStep}`}
          step={currentTourStep}
          onNext={nextTourStep}
          onPrev={prevTourStep}
          onSkip={skipTour}
          onRestart={() => goToStep(0)}
          spotlightRect={spotlightRect}
        />
      </AnimatePresence>

      {/* Controls Bar (Tour Map & Skip) */}
      <div className="fixed left-5 bottom-8 z-[10002] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowChapterMenu((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-[#e3e2e0] bg-white/95 backdrop-blur px-3.5 py-2 text-xs font-semibold text-[#37352f] shadow-md hover:bg-[#f7f6f3] transition cursor-pointer"
        >
          <Map className="h-3.5 w-3.5 text-[#0f7b6c]" />
          Tour Map
          <ChevronRight className={`h-3.5 w-3.5 text-[#9b9a97] transition-transform ${showChapterMenu ? 'rotate-90' : ''}`} />
        </button>
        <button
          type="button"
          onClick={skipTour}
          className="rounded-xl border border-[#e3e2e0] bg-white/95 backdrop-blur px-3.5 py-2 text-xs font-medium text-[#787774] hover:text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer shadow-sm"
        >
          Skip Tour
        </button>
      </div>

      {/* Chapter Menu */}
      <AnimatePresence>
        {showChapterMenu && (
          <ChapterMenu current={tourStep} onClose={() => setShowChapterMenu(false)} />
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// FLOATING TOUR LAUNCHER (Light Theme)
// ─────────────────────────────────────────────
export function TourLauncher() {
  const { isDemoMode, tourActive, startTour } = useDemo();
  if (!isDemoMode || tourActive) return null;

  return (
    <motion.button
      type="button"
      onClick={startTour}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-[#0f7b6c]/30 bg-white px-4 py-2.5 text-xs font-bold text-[#0f7b6c] shadow-[0_8px_30px_rgba(15,123,108,0.2)] hover:bg-[#f7f6f3] transition cursor-pointer"
    >
      <Zap className="h-4 w-4 text-[#0f7b6c]" />
      Start Product Tour
    </motion.button>
  );
}
