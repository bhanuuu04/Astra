'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Globe,
  Smartphone,
  AlertTriangle,
  Network,
  Activity,
  X,
  Sparkles,
  Radio,
  Eye,
} from 'lucide-react';
import { useDemo } from '@/providers/DemoProvider';

// ─────────────────────────────────────────────
// ANIMATED THREAT COUNTER
// ─────────────────────────────────────────────
function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    const animate = (ts: number) => {
      if (!start.current) start.current = ts;
      const progress = Math.min((ts - start.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setValue(Math.round(eased * target));
      if (progress < 1) frame.current = requestAnimationFrame(animate);
    };
    frame.current = requestAnimationFrame(animate);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [target, duration]);

  return <>{value}</>;
}

// ─────────────────────────────────────────────
// SCANNING ANIMATION ROWS (Light Theme)
// ─────────────────────────────────────────────
const SCAN_ITEMS = [
  { icon: Globe, label: 'Scanning open domain registries', delay: 0, color: 'text-[#0f7b6c]' },
  { icon: Activity, label: 'Monitoring Instagram / X / Telegram', delay: 300, color: 'text-sky-600' },
  { icon: Smartphone, label: 'Auditing third-party APK mirrors', delay: 600, color: 'text-purple-600' },
  { icon: Network, label: 'Correlating threat attack clusters', delay: 900, color: 'text-amber-600' },
  { icon: Shield, label: 'Synthesizing verified brand baseline', delay: 1200, color: 'text-emerald-600' },
];

