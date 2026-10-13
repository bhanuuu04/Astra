'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  RotateCcw,
  LogOut,
  Map,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDemo } from '@/providers/DemoProvider';

export function DemoModeBanner() {
  const { isDemoMode, exitDemoMode, resetDemo, startTour, tourActive } = useDemo();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  if (!isDemoMode) return null;

  const handleExit = () => {
    exitDemoMode();
    router.push('/');
  };

  const handleReset = () => {
    resetDemo();
    router.push('/overview');
  };

  return (
    <>
      {/* Thin top amber accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

      {/* Main Light Banner */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 bg-[#fffbeb] border-b border-[#fde68a] px-4 py-2 text-[#92400e]">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Animated indicator */}
                <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/40" />
                  <span className="relative flex h-2.5 w-2.5 rounded-full bg-[#d97706]" />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-[4px] bg-[#fef3c7] border border-[#fcd34d] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#b45309]">
                    BYTE XL Demo
                  </span>
                  <span className="text-xs font-medium text-[#92400e]/80 hidden sm:inline">
                    Simulated environment — NexBank Financial Group · Zero external operations
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!tourActive && (
                  <motion.button
                    type="button"
                    onClick={startTour}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 rounded-lg bg-white border border-[#fde68a] px-2.5 py-1 text-[11px] font-bold text-[#b45309] shadow-2xs hover:bg-[#fef3c7] transition cursor-pointer"
                  >
                    <Map className="h-3 w-3 text-[#d97706]" /> Product Tour
                  </motion.button>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  title="Reset all demo interactions"
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#92400e] hover:bg-[#fef3c7] transition cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmExit(true)}
                  title="Exit demo"
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#92400e] hover:bg-[#fef3c7] transition cursor-pointer"
                >
                  <LogOut className="h-3 w-3" />
                  <span className="hidden sm:inline">Exit Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="rounded-lg p-1 text-[#92400e]/60 hover:text-[#92400e] hover:bg-[#fef3c7] transition cursor-pointer"
                  title="Collapse banner"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed floating light pill */}
      <AnimatePresence>
        {collapsed && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={() => setCollapsed(false)}
            className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-[#fde68a] bg-white px-4 py-1 text-[11px] font-bold text-[#b45309] shadow-md cursor-pointer hover:bg-[#fffbeb] transition"
          >
            <span className="h-2 w-2 rounded-full bg-[#d97706] animate-pulse" />
            BYTE XL Demo Active
            <ChevronDown className="h-3 w-3" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Exit confirm modal (Light Theme) */}
      <AnimatePresence>
        {showConfirmExit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowConfirmExit(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-[#e3e2e0] bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
                <LogOut className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-[#37352f]">Exit BYTE XL Demo?</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#787774]">
                You&apos;ll be returned to the landing page. All simulated state and tour progress will be cleared.
              </p>
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConfirmExit(false)}
                  className="flex-1 rounded-xl border border-[#e3e2e0] bg-[#f7f6f3] py-2.5 text-xs font-semibold text-[#37352f] hover:bg-[#ebe8e4] transition cursor-pointer"
                >
                  Keep Exploring
                </button>
                <button
                  type="button"
                  onClick={handleExit}
                  className="flex-1 rounded-xl bg-[#d97706] hover:bg-[#b45309] py-2.5 text-xs font-bold text-white transition cursor-pointer shadow-xs"
                >
                  Exit Demo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
