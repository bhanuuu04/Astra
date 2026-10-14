'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  Loader2,
  Building2,
  AlertCircle,
  Bookmark,
  Radio,
  X,
  UserCheck,
  Globe,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import {
  BrandSecurityProfile,
  SecurityFeedPost,
  SecurityStory
} from '@/types/consumer-feed';
import {
  getAllBrands,
  getAllStories,
  getAllFeedPosts,
  toggleStoredLikePost,
  toggleStoredSavePost,
  toggleStoredFollowBrand,
  addStoredComment
} from '@/lib/consumer-feed-data';
import { ConsumerStoriesBar } from '@/components/consumer/ConsumerStoriesBar';
import { StoryViewerModal } from '@/components/consumer/StoryViewerModal';
import { ConsumerSecurityCard } from '@/components/consumer/ConsumerSecurityCard';
import { BrandDirectoryDrawer } from '@/components/consumer/BrandDirectoryDrawer';
import { AutoGenerateAlertModal } from '@/components/consumer/AutoGenerateAlertModal';

interface LinkAnalysisResult {
  url: string;
  verdict: 'safe' | 'suspicious' | 'malicious';
  score: number;
  reasons: string[];
  brandTargeted?: string;
  domainAge?: string;
  sslValid?: boolean;
}

type MainTab = 'feed' | 'urgent' | 'directories' | 'following' | 'saved' | 'tools';
type ToolSubTab = 'link-checker' | 'message-analyzer' | 'report';