function ScanRow({ icon: Icon, label, delay, color }: typeof SCAN_ITEMS[0]) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), delay + 800);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay / 1000, type: 'spring', stiffness: 300, damping: 28 }}
      className="flex items-center gap-3 text-xs"
    >
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#f7f6f3] border border-[#e3e2e0] ${color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="flex-1 text-[#37352f] font-medium">{label}</span>
      {done ? (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[#0f7b6c]">
          <CheckCircle2 className="h-4 w-4" />
        </motion.span>
      ) : (
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#9b9a97] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </span>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// ENTRY MODAL (Light Theme)
// ─────────────────────────────────────────────
export function DemoEntryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
  initialRoute?: string;
}) {
  const { enterDemoMode, startTour } = useDemo();
  const router = useRouter();
  const [phase, setPhase] = useState<'welcome' | 'scanning' | 'ready'>('welcome');

  useEffect(() => {
    if (open) setPhase('welcome');
  }, [open]);

  const handleLaunch = () => {
    setPhase('scanning');
    setTimeout(() => setPhase('ready'), 2400);
  };

  const handleEnter = () => {
    enterDemoMode();
    startTour();
    onClose();
    router.push('/guide');
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="relative w-full max-w-lg rounded-2xl border border-[#e3e2e0] bg-white overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.18)]"
        >
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#0f7b6c] via-cyan-600 to-[#0f7b6c]" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* ── PHASE: WELCOME ── */}
          <AnimatePresence mode="wait">
            {phase === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="px-8 py-7"
              >
                {/* Logo & badge */}
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f7b6c]/10 border border-[#0f7b6c]/20 text-[#0f7b6c]">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-widest text-[#0f7b6c]">BYTE XL JUDGES DEMO</span>
                    <span className="block text-base font-bold text-[#37352f]">Astra Digital Risk Protection</span>
                  </div>
                </div>

                <h2 className="text-xl font-extrabold text-[#37352f] leading-snug">
                  Experience End-to-End Brand Protection in 3 Minutes
                </h2>
                <p className="mt-2.5 text-xs text-[#787774] leading-relaxed">
                  Enter an interactive guided tour following the complete brand lifecycle for <strong className="text-[#37352f]">NexBank Financial</strong>: from initial Brand DNA onboarding to AI perimeter scanning, campaign correlation, and verified one-click takedown remediation.
                </p>

                {/* Feature pills */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {[
                    { icon: Radio, label: '15 active threat findings' },
                    { icon: Network, label: '5 correlated campaigns' },
                    { icon: Smartphone, label: '3 rogue mobile apps' },
                    { icon: Globe, label: '3 phishing domains' },
                    { icon: Zap, label: 'NVIDIA Nemotron engine' },
                    { icon: Eye, label: '12-step guided tour' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 rounded-lg border border-[#e3e2e0] bg-[#f7f6f3] px-2.5 py-1.5">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-[#0f7b6c]" />
                      <span className="text-[11px] font-medium text-[#37352f]">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Notice callout */}
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <p className="text-[11px] text-amber-900 leading-normal">
                    Environment is <strong>fully simulated &amp; production-safe</strong>. All state is preserved locally in your browser with zero external impact.
                  </p>
                </div>

                {/* CTA */}
                <motion.button
                  type="button"
                  onClick={handleLaunch}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f7b6c] hover:bg-[#0c6357] py-3 text-sm font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Zap className="h-4 w-4" />
                  Launch Interactive Demo Tour
                  <ArrowRight className="h-4 w-4" />
                </motion.button>

                <p className="mt-2.5 text-center text-[11px] text-[#9b9a97]">
                  No credentials needed · Guided journey starts at Brand Onboarding
                </p>
              </motion.div>
            )}

            {/* ── PHASE: SCANNING ── */}
            {phase === 'scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="px-8 py-9"
              >
                <div className="mb-6 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f7b6c]/10 border border-[#0f7b6c]/20 text-[#0f7b6c]"
                  >
                    <Activity className="h-6 w-6" />
                  </motion.div>
                  <h3 className="text-base font-bold text-[#37352f]">Initializing Demo Workspace…</h3>
                  <p className="mt-1 text-xs text-[#787774]">Pre-loading synthetic threat intelligence for NexBank Financial</p>
                </div>

                <div className="space-y-2.5">
                  {SCAN_ITEMS.map((item) => (
                    <ScanRow key={item.label} {...item} />
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-[#e3e2e0]">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.2, ease: 'easeInOut' }}
                    className="h-full rounded-full bg-[#0f7b6c]"
                  />
                </div>
              </motion.div>
            )}

            {/* ── PHASE: READY ── */}
            {phase === 'ready' && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="px-8 py-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-[#0f7b6c]"
                >
                  <CheckCircle2 className="h-9 w-9" />
                </motion.div>

                <h3 className="text-xl font-extrabold text-[#37352f]">Demo Environment Ready</h3>
                <p className="mt-1.5 text-xs text-[#787774]">
                  Loaded <strong className="text-[#37352f]">15 threat findings</strong>, <strong className="text-[#37352f]">5 correlated campaigns</strong>, and <strong className="text-[#37352f]">3 rogue apps</strong>.
                </p>

                {/* Stats strip */}
                <div className="my-5 grid grid-cols-3 gap-2.5">
                  {[
                    { label: 'Threats Ingested', value: 15, color: 'text-rose-600' },
                    { label: 'Campaigns', value: 5, color: 'text-amber-600' },
                    { label: 'Risk Score', value: 94, color: 'text-[#0f7b6c]' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl border border-[#e3e2e0] bg-[#f7f6f3] py-2.5">
                      <p className={`text-xl font-bold font-mono ${color}`}>
                        <AnimatedCounter target={value} duration={700} />
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-[#787774]">{label}</p>
                    </div>
                  ))}
                </div>

                <motion.button
                  type="button"
                  onClick={handleEnter}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f7b6c] hover:bg-[#0c6357] py-3 text-sm font-bold text-white shadow-xs cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  Start Guided Product Tour
                  <ArrowRight className="h-4 w-4" />
                </motion.button>

                <p className="mt-2.5 text-[11px] text-[#9b9a97]">
                  Starts at Brand Onboarding · Progress can be restarted or skipped anytime
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
