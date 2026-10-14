'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Radio,
  Globe,
  BellRing,
  Network,
  Smartphone,
  Send,
  Fingerprint,
  Database,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface FeatureMeta {
  title: string;
  category: string;
  icon: any;
  message: string;
  color: string;
}

const FEATURE_ROUTES_META: Record<string, FeatureMeta> = {
  '/guide': {
    title: 'Brand DNA Baseline',
    category: 'GROUND TRUTH ENROLLMENT',
    icon: Fingerprint,
    message: "Let's lock in verified apex domains & handles. Anything outside this allowlist is spoofed.",
    color: '#0f7b6c',
  },
  '/brands': {
    title: 'Verified Brand Directory',
    category: 'ASSET ALLOWLIST',
    icon: Shield,
    message: 'Every official digital asset anchored. Any lookalike trying to clone this gets flagged on sight.',
    color: '#0f7b6c',
  },
  '/connectors': {
    title: 'Data Ingestion Brokers',
    category: 'COMPOSIO REAL-TIME TUNNELS',
    icon: Database,
    message: 'Hooked up to X, IG, LinkedIn & Telegram 24/7 with zero credential exposure.',
    color: '#0284c7',
  },
  '/overview': {
    title: 'Perimeter Threat Radar',
    category: 'NVIDIA NEMOTRON COMMAND CENTER',
    icon: Radio,
    message: 'Every threat. Evidence-backed, scored, and prioritized in real time.',
    color: '#0f7b6c',
  },
  '/sightings': {
    title: 'Suspicious Domains & Typosquats',
    category: 'RAW TELEMETRY QUEUE',
    icon: Globe,
    message: "Let's investigate suspicious domains, homoglyph variations, and live phishing payloads.",
    color: '#d97706',
  },
  '/alerts': {
    title: 'Incident Triage & Phishing Clones',
    category: 'AI HOMOGLYPH DETECTOR',
    message: 'Meet your social impersonation detector catching stealth lookalikes in 4K.',
    icon: BellRing,
    color: '#eb5757',
  },
  '/campaigns': {
    title: 'Threat Actor Topology',
    category: 'ATTACK CLUSTERING',
    icon: Network,
    message: 'Connecting the dots across rogue IPs, fast-flux DNS, and coordinated attack rings.',
    color: '#8b5cf6',
  },
  '/apps': {
    title: 'Mobile Rogue App Radar',
    category: 'MALICIOUS APK INTERCEPTION',
    icon: Smartphone,
    message: 'Intercepting SMS-stealing spyware APKs before third-party app store dissemination.',
    color: '#ec4899',
  },
  '/responses': {
    title: 'Remediation & Takedowns',
    category: 'ONE-CLICK EVIDENCE DISPATCH',
    icon: Send,
    message: 'Take action before attackers damage your reputation. Cryptographic packets sent.',
    color: '#0f7b6c',
  },
};

export function FeatureInterstitial({
  route,
  isOpen,
  onDismiss,
}: {
  route: string;
  isOpen: boolean;
  onDismiss: () => void;
}) {
  const normalizedRoute = route.startsWith('/campaigns/') ? '/campaigns' : route.split('?')[0];
  const meta = FEATURE_ROUTES_META[normalizedRoute];

  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    if (!isOpen || !meta) return;

    setTypedChars(0);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTypedChars(i);
      if (i >= meta.message.length) {
        clearInterval(interval);
      }
    }, 20);

    // Auto-advance after 2.4 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 2400);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isOpen, meta, onDismiss]);

  // Keyboard shortcut: space/enter/esc/arrow dismisses
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'Escape', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onDismiss]);

  if (!isOpen || !meta) return null;

  const Icon = meta.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onDismiss}
        className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md cursor-pointer select-none"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: -12 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1320] text-white p-7 sm:p-9 shadow-[0_24px_70px_rgba(0,0,0,0.5)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle top glow bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-teal-400"
          />

          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              {meta.category}
            </span>
          </div>

          {/* Icon & Title */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {meta.title}
              </h2>
              <p className="text-xs text-slate-400 font-medium">BYTE XL Guided Tour</p>
            </div>
          </div>

          {/* Typewritten Message */}
          <div className="min-h-[54px] py-2 border-t border-white/10">
            <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed">
              <span>{meta.message.slice(0, typedChars)}</span>
              <span className="inline-block w-1.5 h-4 bg-emerald-400 ml-1 align-middle animate-pulse" />
            </p>
          </div>

          {/* Bottom dismiss indicator */}
          <div className="mt-5 flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-mono">Transitioning to live feature…</span>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              <span>Skip intro</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