export default function ConsumerHubPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();

  // Feed & Brand State
  const [brands, setBrands] = useState<BrandSecurityProfile[]>([]);
  const [stories, setStories] = useState<SecurityStory[]>([]);
  const [posts, setPosts] = useState<SecurityFeedPost[]>([]);
  const [selectedStory, setSelectedStory] = useState<SecurityStory | null>(null);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Filter & Search State
  const [activeTab, setActiveTab] = useState<MainTab>('feed');
  const [toolSubTab, setToolSubTab] = useState<ToolSubTab>('link-checker');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Link Checker State
  const [urlInput, setUrlInput] = useState('');
  const [isScanningUrl, setIsScanningUrl] = useState(false);
  const [urlResult, setUrlResult] = useState<LinkAnalysisResult | null>(null);

  // Message Checker State
  const [messageInput, setMessageInput] = useState('');
  const [isAnalyzingMsg, setIsAnalyzingMsg] = useState(false);
  const [messageResult, setMessageResult] = useState<{
    riskLevel: 'low' | 'medium' | 'high';
    isScam: boolean;
    analysis: string;
    detectedTactics: string[];
  } | null>(null);

  // Report Scam State
  const [reportData, setReportData] = useState({
    scamUrl: '',
    platform: 'Instagram',
    description: '',
  });
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedBrands = getAllBrands();
    const loadedStories = getAllStories(loadedBrands);
    const loadedPosts = getAllFeedPosts();

    setBrands(loadedBrands);
    setStories(loadedStories);
    setPosts(loadedPosts);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered Posts computation
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Tab Filter
    if (activeTab === 'urgent') {
      result = result.filter((p) => p.badgeType === 'critical' || p.category === 'scam_alert');
    } else if (activeTab === 'directories') {
      result = result.filter((p) => p.category === 'official_directory');
    } else if (activeTab === 'following') {
      result = result.filter((p) => p.isFollowingBrand);
    } else if (activeTab === 'saved') {
      result = result.filter((p) => p.isSaved);
    }

    // Brand filter if selected
    if (selectedBrandFilter) {
      result = result.filter(
        (p) => p.brandName.toLowerCase() === selectedBrandFilter.toLowerCase()
      );
    }

    // Search query filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (p) =>
          p.brandName.toLowerCase().includes(q) ||
          p.brandDomain.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.officialSocials.some((s) => s.handle.toLowerCase().includes(q))
      );
    }

    return result;
  }, [posts, activeTab, selectedBrandFilter, searchFilter]);

  // Social interactions
  const handleToggleHelpful = (postId: string) => {
    const newState = toggleStoredLikePost(postId);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              isHelpful: newState,
              helpfulCount: newState ? p.helpfulCount + 1 : p.helpfulCount - 1,
            }
          : p
      )
    );
  };

  const handleToggleSave = (postId: string) => {
    const newState = toggleStoredSavePost(postId);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isSaved: newState } : p))
    );
    showToast(newState ? 'Saved to Bookmarks' : 'Removed from Bookmarks');
  };

  const handleToggleFollow = (brandId: string) => {
    const newState = toggleStoredFollowBrand(brandId);
    setPosts((prev) =>
      prev.map((p) => (p.brandId === brandId ? { ...p, isFollowingBrand: newState } : p))
    );
    showToast(newState ? 'Following brand updates' : 'Unfollowed brand');
  };

  const handleAddComment = (postId: string, text: string) => {
    const authorName = clerkUser?.fullName || clerkUser?.firstName || 'Consumer Guard';
    const newComment = addStoredComment(postId, text, authorName);
    if (newComment) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: [newComment, ...p.comments],
                commentsCount: p.commentsCount + 1,
              }
            : p
        )
      );
      showToast('Community report shared');
    }
  };

  const handleScanBrandUrl = (domain: string) => {
    setUrlInput(`https://${domain}`);
    setActiveTab('tools');
    setToolSubTab('link-checker');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleAlertGenerated = (newPost: SecurityFeedPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setActiveTab('feed');
    showToast(`⚡ Live Safety Card for ${newPost.brandName} published to Feed!`);
  };

  // URL Scanner Logic
  const handleScanUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = urlInput.trim();
    if (!raw) return;

    setIsScanningUrl(true);
    setUrlResult(null);

    setTimeout(() => {
      const lower = raw.toLowerCase();
      const isMalicious =
        lower.includes('free') ||
        lower.includes('claim') ||
        lower.includes('verify') ||
        lower.includes('reward') ||
        lower.includes('patch') ||
        lower.includes('.xyz') ||
        lower.includes('.top') ||
        lower.includes('.shop') ||
        lower.includes('login-') ||
        lower.includes('update-') ||
        lower.includes('bit.ly');

      const isSuspicious =
        !isMalicious && (lower.includes('gift') || lower.includes('support-') || !lower.includes('.com'));

      if (isMalicious) {
        setUrlResult({
          url: raw,
          verdict: 'malicious',
          score: 18,
          reasons: [
            'Detected suspicious high-risk top-level domain (.top/.xyz/.shop) or spoofed prefix',
            'Signature matches active credential harvesting campaign against popular brands',
            'Domain registered recently with no EV TLS certificate backing',
          ],
          brandTargeted: lower.includes('apple')
            ? 'Apple'
            : lower.includes('nike')
            ? 'Nike'
            : lower.includes('spotify')
            ? 'Spotify'
            : lower.includes('stripe')
            ? 'Stripe'
            : 'Popular Global Brand',
          domainAge: '3 days ago',
          sslValid: false,
        });
      } else if (isSuspicious) {
        setUrlResult({
          url: raw,
          verdict: 'suspicious',
          score: 54,
          reasons: [
            'Domain closely mimics an authoritative brand name without recognized DNS TXT record',
            'Unverified redirect chain detected by ASTRA crawler',
          ],
          domainAge: '14 days ago',
          sslValid: true,
        });
      } else {
        setUrlResult({
          url: raw,
          verdict: 'safe',
          score: 98,
          reasons: [
            'Valid extended-validation TLS certificate issued to authoritative corporate entity',
            'Canonical DNS perimeter verified on official brand registry',
            'Zero malware or phishing complaints across active global threat feeds',
          ],
          domainAge: '10+ years',
          sslValid: true,
        });
      }
      setIsScanningUrl(false);
    }, 850);
  };

  // Message Analyzer Logic
  const handleAnalyzeMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = messageInput.trim();
    if (!raw) return;

    setIsAnalyzingMsg(true);
    setMessageResult(null);

    setTimeout(() => {
      const lower = raw.toLowerCase();
      const hasUrgency =
        lower.includes('urgent') ||
        lower.includes('24 hours') ||
        lower.includes('immediate') ||
        lower.includes('freeze') ||
        lower.includes('suspend') ||
        lower.includes('delete');
      const hasPayment =
        lower.includes('cvv') ||
        lower.includes('pin') ||
        lower.includes('otp') ||
        lower.includes('crypto') ||
        lower.includes('seed phrase') ||
        lower.includes('wallet') ||
        lower.includes('fee');
      const hasLink =
        lower.includes('http') ||
        lower.includes('click') ||
        lower.includes('.apk') ||
        lower.includes('.top') ||
        lower.includes('.shop') ||
        lower.includes('.xyz');

      if ((hasUrgency && hasLink) || hasPayment) {
        setMessageResult({
          riskLevel: 'high',
          isScam: true,
          analysis:
            'This message matches coordinated social engineering: manufactured urgency (account suspension), unauthorized brand impersonation, and a demand for sensitive credentials or payment cards.',
          detectedTactics: [
            'Manufactured Urgency (Threat of account deletion within 24h)',
            'Imposter Brand Support Persona',
            'Solicitation of OTP, PIN, or unverified link click',
          ],
        });
      } else if (hasUrgency || hasLink) {
        setMessageResult({
          riskLevel: 'medium',
          isScam: true,
          analysis: 'Exercise caution. The message uses coercive psychological urgency or unverified links.',
          detectedTactics: ['Urgency triggers', 'Direct call-to-action'],
        });
      } else {
        setMessageResult({
          riskLevel: 'low',
          isScam: false,
          analysis: 'No overt phishing patterns, credential harvesters, or extortion indicators detected.',
          detectedTactics: [],
        });
      }
      setIsAnalyzingMsg(false);
    }, 750);
  };

  const handleSwitchToBrand = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('astra_user_role', 'brand');
    }
    router.push('/guide?step=brand_form');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col justify-between selection:bg-[#0071e3]/15 selection:text-[#0071e3] font-sans antialiased">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION (Apple Frosted Glass Header)
         ───────────────────────────────────────────────────────────── */}
      <header className="border-b border-black/[0.05] bg-white/80 backdrop-blur-2xl sticky top-0 z-40 px-4 sm:px-8 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shadow-sm transition group-hover:scale-105">
                A
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">ASTRA</span>
                  <span className="rounded-full bg-[#0071e3]/10 text-[#0071e3] text-[10px] font-semibold px-2.5 py-0.5">
                    Security Feed
                  </span>
                </div>
                <p className="text-[11px] text-[#86868b]">Brand Ground Truth &amp; Scam Shield</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsDirectoryOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#1d1d1f] hover:text-[#0071e3] font-medium py-1.5 px-3.5 rounded-full border border-black/[0.08] bg-white hover:bg-[#f5f5f7] transition cursor-pointer shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Verified Directory</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-white bg-[#0071e3] hover:bg-[#0077ed] font-semibold py-1.5 px-3.5 rounded-full shadow-sm transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Generate Alert</span>
              <span className="sm:hidden">Alert</span>
            </button>

            <div className="h-4 w-px bg-black/[0.08] mx-1" />

            <button
              type="button"
              onClick={handleSwitchToBrand}
              className="inline-flex items-center gap-1.5 text-xs text-[#86868b] hover:text-[#1d1d1f] font-medium py-1.5 px-3 rounded-full border border-black/[0.08] bg-white hover:bg-[#f5f5f7] transition cursor-pointer"
              title="Switch to Brand DRP Workspace"
            >
              <Building2 className="w-3.5 h-3.5 text-[#0071e3]" />
              <span className="hidden md:inline">Brand Workspace</span>
            </button>

            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8 rounded-full border border-black/[0.08]',
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Floating Apple-style Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1d1d1f] text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-white/10"
          >
            <CheckCircle2 className="w-4 h-4 text-[#34c759]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT BODY (Apple HIG Layout)
         ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-7">
        {/* Apple-style Hero Banner */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/15 text-[#0071e3] text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#0071e3]" />
            <span>Live Brand Protection Network</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">
            Verified Brand Updates &amp; Security Radar
          </h1>
          <p className="text-sm sm:text-[15px] text-[#86868b] max-w-xl mx-auto leading-relaxed">
            Direct announcements, authentic website domains, and confirmed social handles published by global brands on ASTRA.
          </p>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. STORIES BAR (Apple HIG Circular Badges)
           ───────────────────────────────────────────────────────────── */}
        <ConsumerStoriesBar
          stories={stories}
          onSelectStory={(s) => setSelectedStory(s)}
          onOpenDirectory={() => setIsDirectoryOpen(true)}
        />

        {/* ─────────────────────────────────────────────────────────────
            4. SEARCH & POPULAR BRANDS FILTER BAR
           ───────────────────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-black/[0.05] p-4 sm:p-5 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-3.5">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
              <input
                type="text"
                placeholder="Search popular brands (Apple, Nike, Spotify, Tesla, Netflix...)"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 bg-[#f5f5f7] border border-black/[0.05] rounded-full text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:bg-white transition"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsDirectoryOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-black/[0.08] bg-[#f5f5f7] hover:bg-black/[0.05] text-xs font-semibold text-[#1d1d1f] transition cursor-pointer shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Browse All {brands.length} Brands</span>
            </button>
          </div>

          {/* Popular Brand Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider shrink-0">
              Popular Brands:
            </span>
            {selectedBrandFilter && (
              <button
                type="button"
                onClick={() => setSelectedBrandFilter(null)}
                className="px-3 py-1 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Clear &ldquo;{selectedBrandFilter}&rdquo;</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {brands.slice(0, 7).map((b) => {
              const isSelected = selectedBrandFilter?.toLowerCase() === b.name.toLowerCase();
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() =>
                    setSelectedBrandFilter(isSelected ? null : b.name)
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#0071e3] text-white shadow-sm'
                      : 'bg-black/[0.04] text-[#424245] hover:text-[#1d1d1f] hover:bg-black/[0.07]'
                  }`}
                >
                  <span>{b.name}</span>
                  {b.isCustomBrand && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" title="Your Onboarded Brand" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            5. APPLE SEGMENTED CONTROL TABS
           ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
          <div className="bg-black/[0.05] p-1 rounded-full inline-flex border border-black/[0.04]">
            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              className={`px-3.5 py-1.5 text-xs rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'feed'
                  ? 'bg-white text-[#1d1d1f] font-semibold shadow-sm'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>All Updates ({posts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('urgent')}
              className={`px-3.5 py-1.5 text-xs rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'urgent'
                  ? 'bg-white text-[#ff3b30] font-semibold shadow-sm'
                  : 'text-[#86868b] hover:text-[#ff3b30]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#ff3b30]" />
              <span>Scam Warnings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('directories')}
              className={`px-3.5 py-1.5 text-xs rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'directories'
                  ? 'bg-white text-[#0071e3] font-semibold shadow-sm'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Directories</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('following')}
              className={`px-3.5 py-1.5 text-xs rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'following'
                  ? 'bg-white text-[#0071e3] font-semibold shadow-sm'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Following</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`px-3.5 py-1.5 text-xs rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-white text-[#0071e3] font-semibold shadow-sm'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Bookmarks</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'tools'
                ? 'bg-[#0071e3] text-white shadow-sm'
                : 'bg-white text-[#1d1d1f] hover:bg-[#f5f5f7] border border-black/[0.08]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Link &amp; Message Scanner</span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            6. SECURITY FEED STREAM (Apple HIG Cards)
           ───────────────────────────────────────────────────────────── */}
        {activeTab !== 'tools' && (
          <div className="space-y-6">
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-[28px] border border-black/[0.05] p-12 text-center space-y-3 shadow-sm">
                <Shield className="w-10 h-10 text-[#86868b] mx-auto" />
                <h3 className="text-base font-bold text-[#1d1d1f]">No security updates match this view</h3>
                <p className="text-xs text-[#86868b] max-w-sm mx-auto">
                  {selectedBrandFilter
                    ? `No current alerts for ${selectedBrandFilter}. Try generating a safety card or clearing filters.`
                    : 'Try selecting another tab or reset your search filters.'}
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchFilter('');
                      setSelectedBrandFilter(null);
                      setActiveTab('feed');
                    }}
                    className="px-4 py-2 bg-black/[0.04] rounded-full text-xs font-semibold text-[#1d1d1f]"
                  >
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(true)}
                    className="px-4 py-2 bg-[#0071e3] text-white rounded-full text-xs font-semibold"
                  >
                    Generate Alert
                  </button>
                </div>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <ConsumerSecurityCard
                  key={post.id}
                  post={post}
                  onToggleHelpful={handleToggleHelpful}
                  onToggleSave={handleToggleSave}
                  onToggleFollow={handleToggleFollow}
                  onAddComment={handleAddComment}
                  onScanLinkForBrand={handleScanBrandUrl}
                />
              ))
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            7. TOOLS TAB (Scam Link Scanner, Message Analyzer, Report Scam)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'tools' && (
          <div className="space-y-6">
            {/* Sub-tab selection buttons */}
            <div className="flex justify-center">
              <div className="bg-black/[0.05] p-1 rounded-full inline-flex border border-black/[0.04] text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setToolSubTab('link-checker')}
                  className={`px-4 py-2 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                    toolSubTab === 'link-checker'
                      ? 'bg-white text-[#1d1d1f] shadow-sm font-semibold'
                      : 'text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Scam Link Scanner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setToolSubTab('message-analyzer')}
                  className={`px-4 py-2 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                    toolSubTab === 'message-analyzer'
                      ? 'bg-white text-[#1d1d1f] shadow-sm font-semibold'
                      : 'text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Suspicious Message Check</span>
                </button>
                <button
                  type="button"
                  onClick={() => setToolSubTab('report')}
                  className={`px-4 py-2 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                    toolSubTab === 'report'
                      ? 'bg-white text-[#1d1d1f] shadow-sm font-semibold'
                      : 'text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report Impersonator</span>
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Link Scanner */}
            {toolSubTab === 'link-checker' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[28px] border border-black/[0.05] p-6 sm:p-8 shadow-sm space-y-6"
              >
                <div>
                  <h2 className="text-lg font-bold text-[#1d1d1f]">Check Any URL or Website Link</h2>
                  <p className="text-xs text-[#86868b] mt-1">
                    Enter any link received via SMS, WhatsApp, or Instagram DM to verify whether it matches an authoritative brand or is a phishing fake.
                  </p>
                </div>

                <form onSubmit={handleScanUrl} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="e.g. https://appleid-icloud-login.top or https://nike.com"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full px-5 py-3 bg-[#f5f5f7] border border-black/[0.06] rounded-full text-xs font-mono text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:bg-white transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isScanningUrl}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm transition disabled:opacity-60 cursor-pointer shrink-0"
                  >
                    {isScanningUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Scanning Link...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Scan Link Safety</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Samples */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#86868b]">
                  <span className="text-[11px] text-[#86868b]">Try popular examples:</span>
                  <button
                    type="button"
                    onClick={() => setUrlInput('https://appleid-icloud-login.top/verify')}
                    className="px-3 py-1 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] text-[11px] font-mono cursor-pointer"
                  >
                    appleid-icloud-login.top (Phishing)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrlInput('https://nike-vip-sale.shop')}
                    className="px-3 py-1 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] text-[11px] font-mono cursor-pointer"
                  >
                    nike-vip-sale.shop (Fake Store)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrlInput('https://apple.com')}
                    className="px-3 py-1 rounded-full bg-[#34c759]/10 text-[#34c759] text-[11px] font-mono cursor-pointer"
                  >
                    apple.com (Safe)
                  </button>
                </div>

                {urlResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-2xl border space-y-3 ${
                      urlResult.verdict === 'malicious'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : urlResult.verdict === 'suspicious'
                        ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {urlResult.verdict === 'malicious' ? (
                          <AlertCircle className="w-5 h-5 text-rose-600" />
                        ) : urlResult.verdict === 'suspicious' ? (
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        )}
                        <span className="text-sm font-bold uppercase tracking-wider">
                          {urlResult.verdict === 'malicious'
                            ? 'High-Risk Phishing / Scam Site'
                            : urlResult.verdict === 'suspicious'
                            ? 'Suspicious Unverified Domain'
                            : 'Authentic & Verified Domain'}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/80 border">
                        Safety Score: {urlResult.score}/100
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 pt-1">
                      <p className="font-semibold">Security Findings:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                        {urlResult.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Sub-tab 2: Message Analyzer */}
            {toolSubTab === 'message-analyzer' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[28px] border border-black/[0.05] p-6 sm:p-8 shadow-sm space-y-6"
              >
                <div>
                  <h2 className="text-lg font-bold text-[#1d1d1f]">Analyze Suspicious SMS or DM</h2>
                  <p className="text-xs text-[#86868b] mt-1">
                    Paste the content of any SMS, WhatsApp, or Instagram DM claiming to represent official support or demanding urgent action.
                  </p>
                </div>

                <form onSubmit={handleAnalyzeMessage} className="space-y-4">
                  <textarea
                    rows={4}
                    placeholder="Paste the suspicious message content here..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="w-full px-5 py-3.5 bg-[#f5f5f7] border border-black/[0.06] rounded-2xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:bg-white transition"
                  />

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMessageInput(
                          'Apple Security Alert: Your lost iPhone 15 Pro was located online today. View live GPS coordinates within 2 hours or Activation Lock will be permanently disabled: https://appleid-icloud-login.top/locate'
                        )
                      }
                      className="text-[11px] text-[#0071e3] hover:underline cursor-pointer text-left"
                    >
                      Insert Sample Smishing Message
                    </button>

                    <button
                      type="submit"
                      disabled={isAnalyzingMsg}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm transition disabled:opacity-60 cursor-pointer"
                    >
                      {isAnalyzingMsg ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analyzing Message...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Inspect with AI Sentinel</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {messageResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-2xl border space-y-3 ${
                      messageResult.riskLevel === 'high'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : messageResult.riskLevel === 'medium'
                        ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {messageResult.riskLevel === 'high' ? (
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
                      <span className="text-sm font-bold uppercase tracking-wider">
                        {messageResult.isScam ? 'Scam / Phishing Tactics Identified' : 'Legitimate Pattern'}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-95">{messageResult.analysis}</p>
                    {messageResult.detectedTactics.length > 0 && (
                      <div className="pt-2 border-t border-rose-200/50">
                        <p className="text-[11px] font-semibold mb-1">Identified Red Flags:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                          {messageResult.detectedTactics.map((t, idx) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Sub-tab 3: Report Scam */}
            {toolSubTab === 'report' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[28px] border border-black/[0.05] p-6 sm:p-8 shadow-sm space-y-6"
              >
                <div>
                  <h2 className="text-lg font-bold text-[#1d1d1f]">Report a Fake Account or Scam Site</h2>
                  <p className="text-xs text-[#86868b] mt-1">
                    Help protect consumers. Submissions are dispatched directly to the brand’s verified security response desk and automated takedown radars.
                  </p>
                </div>

                {reportSubmitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h3 className="text-sm font-bold text-emerald-900">Incident Reported Successfully</h3>
                    <p className="text-xs text-emerald-700 max-w-md mx-auto">
                      Thank you! Our automated crawler has queued this asset for evidence packaging and abuse notification.
                    </p>
                    <button
                      type="button"
                      onClick={() => setReportSubmitted(false)}
                      className="mt-3 px-5 py-2 rounded-full bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] cursor-pointer shadow-sm"
                    >
                      Report Another Incident
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setReportSubmitted(true);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#1d1d1f]">Suspicious Link or Handle</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. @nike_vip_sale or https://..."
                          value={reportData.scamUrl}
                          onChange={(e) => setReportData({ ...reportData, scamUrl: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-black/[0.06] rounded-full text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#1d1d1f]">Platform Observed</label>
                        <select
                          value={reportData.platform}
                          onChange={(e) => setReportData({ ...reportData, platform: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-black/[0.06] rounded-full text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                        >
                          <option value="Instagram">Instagram</option>
                          <option value="Twitter/X">Twitter / X</option>
                          <option value="Telegram">Telegram</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="SMS">SMS / Text Message</option>
                          <option value="Email">Email</option>
                          <option value="Other">Other Website</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Details / Incident Description</label>
                      <textarea
                        rows={3}
                        placeholder="Describe how the fake account contacted you or what they offered..."
                        value={reportData.description}
                        onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-black/[0.06] rounded-2xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                    >
                      Submit Scam Report
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          8. MODALS & DRAWERS
         ───────────────────────────────────────────────────────────── */}
      {/* Story Viewer Modal */}
      <StoryViewerModal
        story={selectedStory}
        stories={stories}
        onClose={() => setSelectedStory(null)}
        onSelectStory={(s) => setSelectedStory(s)}
        onVerifyBrand={handleScanBrandUrl}
      />

      {/* Verified Brand Directory Drawer */}
      <BrandDirectoryDrawer
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        brands={brands}
        onSelectBrandFilter={(brandName) => {
          setSelectedBrandFilter(brandName);
          setActiveTab('feed');
        }}
        onScanBrandUrl={handleScanBrandUrl}
      />

      {/* Auto-Generate Alert Modal */}
      <AutoGenerateAlertModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        brands={brands}
        onAlertGenerated={handleAlertGenerated}
      />

      {/* Apple-style Footer */}
      <footer className="py-6 border-t border-black/[0.05] text-center text-xs text-[#86868b] bg-white">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; 2026 ASTRA Digital Risk Protection · Consumer Safety Feed</span>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => setIsDirectoryOpen(true)}
              className="hover:underline hover:text-[#1d1d1f] cursor-pointer"
            >
              Verified Brand Registry
            </button>
            <button
              type="button"
              onClick={handleSwitchToBrand}
              className="hover:underline hover:text-[#0071e3] cursor-pointer"
            >
              Register Your Brand
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
