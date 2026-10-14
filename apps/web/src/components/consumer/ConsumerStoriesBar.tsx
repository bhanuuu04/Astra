'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';
import { SecurityStory } from '@/types/consumer-feed';

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
    <div className="w-full bg-white border border-[#e3e2e0] rounded-[14px] p-3.5 sm:p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#0f7b6c] animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#37352f]">
            Live Security Bulletins &amp; Brand Stories
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenDirectory}
          className="text-[11px] font-semibold text-[#0f7b6c] hover:underline cursor-pointer"
        >
          View All Verified Brands &rarr;
        </button>
      </div>

      {/* Horizontal Story Bubbles Carousel */}
      <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-none pt-1">
        {/* First Bubble: Brand Directory / Ground Truth Badge */}
        <button
          type="button"
          onClick={onOpenDirectory}
          className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
        >
          <div className="relative w-15 h-15 rounded-full p-[2px] bg-gradient-to-tr from-[#0f7b6c] via-emerald-400 to-teal-200 transition-transform duration-200 group-hover:scale-105 shadow-xs">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-1 border-2 border-white">
              <div className="w-full h-full rounded-full bg-[#0f7b6c]/10 text-[#0f7b6c] flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-0.5 bg-[#0f7b6c] text-white rounded-full p-0.5 shadow-xs">
              <Sparkles className="w-3 h-3" />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#37352f] max-w-[68px] truncate text-center">
            All Brands
          </span>
        </button>

        {/* Stories list */}
        {stories.map((story) => {
          const isUrgent = story.alertType === 'urgent_scam';
          const ringGradient = isUrgent
            ? 'from-rose-500 via-amber-500 to-red-600'
            : story.hasUnread
            ? 'from-[#0f7b6c] via-emerald-400 to-teal-300'
            : 'from-[#e3e2e0] to-[#9b9a97]';

          return (
            <motion.button
              key={story.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => onSelectStory(story)}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
            >
              <div className={`relative w-15 h-15 rounded-full p-[2.5px] bg-gradient-to-tr ${ringGradient} shadow-xs transition-shadow duration-200 group-hover:shadow-md`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white">
                  <img
                    src={story.brandLogo || `https://www.google.com/s2/favicons?domain=${story.officialDomain}&sz=64`}
                    alt={story.brandName}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                {/* Alert Indicator */}
                {isUrgent && (
                  <div className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white rounded-full p-0.5 shadow-xs animate-bounce">
                    <AlertCircle className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-semibold text-[#37352f] max-w-[68px] truncate text-center">
                  {story.brandName}
                </span>
                <span className="text-[9px] text-[#787774] max-w-[68px] truncate text-center">
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
