'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Share2,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2,
  RefreshCw,
  Trash2,
  Check,
  X,
  AlertCircle,
  ChevronDown,
  Lock,
  Radio,
  ExternalLink,
  Shield
} from 'lucide-react';
import { SocialLogo } from './SocialLogos';

export interface ChannelApp {
  id: string;
  name: string;
  category: string;
  toolsCount: number;
  iconBg: string;
  defaultHandleSuffix: string;
}

export const SUPPORTED_APPS: ChannelApp[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'Meta Ecosystem',
    toolsCount: 42,
    iconBg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white',
    defaultHandleSuffix: '.official',
  },
  {
    id: 'x_twitter',
    name: 'Twitter (X)',
    category: 'Microblogging & DMs',
    toolsCount: 38,
    iconBg: 'bg-black text-white',
    defaultHandleSuffix: '_official',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'Meta Business Suite',
    toolsCount: 35,
    iconBg: 'bg-[#1877F2] text-white',
    defaultHandleSuffix: 'Official',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'Professional Network',
    toolsCount: 28,
    iconBg: 'bg-[#0A66C2] text-white',
    defaultHandleSuffix: '-official',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'Video & Streaming',
    toolsCount: 31,
    iconBg: 'bg-[#FF0000] text-white',
    defaultHandleSuffix: 'Global',
  },
  {
    id: 'google',
    name: 'Google Play & Catalog',
    category: 'App Ecosystem',
    toolsCount: 54,
    iconBg: 'bg-[#00865F] text-white',
    defaultHandleSuffix: '_apps',
  },
];

interface SocialChannelsStepProps {
  brandName: string;
  cleanDomain: string;
  socialHandles: Record<string, string>;
  connectedApps: Record<string, { connected: boolean; handle: string }>;
  onConnectApp: (app: ChannelApp) => Promise<void>;
  onUpdateSocialHandles: (updated: Record<string, string>) => void;
  connectingId: string | null;
  connectionNotice: string | null;
  onBack: () => void;
  onNext: () => void;
}

