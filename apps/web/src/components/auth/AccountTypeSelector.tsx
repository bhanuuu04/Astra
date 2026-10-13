'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Sparkles,
  Check,
  Building2,
  User,
  CheckCircle2,
  ArrowRight,
  Lock,
} from 'lucide-react';

export type AccountType = 'brand' | 'consumer';

interface AccountTypeSelectorProps {
  initialType?: AccountType;
  onSelect: (type: AccountType) => void;
  userEmail?: string;
  userName?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export function AccountTypeSelector({
  initialType = 'brand',
  onSelect,
  userEmail,
  userName,
}: AccountTypeSelectorProps) {
  const [selected, setSelected] = useState<AccountType>(initialType);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-4xl mx-auto space-y-8"
    >
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#0f7b6c]/10 border border-[#0f7b6c]/25 text-[#0f7b6c] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Account Onboarding · Welcome to ASTRA</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#37352f]">
          How do you plan to use ASTRA?
        </h1>
        <p className="text-sm text-[#787774] max-w-xl mx-auto leading-relaxed">
          {userName ? `Hi ${userName}, choose` : 'Choose'} the workspace suited to your security needs. You can always configure additional brand perimeters or switch later.
        </p>
      </motion.div>

      {/* Account Type Cards Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* BRAND LOGIN CARD */}
        <div
          onClick={() => setSelected('brand')}
          className={`relative rounded-[12px] p-6 sm:p-7 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between text-left ${
            selected === 'brand'
              ? 'bg-white border-[#0f7b6c] shadow-[0_4px_24px_rgba(15,123,108,0.12)] ring-2 ring-[#0f7b6c]/20'
              : 'bg-white/70 hover:bg-white border-[#e3e2e0] hover:border-[#9b9a97] shadow-xs'
          }`}
        >
          {/* Active selection badge */}
          {selected === 'brand' && (
            <motion.div
              layoutId="selected-badge"
              className="absolute -top-3 right-6 bg-[#0f7b6c] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>Recommended for Teams</span>
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div
                className={`w-12 h-12 rounded-[10px] flex items-center justify-center transition-colors shadow-xs ${
                  selected === 'brand'
                    ? 'bg-[#0f7b6c] text-white'
                    : 'bg-[#f7f6f3] text-[#37352f] border border-[#e3e2e0]'
                }`}
              >
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium font-mono text-[#787774] bg-[#f7f6f3] px-2 py-0.5 rounded border border-[#e3e2e0]">
                ENTERPRISE &amp; CREATORS
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#37352f] tracking-tight flex items-center gap-2">
                Brand Login
              </h3>
              <p className="text-xs text-[#787774] mt-1 leading-relaxed">
                For organizations, businesses, startups, and public figures needing digital risk defense, perimeter ground-truth, and automated takedowns.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2 pt-2 border-t border-[#e3e2e0]/70 text-xs">
              <div className="flex items-center gap-2 text-[#37352f]">
                <CheckCircle2 className="w-4 h-4 text-[#0f7b6c] shrink-0" />
                <span>Auto-Fetch Brand DNA &amp; Domain Perimeter</span>
              </div>
              <div className="flex items-center gap-2 text-[#37352f]">
                <CheckCircle2 className="w-4 h-4 text-[#0f7b6c] shrink-0" />
                <span>Multi-Channel Social DM &amp; Inbound Imposter Radar</span>
              </div>
              <div className="flex items-center gap-2 text-[#37352f]">
                <CheckCircle2 className="w-4 h-4 text-[#0f7b6c] shrink-0" />
                <span>Rogue Mobile App &amp; Lookalike Typosquat Detection</span>
              </div>
              <div className="flex items-center gap-2 text-[#37352f]">
                <CheckCircle2 className="w-4 h-4 text-[#0f7b6c] shrink-0" />
                <span>Automated Legal Takedown Dossier Generator</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-[#e3e2e0]/50">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelected('brand');
                onSelect('brand');
              }}
              className={`w-full py-2.5 px-4 rounded-[8px] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                selected === 'brand'
                  ? 'bg-[#0f7b6c] hover:bg-[#0c6357] text-white'
                  : 'bg-[#f7f6f3] hover:bg-[#e3e2e0] text-[#37352f] border border-[#e3e2e0]'
              }`}
            >
              <span>Continue with Brand Setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CONSUMER LOGIN CARD */}
        <div
          onClick={() => setSelected('consumer')}
          className={`relative rounded-[12px] p-6 sm:p-7 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between text-left ${
            selected === 'consumer'
              ? 'bg-white border-[#0f7b6c] shadow-[0_4px_24px_rgba(15,123,108,0.12)] ring-2 ring-[#0f7b6c]/20'
              : 'bg-white/70 hover:bg-white border-[#e3e2e0] hover:border-[#9b9a97] shadow-xs'
          }`}
        >
          {selected === 'consumer' && (
            <motion.div
              layoutId="selected-badge"
              className="absolute -top-3 right-6 bg-[#0f7b6c] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>Personal Security</span>
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div
                className={`w-12 h-12 rounded-[10px] flex items-center justify-center transition-colors shadow-xs ${
                  selected === 'consumer'
                    ? 'bg-[#0f7b6c] text-white'
                    : 'bg-[#f7f6f3] text-[#37352f] border border-[#e3e2e0]'
                }`}
              >
                <User className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium font-mono text-[#787774] bg-[#f7f6f3] px-2 py-0.5 rounded border border-[#e3e2e0]">
                INDIVIDUALS &amp; CONSUMERS
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#37352f] tracking-tight flex items-center gap-2">
                Consumer Login
              </h3>
              <p className="text-xs text-[#787774] mt-1 leading-relaxed">
                For individuals seeking personal scam link protection, suspicious message verification, and fake account reporting.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2 pt-2 border-t border-[#e3e2e0]/70 text-xs">
              <div className="flex items-center gap-2 text-[#37352f]">
                <CheckCircle2 className="w-4 h-4 text-[#0f7b6c] shrink-0" />
                <span>Instant Scam URL &amp; Phishing Link Scanner</span>
              </div>
              <div className="flex items-center gap-2 text-[#37352f]">
                <CheckCircle2 className="w-4 h-4 text-[#0f7b6c] shrink-0" />
                <span>Suspicious SMS &amp; DM Extortion Heuristic Check</span>
              </div>
              <div className="flex items-center gap-2 text-[#37352f]">
                <CheckCircle2 className="w-4 h-4 text-[#0f7b6c] shrink-0" />
                <span>Report Brand Impersonators &amp; Fraudulent Stores</span>
              </div>
              <div className="flex items-center gap-2 text-[#37352f]">
                <CheckCircle2 className="w-4 h-4 text-[#0f7b6c] shrink-0" />
                <span>Personal Identity Breach &amp; Safety Telemetry</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-[#e3e2e0]/50">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelected('consumer');
                onSelect('consumer');
              }}
              className={`w-full py-2.5 px-4 rounded-[8px] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                selected === 'consumer'
                  ? 'bg-[#0f7b6c] hover:bg-[#0c6357] text-white'
                  : 'bg-[#f7f6f3] hover:bg-[#e3e2e0] text-[#37352f] border border-[#e3e2e0]'
              }`}
            >
              <span>Continue with Consumer Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Footer */}
      <motion.div
        variants={itemVariants}
        className="text-center text-xs text-[#787774] flex items-center justify-center gap-2 pt-2"
      >
        <Lock className="w-3.5 h-3.5 text-[#0f7b6c]" />
        <span>Secure authentication provided by Clerk &amp; Supabase · Role can be changed anytime in Settings</span>
      </motion.div>
    </motion.div>
  );
}
