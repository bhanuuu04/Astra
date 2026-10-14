'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Shield,
  AlertTriangle,
  Radio,
  Loader2,
  CheckCircle2,
  Building2,
  Globe
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
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-md bg-white rounded-[16px] border border-[#e3e2e0] shadow-2xl p-6 space-y-5 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[8px] bg-[#0f7b6c]/10 text-[#0f7b6c] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#37352f]">
                  ⚡ Generate Live Safety Bulletin
                </h3>
                <p className="text-[11px] text-[#787774]">
                  Simulate automatic brand safety update generation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#f7f6f3] hover:bg-[#e3e2e0] flex items-center justify-center text-[#787774] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Brand Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#37352f] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0f7b6c]" />
                <span>Select Brand</span>
              </label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f6f3] border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
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
              <label className="text-xs font-semibold text-[#37352f]">
                Safety Update Scenario
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAlertType('fake_account')}
                  className={`p-3 rounded-[8px] border text-left text-xs transition cursor-pointer ${
                    alertType === 'fake_account'
                      ? 'bg-[#0f7b6c]/10 border-[#0f7b6c] text-[#0f7b6c] font-semibold'
                      : 'bg-white border-[#e3e2e0] text-[#787774] hover:bg-[#f7f6f3]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1">
                    <span>🚨 Fake Account</span>
                  </div>
                  <p className="text-[10px] mt-0.5 opacity-80">
                    Instagram / DM imposter profile flagged
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAlertType('phishing')}
                  className={`p-3 rounded-[8px] border text-left text-xs transition cursor-pointer ${
                    alertType === 'phishing'
                      ? 'bg-[#0f7b6c]/10 border-[#0f7b6c] text-[#0f7b6c] font-semibold'
                      : 'bg-white border-[#e3e2e0] text-[#787774] hover:bg-[#f7f6f3]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1">
                    <span>⚠️ Phishing URL</span>
                  </div>
                  <p className="text-[10px] mt-0.5 opacity-80">
                    Rogue typosquat domain detected &amp; blocked
                  </p>
                </button>
              </div>
            </div>

            {/* Sentinel AI Explainer */}
            <div className="p-3 bg-[#f7f6f3] rounded-[8px] border border-[#e3e2e0] text-[11px] text-[#787774] space-y-1">
              <div className="flex items-center gap-1.5 text-[#0f7b6c] font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Autonomous Feed Generator</span>
              </div>
              <p>
                ASTRA automatically converts new threat intelligence and brand onboarding events into Instagram-style consumer bulletins, contrasting verified official channels against flagged imposters.
              </p>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-[8px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Safety Card with AI...</span>
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
