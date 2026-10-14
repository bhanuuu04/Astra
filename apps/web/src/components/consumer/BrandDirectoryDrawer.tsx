'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Search,
  CheckCircle2,
  Lock,
  Globe,
  Mail,
  Phone,
  Copy,
  Check,
  ArrowUpRight
} from 'lucide-react';
import { BrandSecurityProfile } from '@/types/consumer-feed';
import {
  BrandIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
  YoutubeIcon
} from '@/components/consumer/BrandIcons';

interface BrandDirectoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  brands: BrandSecurityProfile[];
  onSelectBrandFilter: (brandName: string) => void;
  onScanBrandUrl: (domain: string) => void;
}

export function BrandDirectoryDrawer({
  isOpen,
  onClose,
  brands,
  onSelectBrandFilter,
  onScanBrandUrl,
}: BrandDirectoryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = brands.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.domain.toLowerCase().includes(q) ||
      (b.industry && b.industry.toLowerCase().includes(q)) ||
      b.officialSocials.some((s) => s.handle.toLowerCase().includes(q))
    );
  });

  const handleCopy = async (text: string) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 1800);
    }
  };

  const renderSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <InstagramIcon className="w-3.5 h-3.5 text-[#e1306c]" />;
      case 'x_twitter':
        return <TwitterIcon className="w-3.5 h-3.5 text-[#1da1f2]" />;
      case 'linkedin':
        return <LinkedinIcon className="w-3.5 h-3.5 text-[#0a66c2]" />;
      case 'youtube':
        return <YoutubeIcon className="w-3.5 h-3.5 text-[#ff0000]" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-[#0071e3]" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xl">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="relative w-full max-w-3xl max-h-[88vh] bg-[#f5f5f7] rounded-[28px] border border-black/[0.08] shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-black/[0.05] flex items-center justify-between bg-white/70 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#0071e3] text-white flex items-center justify-center font-bold shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1d1d1f] tracking-tight">
                  Verified Brand Ground Truth Directory
                </h3>
                <p className="text-xs text-[#86868b]">
                  Cryptographically confirmed official domains and social channels on ASTRA
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/[0.05] hover:bg-black/[0.08] flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 sm:p-5 border-b border-black/[0.04] bg-white">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
              <input
                type="text"
                placeholder="Search popular brands, domains, or handles (Apple, Nike, @spotify)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#f5f5f7] border border-black/[0.05] rounded-full text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Brands List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#86868b]">
                No verified brands match &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filtered.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-black/[0.04] rounded-2xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4 hover:border-[#0071e3]/30 transition"
                >
                  {/* Brand Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <BrandIcon brandName={b.name} size={28} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[15px] font-bold text-[#1d1d1f] tracking-tight">{b.name}</h4>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] text-[10px] font-semibold">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Verified</span>
                          </span>
                          {b.isCustomBrand && (
                            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
                              Onboarded by You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#86868b]">{b.legalEntity || b.industry}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          onScanBrandUrl(b.domain);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Search className="w-3 h-3 text-[#0071e3]" />
                        <span>Scan URL</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectBrandFilter(b.name);
                          onClose();
                        }}
                        className="px-4 py-1.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <span>View Feed</span>
                      </button>
                    </div>
                  </div>

                  {/* Official Real Websites */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                      Real Official Websites (Ground Truth)
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {b.officialWebsites.map((web, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.03] text-xs text-[#1d1d1f]"
                        >
                          <Lock className="w-3 h-3 text-[#34c759]" />
                          <a
                            href={web.url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline font-semibold"
                          >
                            {web.url.replace(/^https?:\/\//, '')}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(web.url)}
                            className="text-[#86868b] hover:text-[#1d1d1f] ml-1 transition"
                            title="Copy URL"
                          >
                            {copiedText === web.url ? (
                              <Check className="w-3 h-3 text-[#34c759]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Official Real Socials */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                      Real Official Social Handles
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {b.officialSocials.map((soc, idx) => (
                        <a
                          key={idx}
                          href={soc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.03] hover:bg-black/[0.06] text-xs text-[#1d1d1f] transition"
                        >
                          {renderSocialIcon(soc.platform)}
                          <span className="font-medium">{soc.handle}</span>
                          <span className="text-[9px] text-[#34c759] font-bold bg-[#34c759]/10 px-1.5 py-0.2 rounded-full">
                            Official
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Support Contacts */}
                  {(b.supportEmail || b.securityEmail || b.supportPhone) && (
                    <div className="pt-2 border-t border-black/[0.04] flex flex-wrap items-center gap-4 text-xs text-[#86868b]">
                      {b.securityEmail && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#0071e3]" />
                          <span>Security: <strong className="text-[#1d1d1f]">{b.securityEmail}</strong></span>
                        </span>
                      )}
                      {b.supportPhone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#0071e3]" />
                          <span>Phone: <strong className="text-[#1d1d1f]">{b.supportPhone}</strong></span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
