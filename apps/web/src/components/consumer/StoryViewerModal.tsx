'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  ArrowRight
} from 'lucide-react';
import { SecurityStory } from '@/types/consumer-feed';
import { BrandIcon } from '@/components/consumer/BrandIcons';

interface StoryViewerModalProps {
  story: SecurityStory | null;
  stories: SecurityStory[];
  onClose: () => void;
  onSelectStory: (story: SecurityStory) => void;
  onVerifyBrand: (domain: string) => void;
}

export function StoryViewerModal({
  story,
  stories,
  onClose,
  onSelectStory,
  onVerifyBrand,
}: StoryViewerModalProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!story) return;
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [story?.id]);

  if (!story) return null;

  const currentIndex = stories.findIndex((s) => s.id === story.id);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectStory(stories[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      onSelectStory(stories[currentIndex + 1]);
    } else {
      onClose();
    }
  };

  const isUrgent = story.alertType === 'urgent_scam';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md">
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal Window: Light & Premium Apple Style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-[420px] h-[640px] max-h-[90vh] bg-white rounded-[32px] shadow-[0_24px_70px_rgba(0,0,0,0.14)] border border-black/[0.08] flex flex-col justify-between overflow-hidden z-10 text-[#1d1d1f]"
        >
          {/* Subtle Ambient Apple Glow */}
          <div
            className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${
              isUrgent ? 'bg-[#ff3b30]' : 'bg-[#0071e3]'
            }`}
          />

          {/* Progress Bar Header */}
          <div className="p-5 space-y-3.5 z-20 bg-gradient-to-b from-white via-white/90 to-transparent">
            {/* Story segments (Apple Light Style) */}
            <div className="flex gap-1.5">
              {stories.map((s, idx) => (
                <div key={s.id} className="h-1 flex-1 bg-black/[0.08] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-100 ${
                      idx < currentIndex
                        ? 'w-full bg-[#1d1d1f]'
                        : idx === currentIndex
                        ? 'bg-[#0071e3]'
                        : 'w-0'
                    }`}
                    style={idx === currentIndex ? { width: `${progress}%` } : undefined}
                  />
                </div>
              ))}
            </div>

            {/* Author / Brand Info */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <BrandIcon brandName={story.brandName} size={28} className="rounded-full shadow-2xs" />
                  <div className="absolute -bottom-0.5 -right-0.5 bg-[#0071e3] text-white rounded-full p-0.5 shadow-xs">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm tracking-tight text-[#1d1d1f]">{story.brandName}</span>
                    <span className="text-[11px] text-[#86868b]">· {story.timeAgo}</span>
                  </div>
                  <span className="text-xs text-[#86868b] font-normal">{story.officialHandle}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isUrgent
                      ? 'bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/20'
                      : 'bg-[#34c759]/10 text-[#34c759] border border-[#34c759]/20'
                  }`}
                >
                  {story.previewBadge}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-black/[0.05] hover:bg-black/[0.09] flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Story Body Card */}
          <div className="flex-1 px-6 flex flex-col justify-center space-y-4 z-20">
            {/* Visual Icon Halo */}
            <div className="flex justify-center">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${
                  isUrgent
                    ? 'bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/15'
                    : 'bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/15'
                }`}
              >
                {isUrgent ? <AlertTriangle className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
              </div>
            </div>

            {/* Headline */}
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f] leading-snug">
                {story.headline}
              </h2>
              <p className="text-xs sm:text-sm text-[#424245] leading-relaxed max-w-sm mx-auto">
                {story.bodyText}
              </p>
            </div>

            {/* Verified Channels Box (Light Apple Material) */}
            <div className="bg-[#f5f5f7] border border-black/[0.05] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#1d1d1f]">
                <span className="flex items-center gap-1.5 text-[#34c759]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Official Channels</span>
                </span>
                <span className="text-[10px] text-[#86868b] tracking-wider font-semibold">ASTRA SEAL</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-black/[0.04] shadow-2xs">
                  <span className="text-[#86868b] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#0071e3]" />
                    <span>Real Website:</span>
                  </span>
                  <a
                    href={`https://${story.officialDomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0071e3] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>https://{story.officialDomain}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-black/[0.04] shadow-2xs">
                  <span className="text-[#86868b] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#34c759]" />
                    <span>Real Social:</span>
                  </span>
                  <span className="text-[#1d1d1f] font-semibold">{story.officialHandle}</span>
                </div>
              </div>

              {story.warningNote && (
                <div className="text-[11px] text-[#ff3b30] bg-[#ff3b30]/[0.08] border border-[#ff3b30]/15 px-3 py-2 rounded-xl flex items-start gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#ff3b30] mt-0.5" />
                  <span>{story.warningNote}</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white hover:bg-[#f5f5f7] border border-black/[0.08] shadow-sm flex items-center justify-center text-[#1d1d1f] disabled:opacity-20 cursor-pointer z-30 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white hover:bg-[#f5f5f7] border border-black/[0.08] shadow-sm flex items-center justify-center text-[#1d1d1f] cursor-pointer z-30 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom Action Footer (Apple Blue Pill Button) */}
          <div className="p-5 bg-gradient-to-t from-white via-white/90 to-transparent z-20">
            <button
              type="button"
              onClick={() => {
                onVerifyBrand(story.officialDomain);
                onClose();
              }}
              className="w-full py-3.5 px-5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Verify Any URL For {story.brandName}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
