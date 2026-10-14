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
import { Instagram, Twitter } from '@/components/socials/SocialLogos';
import { SecurityStory } from '@/types/consumer-feed';

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal Window (Instagram Story vertical aspect) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-[420px] h-[640px] max-h-[90vh] bg-gradient-to-b from-[#1a1918] via-[#121212] to-[#0c0c0c] text-white rounded-[20px] shadow-2xl border border-white/10 flex flex-col justify-between overflow-hidden z-10"
        >
          {/* Progress Bar Header */}
          <div className="p-4 space-y-3 z-20 bg-gradient-to-b from-black/80 to-transparent">
            {/* Story segments */}
            <div className="flex gap-1.5">
              {stories.map((s, idx) => (
                <div key={s.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-100 ${
                      idx < currentIndex
                        ? 'w-full bg-white'
                        : idx === currentIndex
                        ? 'bg-white'
                        : 'w-0'
                    }`}
                    style={idx === currentIndex ? { width: `${progress}%` } : undefined}
                  />
                </div>
              ))}
            </div>

            {/* Author / Brand Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img
                    src={story.brandLogo || `https://www.google.com/s2/favicons?domain=${story.officialDomain}&sz=64`}
                    alt={story.brandName}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white/80 bg-white"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 bg-[#0f7b6c] text-white rounded-full p-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight">{story.brandName}</span>
                    <span className="text-[10px] text-white/60">· {story.timeAgo}</span>
                  </div>
                  <span className="text-xs text-white/70 font-mono">{story.officialHandle}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isUrgent
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {story.previewBadge}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Story Body Card */}
          <div className="flex-1 px-5 flex flex-col justify-center space-y-4 z-20">
            {/* Visual Icon Halo */}
            <div className="flex justify-center">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                  isUrgent
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/10'
                    : 'bg-[#0f7b6c]/20 text-emerald-400 border border-[#0f7b6c]/40 shadow-emerald-500/10'
                }`}
              >
                {isUrgent ? <AlertTriangle className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
              </div>
            </div>

            {/* Headline */}
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                {story.headline}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-sm mx-auto">
                {story.bodyText}
              </p>
            </div>

            {/* Official Real Channels Ground Truth Box */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2.5 backdrop-blur-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-white/90">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Official Channels</span>
                </span>
                <span className="text-[10px] text-white/50 font-mono">ASTRA SEAL</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                  <span className="text-white/70 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real Website:</span>
                  </span>
                  <a
                    href={`https://${story.officialDomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-emerald-300 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>https://{story.officialDomain}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                  <span className="text-white/70 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real Social:</span>
                  </span>
                  <span className="font-mono text-white font-semibold">{story.officialHandle}</span>
                </div>
              </div>

              {story.warningNote && (
                <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                  <span>{story.warningNote}</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tap Zones (Left/Right like Instagram Stories) */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white disabled:opacity-20 cursor-pointer z-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer z-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom Action Footer */}
          <div className="p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-20 space-y-2">
            <button
              type="button"
              onClick={() => {
                onVerifyBrand(story.officialDomain);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-[#121212] font-semibold text-xs hover:bg-white/90 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Shield className="w-3.5 h-3.5 text-[#0f7b6c]" />
              <span>Verify Any URL For {story.brandName}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
