'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ExternalLink,
  Lock,
  Globe,
  Search,
  Copy,
  Check,
  Send,
  UserCheck,
  Building2,
  Radio,
  Sparkles
} from 'lucide-react';
import { Instagram, Twitter, Linkedin, Youtube } from '@/components/socials/SocialLogos';
import { SecurityFeedPost, OfficialSocialChannel } from '@/types/consumer-feed';

interface ConsumerSecurityCardProps {
  post: SecurityFeedPost;
  onToggleHelpful: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onToggleFollow: (brandId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onScanLinkForBrand: (domain: string) => void;
}

export function ConsumerSecurityCard({
  post,
  onToggleHelpful,
  onToggleSave,
  onToggleFollow,
  onAddComment,
  onScanLinkForBrand,
}: ConsumerSecurityCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  const handleShare = async () => {
    const text = `🚨 Security Alert from ${post.brandName} on ASTRA: "${post.title}". Verify official channels at https://${post.brandDomain}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyText = async (text: string) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedDomain(text);
      setTimeout(() => setCopiedDomain(null), 1800);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(post.id, newCommentText.trim());
    setNewCommentText('');
  };

  // Render social icon for official handle
  const renderSocialIcon = (platform: OfficialSocialChannel['platform']) => {
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

  const isScamAlert = post.category === 'scam_alert' || post.badgeType === 'critical';

  return (
    <article className="w-full bg-white rounded-[16px] border border-[#e3e2e0] shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* ─────────────────────────────────────────────────────────────
          1. POST HEADER (Instagram Style: Avatar + Brand + Follow)
         ───────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#f0efed]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={post.brandLogo || `https://www.google.com/s2/favicons?domain=${post.brandDomain}&sz=128`}
              alt={post.brandName}
              className="w-10 h-10 rounded-full object-cover border border-[#e3e2e0] bg-white p-0.5"
            />
            {post.isBrandVerified && (
              <div
                className="absolute -bottom-1 -right-1 bg-[#0f7b6c] text-white rounded-full p-0.5 shadow-2xs"
                title="Verified Ground Truth on ASTRA"
              >
                <CheckCircle2 className="w-3 h-3" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-[#37352f] tracking-tight hover:underline cursor-pointer">
                {post.brandName}
              </span>
              <span className="text-[11px] text-[#9b9a97]">·</span>
              <span className="text-[11px] text-[#787774] font-mono">
                {post.officialSocials[0]?.handle || `@${post.brandName.toLowerCase()}`}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-[#9b9a97]">{post.timestamp}</span>
              <span className="text-[#e3e2e0]">|</span>
              <span className="text-[10px] font-mono text-[#0f7b6c] font-medium flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>{post.brandDomain}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge Category Tag */}
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              post.badgeType === 'critical'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : post.badgeType === 'warning'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {post.badgeText}
          </span>

          {/* Follow Button (Instagram style) */}
          <button
            type="button"
            onClick={() => onToggleFollow(post.brandId)}
            className={`text-xs font-semibold px-3 py-1 rounded-[6px] transition cursor-pointer ${
              post.isFollowingBrand
                ? 'bg-[#f7f6f3] text-[#787774] border border-[#e3e2e0] hover:bg-[#e3e2e0]'
                : 'bg-[#0f7b6c] text-white hover:bg-[#0c6357] shadow-2xs'
            }`}
          >
            {post.isFollowingBrand ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. VISUAL MEDIA CARD (Instagram "Photo" / Security Infographic)
         ───────────────────────────────────────────────────────────── */}
      <div className="relative bg-[#18181b] text-white p-5 sm:p-6 overflow-hidden">
        {/* Ambient background decoration */}
        <div
          className={`absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl opacity-30 ${
            post.visualTheme === 'rose'
              ? 'bg-rose-600'
              : post.visualTheme === 'amber'
              ? 'bg-amber-500'
              : 'bg-[#0f7b6c]'
          }`}
        />

        <div className="relative z-10 space-y-4">
          {/* Graphic Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  post.visualTheme === 'rose'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isScamAlert ? <AlertTriangle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              </div>
              <span className="text-[11px] font-mono tracking-wider uppercase text-white/70">
                ASTRA VERIFIED TELEMETRY
              </span>
            </div>

            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
              AUTH LEVEL: GROUND TRUTH
            </span>
          </div>

          {/* Graphic Headline */}
          <div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug">
              {post.visualGraphicHeadline}
            </h3>
            <p className="text-xs text-white/70 mt-1 font-mono">
              {post.visualGraphicSubhead}
            </p>
          </div>

          {/* SPLIT COMPARISON: OFFICIAL vs FAKE IMPOSTER (Visual Instagram Vibe) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Real Official Channels (Green Box) */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Real Official Assets</span>
                </span>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
                  VERIFIED
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between bg-black/40 px-2.5 py-1.5 rounded border border-emerald-500/20">
                  <span className="text-white/80 font-mono text-[11px]">https://{post.brandDomain}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(`https://${post.brandDomain}`)}
                    className="text-emerald-400 hover:text-emerald-300 transition"
                    title="Copy URL"
                  >
                    {copiedDomain === `https://${post.brandDomain}` ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                {post.officialSocials.slice(0, 2).map((soc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-black/40 px-2.5 py-1.5 rounded border border-emerald-500/20 text-[11px]"
                  >
                    <span className="flex items-center gap-1 text-white/80 font-mono">
                      {renderSocialIcon(soc.platform)}
                      <span>{soc.handle}</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Official</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Imposter Threats (Red Box) */}
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-400">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Deceptive Imposters</span>
                </span>
                <span className="text-[10px] font-mono uppercase bg-rose-500/20 px-1.5 py-0.5 rounded text-rose-300">
                  BLOCKED / FAKE
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                {post.threatWatchout?.fakeHandles ? (
                  post.threatWatchout.fakeHandles.map((handle, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-black/40 px-2.5 py-1.5 rounded border border-rose-500/20 text-[11px] text-rose-300 font-mono"
                    >
                      <span>❌ {handle}</span>
                      <span className="text-[9px] uppercase font-bold text-rose-400">Fake Profile</span>
                    </div>
                  ))
                ) : post.threatWatchout?.fakeDomains ? (
                  post.threatWatchout.fakeDomains.slice(0, 2).map((dom, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-black/40 px-2.5 py-1.5 rounded border border-rose-500/20 text-[11px] text-rose-300 font-mono"
                    >
                      <span>❌ {dom}</span>
                      <span className="text-[9px] uppercase font-bold text-rose-400">Phishing</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-white/60 py-2 text-center italic">
                    No active imposters currently reported for this perimeter.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Telemetry Stats */}
          {post.visualStats && (
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-center">
              {post.visualStats.map((st, i) => (
                <div key={i} className="bg-white/5 py-1.5 px-2 rounded-lg">
                  <div className="text-[10px] text-white/50">{st.label}</div>
                  <div className="text-xs font-bold font-mono text-white mt-0.5">{st.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ENGAGEMENT ACTION BAR (Instagram Style)
         ───────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-5 py-3 flex items-center justify-between border-b border-[#f0efed] bg-white">
        <div className="flex items-center gap-4">
          {/* Like / Helpful button */}
          <button
            type="button"
            onClick={() => onToggleHelpful(post.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#787774] hover:text-rose-600 transition cursor-pointer group"
          >
            <motion.div whileTap={{ scale: 1.3 }}>
              <Heart
                className={`w-5 h-5 transition ${
                  post.isHelpful
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-[#787774] group-hover:text-rose-500'
                }`}
              />
            </motion.div>
            <span className={post.isHelpful ? 'font-bold text-rose-600' : ''}>
              {post.helpfulCount}
            </span>
          </button>

          {/* Comments / Reports button */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#787774] hover:text-[#37352f] transition cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentsCount}</span>
          </button>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-medium text-[#787774] hover:text-[#37352f] transition cursor-pointer"
            title="Share Alert & Warn Friends"
          >
            <Share2 className="w-5 h-5" />
            <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Scan Link Button (Direct deep-link to Scanner) */}
          <button
            type="button"
            onClick={() => onScanLinkForBrand(post.brandDomain)}
            className="inline-flex items-center gap-1.5 text-xs text-[#0f7b6c] hover:bg-[#0f7b6c]/10 font-semibold px-2.5 py-1.5 rounded-[6px] border border-[#0f7b6c]/30 transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Verify URL for Brand</span>
          </button>

          {/* Save / Bookmark button */}
          <button
            type="button"
            onClick={() => onToggleSave(post.id)}
            className="text-[#787774] hover:text-[#37352f] transition cursor-pointer"
            title="Bookmark Alert"
          >
            <Bookmark
              className={`w-5 h-5 ${post.isSaved ? 'fill-[#37352f] text-[#37352f]' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. POST CONTENT / CAPTION & OFFICIAL CHANNELS DIRECTORY
         ───────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Title */}
        <h4 className="text-base font-bold text-[#37352f] tracking-tight">
          {post.title}
        </h4>

        {/* Content paragraph */}
        <p className="text-xs sm:text-sm text-[#5a5855] leading-relaxed">
          {post.content}
        </p>

        {/* Threat Watchout Box */}
        {post.threatWatchout && (
          <div className="p-3.5 rounded-[10px] bg-rose-50/70 border border-rose-200/80 space-y-2">
            <div className="flex items-center gap-2 text-rose-900 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Consumer Safety Advice:</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              {post.threatWatchout.advice}
            </p>
          </div>
        )}

        {/* OFFICIAL CHANNELS DIRECTORY (Telling their real websites and socials!) */}
        <div className="pt-2 border-t border-[#f0efed] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#787774] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#0f7b6c]" />
              <span>Confirmed Official Brand Directory</span>
            </span>
            <span className="text-[10px] text-[#9b9a97]">Click to open or copy safely</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Official Website Pills */}
            {post.officialWebsites.map((web, idx) => (
              <a
                key={idx}
                href={web.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#f7f6f3] hover:bg-[#e3e2e0] border border-[#e3e2e0] text-xs font-mono text-[#37352f] transition cursor-pointer group"
              >
                <Lock className="w-3 h-3 text-[#0f7b6c]" />
                <span className="font-semibold">{web.url.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="w-3 h-3 text-[#9b9a97] group-hover:text-[#37352f]" />
              </a>
            ))}

            {/* Official Social Pills */}
            {post.officialSocials.map((soc, idx) => (
              <a
                key={idx}
                href={soc.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white hover:bg-[#f7f6f3] border border-[#e3e2e0] text-xs font-medium text-[#37352f] transition cursor-pointer shadow-2xs"
              >
                {renderSocialIcon(soc.platform)}
                <span>{soc.handle}</span>
                <span className="text-[9px] text-[#0f7b6c] font-bold bg-[#0f7b6c]/10 px-1 py-0.2 rounded">
                  Official
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. COMMUNITY INTEL & COMMENTS DRAWER (Instagram Style)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#f0efed] bg-[#faf9f8] p-4 sm:p-5 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#37352f] flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-[#0f7b6c]" />
                <span>Consumer Community Intel &amp; Sightings ({post.comments.length})</span>
              </span>
              <span className="text-[11px] text-[#787774]">
                Report sightings or verify with other users
              </span>
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {post.comments.length === 0 ? (
                <p className="text-xs text-[#9b9a97] italic py-2">
                  No consumer reports yet. Be the first to confirm or add info!
                </p>
              ) : (
                post.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className="flex items-start gap-2.5 bg-white p-3 rounded-[8px] border border-[#e3e2e0] shadow-2xs"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#0f7b6c]/10 text-[#0f7b6c] font-bold text-xs flex items-center justify-center shrink-0">
                      {comm.avatar ? (
                        <img src={comm.avatar} alt={comm.author} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        comm.author.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#37352f]">{comm.author}</span>
                          {comm.isVerifiedConsumer && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 rounded font-semibold">
                              Verified Consumer
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#9b9a97]">{comm.timeAgo}</span>
                      </div>
                      <p className="text-xs text-[#5a5855] mt-1 leading-relaxed">{comm.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input Form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Share a sighting or report suspicious activity for this brand..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-white border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c] focus:ring-1 focus:ring-[#0f7b6c]"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-4 py-2 bg-[#0f7b6c] hover:bg-[#0c6357] text-white rounded-[8px] text-xs font-semibold disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
