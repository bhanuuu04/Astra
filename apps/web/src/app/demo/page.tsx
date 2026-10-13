'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useDemo } from '@/providers/DemoProvider';

export default function DemoPage() {
  const { enterDemoMode, startTour } = useDemo();
  const router = useRouter();

  useEffect(() => {
    enterDemoMode();
    const timer = setTimeout(() => {
      // Start at /guide to introduce the brand onboarding narrative!
      router.push('/guide');
      setTimeout(() => startTour(), 600);
    }, 1000);
    return () => clearTimeout(timer);
  }, [enterDemoMode, startTour, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-[#e3e2e0] bg-white p-8 text-center space-y-4 shadow-xl max-w-sm w-full mx-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f7b6c]/10 border border-[#0f7b6c]/20 text-[#0f7b6c]"
        >
          <Shield className="h-7 w-7" />
        </motion.div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#0f7b6c]">BYTE XL JUDGES DEMO</p>
          <h1 className="mt-1 text-lg font-bold text-[#37352f]">Launching Demo Environment</h1>
          <p className="mt-1 text-xs text-[#787774]">Pre-loading Brand DNA for NexBank Financial</p>
        </div>
        <div className="h-1.5 w-48 mx-auto overflow-hidden rounded-full bg-[#e3e2e0]">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
            className="h-full rounded-full bg-[#0f7b6c]"
          />
        </div>
      </motion.div>
    </div>
  );
}