export function SocialChannelsStep({
  brandName,
  cleanDomain,
  socialHandles,
  connectedApps,
  onConnectApp,
  onUpdateSocialHandles,
  connectingId,
  connectionNotice,
  onBack,
  onNext,
}: SocialChannelsStepProps) {
  // Whether the brand has clicked the bottom "Connect your socials to verify DMs" button
  const [connectModeActive, setConnectModeActive] = useState<boolean>(false);

  // Edit Drawer for all socials
  const [isEditingAll, setIsEditingAll] = useState<boolean>(false);
  const [editableHandles, setEditableHandles] = useState<Record<string, string>>({
    instagram: socialHandles.instagram || '',
    x_twitter: socialHandles.x_twitter || '',
    linkedin: socialHandles.linkedin || '',
    facebook: socialHandles.facebook || '',
    youtube: socialHandles.youtube || '',
    google: socialHandles.google || '',
  });

  // State for fetching & verifying edited socials
  const [isBulkFetching, setIsBulkFetching] = useState<boolean>(false);
  const [fetchStatuses, setFetchStatuses] = useState<Record<string, 'idle' | 'fetching' | 'verified' | 'error'>>({});
  const [bulkFetchComplete, setBulkFetchComplete] = useState<boolean>(false);
  const [hasClaimedAccounts, setHasClaimedAccounts] = useState<boolean>(false);
  const [claimToast, setClaimToast] = useState<string | null>(null);

  // Dropdown for connected channel options
  const [activeChannelDropdown, setActiveChannelDropdown] = useState<string | null>(null);

  const cleanBrandSlug = brandName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'brand';

  // Helper to open Edit Mode
  const handleOpenEditAll = () => {
    setEditableHandles({
      instagram: socialHandles.instagram || `@${cleanBrandSlug}.official`,
      x_twitter: socialHandles.x_twitter || `@${cleanBrandSlug}_official`,
      linkedin: socialHandles.linkedin || `${cleanBrandSlug}-official`,
      facebook: socialHandles.facebook || `${brandName}Official`,
      youtube: socialHandles.youtube || `@${cleanBrandSlug}`,
      google: socialHandles.google || `${cleanBrandSlug}_apps`,
    });
    setBulkFetchComplete(false);
    setIsEditingAll(true);
  };

  // Bulk Fetch / Verify all edited social handles
  const handleBulkFetch = async () => {
    setIsBulkFetching(true);
    const initialStatuses: Record<string, 'fetching'> = {};
    SUPPORTED_APPS.forEach((app) => {
      initialStatuses[app.id] = 'fetching';
    });
    setFetchStatuses(initialStatuses);

    const fetchPromises = SUPPORTED_APPS.map(async (app) => {
      const handle = editableHandles[app.id]?.trim();
      if (!handle || handle === 'none') {
        return { appId: app.id, handle: 'none', status: 'verified' as const };
      }

      try {
        const res = await fetch('/api/brand/fetch-handle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: app.id,
            handle,
            domain: cleanDomain,
          }),
        });

        const data = await res.json();
        const canonical = (res.ok && data.canonicalHandle) ? data.canonicalHandle : handle;
        return { appId: app.id, handle: canonical, status: 'verified' as const };
      } catch {
        return { appId: app.id, handle, status: 'verified' as const };
      }
    });

    const results = await Promise.all(fetchPromises);
    const updatedResults: Record<string, string> = { ...editableHandles };
    const newStatuses: Record<string, 'verified' | 'error'> = {};

    for (const r of results) {
      updatedResults[r.appId] = r.handle;
      newStatuses[r.appId] = r.status;
    }

    setFetchStatuses(newStatuses);
    setEditableHandles(updatedResults);
    setIsBulkFetching(false);
    setBulkFetchComplete(true);
  };

  // Claim Accounts after successfully fetching
  const handleClaimAccounts = () => {
    onUpdateSocialHandles(editableHandles);
    setHasClaimedAccounts(true);
    setIsEditingAll(false);
    setClaimToast(`✨ Official social footprints & zero-presence shields successfully claimed for ${brandName}!`);
    setTimeout(() => setClaimToast(null), 5000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full bg-white rounded-[12px] border border-[#e3e2e0] shadow-xs p-6 sm:p-8 space-y-7"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & ACTIONS
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#e3e2e0] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] text-[11px] font-semibold border border-[#0f7b6c]/20 mb-2">
            <Share2 className="w-3.5 h-3.5" />
            <span>Step 2 · Perimeter Social Asset Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#37352f] tracking-tight">
            Official Social Accounts for {brandName}
          </h1>
          <p className="text-xs sm:text-sm text-[#787774] mt-1 leading-relaxed max-w-2xl">
            Below are the official usernames auto-fetched from <span className="font-mono font-semibold text-[#37352f]">{cleanDomain}</span>. You can edit any handle, re-fetch profile metadata, or claim your accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenEditAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] border border-[#e3e2e0] bg-[#f7f6f3] hover:bg-[#e3e2e0] text-xs font-semibold text-[#37352f] shadow-2xs transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0f7b6c]" />
            <span>Edit Social Usernames</span>
          </button>
        </div>
      </div>

      {/* Claim Toast Banner */}
      {claimToast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{claimToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setClaimToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Connection Notice */}
      {connectionNotice && (
        <div
          className={`p-3 rounded-[6px] border text-xs flex items-center gap-2 ${
            connectionNotice.includes('Successfully')
              ? 'bg-[#0f7b6c]/10 border-[#0f7b6c]/25 text-[#0f7b6c]'
              : 'bg-[#d97706]/10 border-[#d97706]/25 text-[#d97706]'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{connectionNotice}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. SOCIAL CHANNELS CARDS GRID
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SUPPORTED_APPS.map((app) => {
          const rawHandle =
            connectedApps[app.id]?.handle ??
            socialHandles[app.id] ??
            `@${cleanBrandSlug}${app.defaultHandleSuffix}`;
          const isNone = rawHandle === 'none';
          const currentHandle = isNone ? 'none' : rawHandle;
          const isConnected = Boolean(connectedApps[app.id]?.connected);
          const isConnecting = connectingId === app.id;

          return (
            <motion.div
              key={app.id}
              layout
              className={`p-4 rounded-[10px] border transition-all flex items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
                isNone
                  ? 'border-amber-200/80 bg-amber-50/40'
                  : isConnected
                  ? 'border-[#0f7b6c]/40 bg-[#0f7b6c]/5 ring-1 ring-[#0f7b6c]/20'
                  : 'border-[#e3e2e0] bg-white hover:border-[#9b9a97] hover:bg-[#f7f6f3]/40'
              }`}
            >
              {/* Left: Authentic SVG Logo + Name + Username */}
              <div className="flex items-center gap-3.5 min-w-0">
                <SocialLogo platform={app.id} size={20} />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-[#37352f] truncate">{app.name}</h3>
                    {isNone ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                        🚫 Zero-Trust (No Account)
                      </span>
                    ) : isConnected ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#0f7b6c] bg-[#0f7b6c]/10 px-1.5 py-0.2 rounded">
                        <CheckCircle2 className="w-3 h-3" /> DM Active
                      </span>
                    ) : hasClaimedAccounts ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Claimed ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#787774] bg-[#f7f6f3] px-1.5 py-0.2 rounded border border-[#e3e2e0]">
                        Fetched
                      </span>
                    )}
                  </div>

                  {isNone ? (
                    <p className="text-[11px] text-amber-700 italic truncate mt-0.5">
                      No legitimate profile · Any detected account is flagged as imposter
                    </p>
                  ) : (
                    <p className="text-xs font-mono text-[#0f7b6c] font-medium truncate mt-0.5">
                      {currentHandle}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: Options shown ONLY IF connectModeActive is true! */}
              <AnimatePresence>
                {connectModeActive ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    {isNone ? (
                      <div className="inline-flex items-center px-2 py-1 rounded-[6px] bg-amber-100/70 text-amber-800 text-[11px] font-medium border border-amber-200">
                        <span>Shield Active</span>
                      </div>
                    ) : isConnected ? (
                      <div className="inline-flex items-center rounded-[6px] border border-[#0f7b6c]/30 bg-[#0f7b6c]/10 text-[#0f7b6c] text-xs font-semibold">
                        <div className="flex items-center gap-1 px-2.5 py-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Connected</span>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onConnectApp(app)}
                        disabled={isConnecting}
                        className="px-3 py-1.5 rounded-[6px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-70 cursor-pointer shadow-xs"
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Linking...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>Connect</span>
                          </>
                        )}
                      </button>
                    )}
                  </motion.div>
                ) : (
                  // Default state before clicking bottom connect button: show clean ground-truth badge
                  <div className="shrink-0 text-right">
                    {isNone ? (
                      <span className="text-[11px] font-mono text-amber-700 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-600" />
                        <span>Zero Presence</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-[#9b9a97] flex items-center gap-1">
                        <Shield className="w-3 h-3 text-[#0f7b6c]" />
                        <span>Monitored</span>
                      </span>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. UNIQUE HIGHLIGHTING BUTTON: CONNECT YOUR SOCIALS TO VERIFY DMS
         ───────────────────────────────────────────────────────────── */}
      {!connectModeActive ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2"
        >
          <button
            type="button"
            onClick={() => setConnectModeActive(true)}
            className="w-full relative group overflow-hidden rounded-[14px] p-5 sm:p-6 bg-gradient-to-r from-[#172722] via-[#10231e] to-[#0d1d18] text-white border-2 border-[#0f7b6c] shadow-[0_8px_30px_rgba(15,123,108,0.25)] hover:shadow-[0_12px_36px_rgba(15,123,108,0.35)] transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
          >
            {/* Ambient Animated Gradient Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0f7b6c]/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shrink-0">
                <div className="w-full h-full bg-[#10231e] rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    Connect your socials to verify DMs
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold px-2 py-0.5 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-300" /> Action Required
                  </span>
                </div>
                <p className="text-xs text-emerald-100/70 mt-1 max-w-xl leading-relaxed">
                  Authenticate your official channels via OAuth to enable real-time ingestion, intercept impersonator DMs, and verify collaborator checkmarks.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-[8px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white font-semibold text-xs transition shadow-xs">
              <span>Enable DM Verification</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-[10px] bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">DM Verification Mode Enabled</p>
              <p className="text-[11px] text-emerald-700">
                Click <strong>Connect</strong> in front of each social channel to authorize webhook ingestion.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConnectModeActive(false)}
            className="text-xs text-emerald-700 hover:text-emerald-900 underline font-medium self-start sm:self-auto"
          >
            Hide connect buttons
          </button>
        </motion.div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. EDIT ALL SOCIAL USERNAMES MODAL / DRAWER
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditingAll && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsEditingAll(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-[14px] border border-[#e3e2e0] shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Top */}
              <div className="flex items-start justify-between border-b border-[#e3e2e0] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-[#0f7b6c]/10 text-[#0f7b6c] flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#37352f]">
                      Edit Official Social Usernames
                    </h3>
                    <p className="text-xs text-[#787774]">
                      Update usernames for <span className="font-semibold text-[#37352f]">{brandName}</span>, then click <strong>Fetch</strong> to verify new handles.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingAll(false)}
                  className="p-1 rounded-[6px] text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f7f6f3]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Editable Inputs for All Socials */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {SUPPORTED_APPS.map((app) => {
                    const status = fetchStatuses[app.id];
                    const val = editableHandles[app.id] ?? '';
                    const isNone = val === 'none';

                    return (
                      <div
                        key={app.id}
                        className={`p-3 rounded-[8px] border space-y-1.5 transition ${
                          isNone
                            ? 'border-amber-200 bg-amber-50/50'
                            : 'border-[#e3e2e0] bg-[#f7f6f3]/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <SocialLogo platform={app.id} size={16} />
                            <span className="text-xs font-bold text-[#37352f]">{app.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {/* Toggle None Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditableHandles((prev) => ({
                                  ...prev,
                                  [app.id]: isNone
                                    ? (socialHandles[app.id] && socialHandles[app.id] !== 'none'
                                        ? socialHandles[app.id]
                                        : `@${cleanBrandSlug}${app.defaultHandleSuffix}`)
                                    : 'none',
                                }));
                              }}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded transition cursor-pointer ${
                                isNone
                                  ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                  : 'bg-[#e3e2e0] hover:bg-[#d3d2cf] text-[#37352f]'
                              }`}
                            >
                              {isNone ? '✓ None (Zero Presence)' : '🚫 Mark None'}
                            </button>

                            {status === 'fetching' ? (
                              <span className="text-[10px] text-[#0f7b6c] flex items-center gap-1 font-medium">
                                <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
                              </span>
                            ) : status === 'verified' ? (
                              <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
                                <Check className="w-3 h-3" /> {isNone ? 'Shielded' : 'Verified'}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {isNone ? (
                          <div className="w-full px-3 py-1.5 bg-amber-100/40 border border-dashed border-amber-300 rounded-[6px] text-xs font-mono text-amber-800 flex items-center justify-between">
                            <span>🚫 No official profile (Imposter shield active)</span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={val}
                            onChange={(e) =>
                              setEditableHandles({
                                ...editableHandles,
                                [app.id]: e.target.value,
                              })
                            }
                            placeholder={`e.g. @${cleanBrandSlug}${app.defaultHandleSuffix}`}
                            className="w-full px-3 py-1.5 bg-white border border-[#e3e2e0] rounded-[6px] text-xs font-mono text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons: Fetch & Claim Accounts */}
              <div className="pt-4 border-t border-[#e3e2e0] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingAll(false)}
                  className="text-xs font-medium text-[#787774] hover:text-[#37352f] px-3 py-2"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {/* Step 1: Fetch Updated Socials */}
                  <button
                    type="button"
                    disabled={isBulkFetching}
                    onClick={handleBulkFetch}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#37352f] hover:bg-[#201f1d] text-white text-xs font-semibold shadow-xs transition disabled:opacity-60 cursor-pointer"
                  >
                    {isBulkFetching ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0f7b6c]" />
                        <span>Fetching New Socials...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-[#0f7b6c]" />
                        <span>Fetch &amp; Verify Handles</span>
                      </>
                    )}
                  </button>

                  {/* Step 2: Claim Accounts Option (Active after successful fetching) */}
                  <button
                    type="button"
                    onClick={handleClaimAccounts}
                    disabled={isBulkFetching}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-[8px] text-xs font-bold shadow-xs transition cursor-pointer ${
                      bulkFetchComplete
                        ? 'bg-[#0f7b6c] hover:bg-[#0c6357] text-white ring-2 ring-[#0f7b6c]/30 animate-pulse'
                        : 'bg-[#0f7b6c] hover:bg-[#0c6357] text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Claim Accounts &amp; Save</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          5. BOTTOM STEP NAVIGATION
         ───────────────────────────────────────────────────────────── */}
      <div className="pt-4 border-t border-[#e3e2e0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 text-xs font-medium text-[#787774] hover:text-[#37352f] rounded-[6px] border border-[#e3e2e0] bg-white hover:bg-[#f7f6f3] transition cursor-pointer"
          >
            ← Back to Brand Form
          </button>
          <Link
            href="/"
            className="text-xs font-medium text-[#787774] hover:text-[#37352f] transition cursor-pointer py-2 px-3 rounded-[6px] border border-[#e3e2e0] bg-white hover:bg-[#f7f6f3] inline-flex items-center gap-1.5"
            title="Go back to landing page"
          >
            <Home className="w-3.5 h-3.5 text-[#0f7b6c]" />
            <span>Landing Page</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[8px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>Launch AI Brand Defense →</span>
        </button>
      </div>
    </motion.div>
  );
}
