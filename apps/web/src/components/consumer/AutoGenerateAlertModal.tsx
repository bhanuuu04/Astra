'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Shield,
  AlertTriangle,
  Loader2,
  Building2
} from 'lucide-react';
import { BrandSecurityProfile, SecurityFeedPost } from '@/types/consumer-feed';
import { generateLiveSafetyAlert } from '@/lib/consumer-feed-data';

interface AutoGenerateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  brands: BrandSecurityProfile[];
  onAlertGenerated: (newPost: SecurityFeedPost) => void;
}

export function AutoGenerateAlertModal({
  isOpen,
  onClose,
  brands,
  onAlertGenerated,
}: AutoGenerateAlertModalProps) {
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id || '');
  const [alertType, setAlertType] = useState<'phishing' | 'fake_account'>('fake_account');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const brand = brands.find((b) => b.id === selectedBrandId) || brands[0];
    if (!brand) return;

    setIsGenerating(true);

    setTimeout(() => {
      const newPost = generateLiveSafetyAlert(brand, alertType);
      onAlertGenerated(newPost);
      setIsGenerating(false);
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-md bg-white rounded-[28px] border border-black/[0.08] shadow-2xl p-6 sm:p-7 space-y-5 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1d1d1f] tracking-tight">
                  Generate Live Safety Bulletin
                </h3>
                <p className="text-xs text-[#86868b]">
                  Simulate incoming brand threat alert broadcast
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-black/[0.05] hover:bg-black/[0.08] flex items-center justify-center text-[#86868b] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Brand Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>Select Brand</span>
              </label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-black/[0.06] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.domain}) {b.isCustomBrand ? '★ (Your Onboarded Brand)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Alert Type Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">
                Safety Update Scenario
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAlertType('fake_account')}
                  className={`p-3.5 rounded-2xl border text-left text-xs transition cursor-pointer ${
                    alertType === 'fake_account'
                      ? 'bg-[#0071e3]/10 border-[#0071e3] text-[#0071e3] font-semibold'
                      : 'bg-white border-black/[0.08] text-[#86868b] hover:bg-[#f5f5f7]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1 text-[#1d1d1f]">
                    <span>🚨 Fake Account</span>
                  </div>
                  <p className="text-[11px] mt-1 text-[#86868b]">
                    Instagram / DM imposter profile flagged
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAlertType('phishing')}
                  className={`p-3.5 rounded-2xl border text-left text-xs transition cursor-pointer ${
                    alertType === 'phishing'
                      ? 'bg-[#0071e3]/10 border-[#0071e3] text-[#0071e3] font-semibold'
                      : 'bg-white border-black/[0.08] text-[#86868b] hover:bg-[#f5f5f7]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1 text-[#1d1d1f]">
                    <span>⚠️ Phishing URL</span>
                  </div>
                  <p className="text-[11px] mt-1 text-[#86868b]">
                    Rogue typosquat domain detected &amp; blocked
                  </p>
                </button>
              </div>
            </div>

            {/* Sentinel AI Explainer */}
            <div className="p-3.5 bg-[#f5f5f7] rounded-2xl border border-black/[0.04] text-xs text-[#86868b] space-y-1">
              <div className="flex items-center gap-1.5 text-[#0071e3] font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Autonomous Feed Generator</span>
              </div>
              <p className="leading-relaxed">
                ASTRA automatically converts new threat intelligence and brand onboarding events into Apple-style consumer bulletins, contrasting verified official channels against flagged imposters.
              </p>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 px-5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Safety Card...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate &amp; Publish to Feed Now</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
