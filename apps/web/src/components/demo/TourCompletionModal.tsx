'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Shield,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Compass,
  Lock,
  Layers,
  Network,
  Zap,
} from 'lucide-react';
import { useDemo } from '@/providers/DemoProvider';

export function TourCompletionModal({
  isOpen,
  onClose,
  onRestartTour,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRestartTour: () => void;
}) {
  const router = useRouter();
  const { exitDemoMode, resetDemo } = useDemo();

  const headline = "You've experienced Astra. Now make it yours.";
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setTypedChars(0);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTypedChars(i);
      if (i >= headline.length) {
        clearInterval(interval);
      }
    }, 24);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Google OAuth handoff
  const handleContinueWithGoogle = () => {
    // 1. Terminate synthetic demo session
    exitDemoMode();
    // 2. Redirect to sign-in with Google OAuth strategy
    router.push('/sign-in?strategy=oauth_google');
  };

  // Handle free demo exploration
  const handleContinueExploring = () => {
    onClose();
    // Keep user in the demo environment with full interactive freedom!
  };

  const handleResetAndRestart = () => {
    resetDemo();
    onRestartTour();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-[100002] flex items-center justify-center p-4 bg-[#070b14]/90 backdrop-blur-xl select-none"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-[#0b1322] text-white p-6 sm:p-9 shadow-[0_30px_90px_rgba(0,0,0,0.6)] overflow-hidden"
        >
          {/* Top glowing gradient ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />

          {/* Badge & Shield */}
          <div className="flex items-center justify-between mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>BYTE XL Tour Completed</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>12/12 Steps Mitigated</span>
            </div>
          </div>

          {/* Dynamic Typewritten Headline */}
          <div className="min-h-[56px] sm:min-h-[70px]">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              <span>{headline.slice(0, typedChars)}</span>
              <span className="inline-block w-2 h-6 bg-emerald-400 ml-1 align-middle animate-pulse" />
            </h2>
          </div>

          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            You&apos;ve evaluated Astra&apos;s perimeter scanning, campaign correlation, and verified one-click takedowns. Continue exploring the synthetic demo freely, or authenticate with your real organization account.
          </p>

          {/* Key Session Findings Summary */}
          <div className="my-5 grid grid-cols-2 gap-2.5">
            {[
              { icon: Shield, label: '15 Threats Surface-Scored', color: 'text-emerald-400' },
              { icon: Network, label: '5 Campaigns Mapped', color: 'text-cyan-400' },
              { icon: Layers, label: '3 Verified Brand Allowrules', color: 'text-teal-400' },
              { icon: Zap, label: '1-Click Takedown Dispatched', color: 'text-amber-400' },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs"
              >
                <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                <span className="text-slate-300 font-medium truncate">{label}</span>
              </div>
            ))}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              PRIMARY ACTIONS: Continue with Google & Continue Exploring
             ───────────────────────────────────────────────────────────── */}
          <div className="space-y-2.5 pt-2">
            {/* 1. Continue with Google */}
            <motion.button
              type="button"
              onClick={handleContinueWithGoogle}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-md transition-colors cursor-pointer"
            >
              {/* Official Google multicolored G SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-500" />
            </motion.button>

            {/* 2. Continue Exploring Demo */}
            <motion.button
              type="button"
              onClick={handleContinueExploring}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Continue Exploring Demo</span>
            </motion.button>
          </div>

          {/* Tertiary Utilities */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={handleResetAndRestart}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Tour</span>
            </button>

            <button
              type="button"
              onClick={() => {
                exitDemoMode();
                router.push('/sign-in');
              }}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In with Work Email</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
