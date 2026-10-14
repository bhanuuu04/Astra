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
  ArrowUpRight
} from 'lucide-react';
import { SecurityFeedPost, OfficialSocialChannel } from '@/types/consumer-feed';
import {
  BrandIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
  YoutubeIcon
} from '@/components/consumer/BrandIcons';

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
    const text = `🚨 Security Bulletin for ${post.brandName}: "${post.title}". Verify official channels at https://${post.brandDomain}`;
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

  const renderSocialIcon = (platform: OfficialSocialChannel['platform']) => {
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

  const isScamAlert = post.category === 'scam_alert' || post.badgeType === 'critical';

  return (
    <article className="w-full bg-white rounded-[28px] border border-black/[0.05] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      {/* ─────────────────────────────────────────────────────────────
          1. POST HEADER (Apple HIG: Crisp Icon + Verified Check + Pill CTA)
         ───────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-black/[0.04]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <BrandIcon brandName={post.brandName} size={28} />
            {post.isBrandVerified && (
              <div
                className="absolute -bottom-1 -right-1 bg-[#0071e3] text-white rounded-full p-0.5 shadow-sm"
                title="Verified Ground Truth on ASTRA"
              >
                <CheckCircle2 className="w-3 h-3" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-[15px] text-[#1d1d1f] tracking-tight hover:underline cursor-pointer">
                {post.brandName}
              </span>
              <span className="text-xs text-[#86868b] font-normal">
                {post.officialSocials[0]?.handle || `@${post.brandName.toLowerCase()}`}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-[#86868b]">{post.timestamp}</span>
              <span className="text-black/20 text-xs">·</span>
              <span className="text-[11px] font-medium text-[#0071e3] flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>{post.brandDomain}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Badge Category Tag */}
          <span
            className={`text-[11px] font-semibold px-3 py-1 rounded-full tracking-tight ${
              post.badgeType === 'critical'
                ? 'bg-[#ff3b30]/10 text-[#ff3b30]'
                : post.badgeType === 'warning'
                ? 'bg-[#ff9500]/10 text-[#ff9500]'
                : 'bg-[#34c759]/10 text-[#34c759]'
            }`}
          >
            {post.badgeText}
          </span>

          {/* Follow Pill Button */}
          <button
            type="button"
            onClick={() => onToggleFollow(post.brandId)}
            className={`text-xs font-semibold px-4 py-1.5 rounded-full transition cursor-pointer ${
              post.isFollowingBrand
                ? 'bg-black/[0.05] text-[#86868b] hover:bg-black/[0.08]'
                : 'bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-sm'
            }`}
          >
            {post.isFollowingBrand ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. VISUAL MEDIA CARD (Light & Premium Apple Infographic Banner)
         ───────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5">
        <div className="relative bg-gradient-to-b from-[#fbfbfd] via-[#f7f7f9] to-[#f2f2f5] text-[#1d1d1f] rounded-[22px] p-5 sm:p-6 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
          {/* Ambient Apple-style subtle pastel glow */}
          <div
            className={`absolute -right-12 -top-12 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none ${
              post.visualTheme === 'rose'
                ? 'bg-[#ff3b30]'
                : post.visualTheme === 'amber'
                ? 'bg-[#ff9500]'
                : 'bg-[#0071e3]'
            }`}
          />

          <div className="relative z-10 space-y-4">
            {/* Header Telemetry line */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-xl ${
                    post.visualTheme === 'rose'
                      ? 'bg-[#ff3b30]/10 text-[#ff3b30]'
                      : 'bg-[#0071e3]/10 text-[#0071e3]'
                  }`}
                >
                  {isScamAlert ? <AlertTriangle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                </div>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-[#86868b]">
                  ASTRA SENTINEL · CRYPTOGRAPHIC RADAR
                </span>
              </div>

              <span className="text-[10px] font-semibold text-[#34c759] bg-[#34c759]/10 px-2.5 py-0.5 rounded-full border border-[#34c759]/20">
                VERIFIED GROUND TRUTH
              </span>
            </div>

            {/* Headline */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f] leading-snug">
                {post.visualGraphicHeadline}
              </h3>
              <p className="text-xs text-[#515154] mt-1">
                {post.visualGraphicSubhead}
              </p>
            </div>

            {/* Split Comparison Cards (Apple Clean Surface Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Left: Authentic Official Channels */}
              <div className="bg-white/90 backdrop-blur-md border border-[#34c759]/25 rounded-2xl p-3.5 space-y-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1d1d1f]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                    <span>Official Verified Assets</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-bold bg-[#34c759]/10 px-2 py-0.5 rounded-full text-[#34c759]">
                    CONFIRMED
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between bg-[#f5f5f7] px-3 py-2 rounded-xl border border-black/[0.04]">
                    <span className="text-[#1d1d1f] font-mono text-[11px] truncate">
                      https://{post.brandDomain}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(`https://${post.brandDomain}`)}
                      className="text-[#0071e3] hover:text-[#0077ed] transition ml-1 cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedDomain === `https://${post.brandDomain}` ? (
                        <Check className="w-3.5 h-3.5 text-[#34c759]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {post.officialSocials.slice(0, 2).map((soc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-[#f5f5f7] px-3 py-2 rounded-xl border border-black/[0.04] text-[11px]"
                    >
                      <span className="flex items-center gap-1.5 text-[#1d1d1f]">
                        {renderSocialIcon(soc.platform)}
                        <span>{soc.handle}</span>
                      </span>
                      <span className="text-[10px] text-[#34c759] font-semibold">Official</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Imposter Threats */}
              <div className="bg-white/90 backdrop-blur-md border border-[#ff3b30]/25 rounded-2xl p-3.5 space-y-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1d1d1f]">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#ff3b30]" />
                    <span>Deceptive Imposters</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-bold bg-[#ff3b30]/10 px-2 py-0.5 rounded-full text-[#ff3b30]">
                    BLOCKED / FAKE
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {post.threatWatchout?.fakeHandles ? (
                    post.threatWatchout.fakeHandles.map((handle, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-[#ff3b30]/[0.05] px-3 py-2 rounded-xl border border-[#ff3b30]/20 text-[11px] text-[#ff3b30]"
                      >
                        <span className="truncate font-medium">❌ {handle}</span>
                        <span className="text-[9px] font-bold text-[#ff3b30] uppercase">Fake Profile</span>
                      </div>
                    ))
                  ) : post.threatWatchout?.fakeDomains ? (
                    post.threatWatchout.fakeDomains.slice(0, 2).map((dom, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-[#ff3b30]/[0.05] px-3 py-2 rounded-xl border border-[#ff3b30]/20 text-[11px] text-[#ff3b30]"
                      >
                        <span className="truncate font-medium">❌ {dom}</span>
                        <span className="text-[9px] font-bold text-[#ff3b30] uppercase">Phishing</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-[#86868b] py-2.5 text-center italic">
                      Zero active impersonators currently reported.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metric Capsules */}
            {post.visualStats && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {post.visualStats.map((st, i) => (
                  <div key={i} className="bg-white/80 border border-black/[0.05] py-2 px-3 rounded-xl text-center shadow-2xs">
                    <div className="text-[10px] text-[#86868b]">{st.label}</div>
                    <div className="text-xs font-semibold text-[#1d1d1f] mt-0.5">{st.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ENGAGEMENT BAR (Apple iOS Style Action Row)
         ───────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3 flex items-center justify-between border-y border-black/[0.04] bg-white">
        <div className="flex items-center gap-4">
          {/* Like / Helpful button */}
          <button
            type="button"
            onClick={() => onToggleHelpful(post.id)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#86868b] hover:text-[#ff3b30] transition cursor-pointer group"
          >
            <motion.div whileTap={{ scale: 1.3 }}>
              <Heart
                className={`w-5 h-5 transition ${
                  post.isHelpful
                    ? 'fill-[#ff3b30] text-[#ff3b30]'
                    : 'text-[#86868b] group-hover:text-[#ff3b30]'
                }`}
              />
            </motion.div>
            <span className={post.isHelpful ? 'text-[#ff3b30]' : ''}>
              {post.helpfulCount}
            </span>
          </button>

          {/* Comments button */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] transition cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentsCount}</span>
          </button>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] transition cursor-pointer"
            title="Share Alert & Warn Friends"
          >
            <Share2 className="w-5 h-5" />
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Deep link scanner button */}
          <button
            type="button"
            onClick={() => onScanLinkForBrand(post.brandDomain)}
            className="inline-flex items-center gap-1 text-xs text-[#0071e3] hover:text-[#0077ed] font-semibold py-1.5 px-3 rounded-full bg-[#0071e3]/10 hover:bg-[#0071e3]/15 transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Verify URL</span>
          </button>

          {/* Save / Bookmark button */}
          <button
            type="button"
            onClick={() => onToggleSave(post.id)}
            className="text-[#86868b] hover:text-[#1d1d1f] transition cursor-pointer"
            title="Bookmark Alert"
          >
            <Bookmark
              className={`w-5 h-5 ${post.isSaved ? 'fill-[#1d1d1f] text-[#1d1d1f]' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. POST CONTENT / CAPTION & CONFIRMED OFFICIAL ASSETS
         ───────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Title */}
        <h4 className="text-base sm:text-lg font-bold text-[#1d1d1f] tracking-tight">
          {post.title}
        </h4>

        {/* Content paragraph */}
        <p className="text-sm text-[#424245] leading-relaxed">
          {post.content}
        </p>

        {/* Threat Advice Box */}
        {post.threatWatchout && (
          <div className="p-4 rounded-2xl bg-[#ff3b30]/[0.05] border border-[#ff3b30]/15 space-y-1.5">
            <div className="flex items-center gap-2 text-[#ff3b30] font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Consumer Safety Advice:</span>
            </div>
            <p className="text-xs text-[#1d1d1f]/80 leading-relaxed">
              {post.threatWatchout.advice}
            </p>
          </div>
        )}

        {/* CONFIRMED OFFICIAL BRAND ASSETS CHIPS */}
        <div className="pt-3 border-t border-black/[0.04] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Confirmed Official Assets</span>
            </span>
            <span className="text-[11px] text-[#86868b]">Safe to open or copy</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {post.officialWebsites.map((web, idx) => (
              <a
                key={idx}
                href={web.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-xs font-medium text-[#1d1d1f] transition cursor-pointer"
              >
                <Lock className="w-3 h-3 text-[#34c759]" />
                <span className="font-semibold">{web.url.replace(/^https?:\/\//, '')}</span>
                <ArrowUpRight className="w-3 h-3 text-[#86868b]" />
              </a>
            ))}

            {post.officialSocials.map((soc, idx) => (
              <a
                key={idx}
                href={soc.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-xs font-medium text-[#1d1d1f] transition cursor-pointer"
              >
                {renderSocialIcon(soc.platform)}
                <span>{soc.handle}</span>
                <span className="text-[9px] text-[#34c759] font-bold bg-[#34c759]/10 px-1.5 py-0.2 rounded-full">
                  Official
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. COMMUNITY DISCUSSION DRAWER (iOS Style)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-black/[0.04] bg-[#f5f5f7] p-5 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-[#0071e3]" />
                <span>Consumer Community Reports ({post.comments.length})</span>
              </span>
              <span className="text-[11px] text-[#86868b]">
                Verified community telemetry
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {post.comments.length === 0 ? (
                <p className="text-xs text-[#86868b] italic py-2">
                  No community sightings reported yet.
                </p>
              ) : (
                post.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-black/[0.04] shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#0071e3]/10 text-[#0071e3] font-bold text-xs flex items-center justify-center shrink-0">
                      {comm.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-[#1d1d1f]">{comm.author}</span>
                          {comm.isVerifiedConsumer && (
                            <span className="text-[9px] bg-[#34c759]/10 text-[#34c759] px-1.5 py-0.2 rounded-full font-semibold">
                              Verified
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#86868b]">{comm.timeAgo}</span>
                      </div>
                      <p className="text-xs text-[#424245] mt-1 leading-relaxed">{comm.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input Form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Share a sighting or report a fake account for this brand..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white border border-black/[0.08] rounded-full text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full text-xs font-semibold disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
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
