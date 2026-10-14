'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, AlertCircle, ChevronRight } from 'lucide-react';
import { SecurityStory } from '@/types/consumer-feed';
import { BrandIcon } from '@/components/consumer/BrandIcons';

interface ConsumerStoriesBarProps {
  stories: SecurityStory[];
  onSelectStory: (story: SecurityStory) => void;
  onOpenDirectory: () => void;
}

export function ConsumerStoriesBar({
  stories,
  onSelectStory,
  onOpenDirectory,
}: ConsumerStoriesBarProps) {
  return (
    <div className="w-full bg-white/80 backdrop-blur-xl border border-black/[0.05] rounded-[24px] p-4 sm:p-5 shadow-[0_2px_16px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#86868b]">
            Official Brand Security Stories
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenDirectory}
          className="text-xs font-medium text-[#0071e3] hover:text-[#0077ed] flex items-center gap-0.5 transition cursor-pointer"
        >
          <span>Verified Directory</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal Story Bubbles Carousel */}
      <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto pb-1.5 scrollbar-none pt-1">
        {/* All Brands Directory Story */}
        <button
          type="button"
          onClick={onOpenDirectory}
          className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer focus:outline-none"
        >
          <div className="relative w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#0071e3] via-[#5856d6] to-[#af52de] transition-all duration-300 group-hover:scale-105 shadow-sm">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-0.5 border border-white">
              <div className="w-full h-full rounded-full bg-black/[0.03] text-[#0071e3] flex items-center justify-center font-bold">
                <Shield className="w-6 h-6 text-[#0071e3]" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-0.5 bg-[#0071e3] text-white rounded-full p-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
            </div>
          </div>
          <span className="text-xs font-semibold text-[#1d1d1f] max-w-[72px] truncate text-center tracking-tight">
            All Brands
          </span>
        </button>

        {/* Stories list */}
        {stories.map((story) => {
          const isUrgent = story.alertType === 'urgent_scam';
          const ringGradient = isUrgent
            ? 'from-[#ff3b30] via-[#ff9500] to-[#ff2d55]'
            : story.hasUnread
            ? 'from-[#0071e3] via-[#34c759] to-[#30b0c7]'
            : 'from-black/10 to-black/20';

          return (
            <motion.button
              key={story.id}
              whileHover={{ y: -3, scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => onSelectStory(story)}
              className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer focus:outline-none"
            >
              <div className={`relative w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr ${ringGradient} shadow-sm transition-shadow duration-300 group-hover:shadow-md`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border border-white p-0.5">
                  <BrandIcon brandName={story.brandName} size={28} className="rounded-full" />
                </div>
                {/* Alert Indicator */}
                {isUrgent && (
                  <div className="absolute -top-1 -right-1 bg-[#ff3b30] text-white rounded-full p-0.5 shadow-sm animate-bounce">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-[#1d1d1f] max-w-[72px] truncate text-center tracking-tight">
                  {story.brandName}
                </span>
                <span className="text-[10px] text-[#86868b] max-w-[72px] truncate text-center">
                  {story.timeAgo}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
