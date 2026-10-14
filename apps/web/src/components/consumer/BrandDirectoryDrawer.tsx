'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Search,
  CheckCircle2,
  ExternalLink,
  Lock,
  Globe,
  Mail,
  Phone,
  AlertTriangle,
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { Instagram, Twitter, Linkedin, Youtube } from '@/components/socials/SocialLogos';
import { BrandSecurityProfile } from '@/types/consumer-feed';

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
        return <Instagram className="w-3.5 h-3.5 text-pink-500" />;
      case 'x_twitter':
        return <Twitter className="w-3.5 h-3.5 text-sky-500" />;
      case 'linkedin':
        return <Linkedin className="w-3.5 h-3.5 text-blue-600" />;
      case 'youtube':
        return <Youtube className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-[#0f7b6c]" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="relative w-full max-w-3xl max-h-[88vh] bg-white rounded-[16px] border border-[#e3e2e0] shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#e3e2e0] flex items-center justify-between bg-[#f7f6f3]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-[#0f7b6c] text-white flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#37352f]">
                  Verified Brand Ground Truth Directory
                </h3>
                <p className="text-[11px] text-[#787774]">
                  Cryptographically confirmed official domains and social handles on ASTRA apps
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white hover:bg-[#e3e2e0] border border-[#e3e2e0] flex items-center justify-center text-[#787774] hover:text-[#37352f] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-[#e3e2e0] bg-white">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9b9a97]" />
              <input
                type="text"
                placeholder="Search by brand name, official domain, or handle (e.g. NilaPay, stripe.com, @apple)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#f7f6f3] border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Brands List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#787774]">
                No verified brands match &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filtered.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-[#e3e2e0] rounded-[12px] p-4 sm:p-5 shadow-xs space-y-3.5 hover:border-[#0f7b6c]/50 transition"
                >
                  {/* Brand Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={b.logoUrl || `https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`}
                        alt={b.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#e3e2e0] bg-white p-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#37352f]">{b.name}</h4>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0f7b6c]/10 text-[#0f7b6c] text-[10px] font-semibold border border-[#0f7b6c]/20">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Verified</span>
                          </span>
                          {b.isCustomBrand && (
                            <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                              Onboarded by You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#787774]">{b.legalEntity || b.industry}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          onScanBrandUrl(b.domain);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-[6px] border border-[#e3e2e0] hover:bg-[#f7f6f3] text-xs font-medium text-[#37352f] flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Search className="w-3 h-3 text-[#0f7b6c]" />
                        <span>Scan URL</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectBrandFilter(b.name);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-[6px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <span>View Feed</span>
                      </button>
                    </div>
                  </div>

                  {/* Official Real Websites */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9b9a97]">
                      Real Official Websites (Ground Truth)
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {b.officialWebsites.map((web, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#f7f6f3] border border-[#e3e2e0] text-xs font-mono text-[#37352f]"
                        >
                          <Lock className="w-3 h-3 text-[#0f7b6c]" />
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
                            className="text-[#9b9a97] hover:text-[#37352f] ml-1 transition"
                            title="Copy URL"
                          >
                            {copiedText === web.url ? (
                              <Check className="w-3 h-3 text-[#0f7b6c]" />
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
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9b9a97]">
                      Real Official Social Handles
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {b.officialSocials.map((soc, idx) => (
                        <a
                          key={idx}
                          href={soc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-white border border-[#e3e2e0] hover:bg-[#f7f6f3] text-xs text-[#37352f] transition shadow-2xs"
                        >
                          {renderSocialIcon(soc.platform)}
                          <span className="font-medium font-mono">{soc.handle}</span>
                          <span className="text-[9px] text-[#0f7b6c] font-bold bg-[#0f7b6c]/10 px-1 rounded">
                            Official
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Support Contacts */}
                  {(b.supportEmail || b.securityEmail || b.supportPhone) && (
                    <div className="pt-2 border-t border-[#f0efed] flex flex-wrap items-center gap-4 text-[11px] text-[#787774]">
                      {b.securityEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#0f7b6c]" />
                          <span>Security: <strong className="font-mono text-[#37352f]">{b.securityEmail}</strong></span>
                        </span>
                      )}
                      {b.supportPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#0f7b6c]" />
                          <span>Phone: <strong className="font-mono text-[#37352f]">{b.supportPhone}</strong></span>
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
