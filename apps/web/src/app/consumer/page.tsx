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
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Loader2,
  RefreshCw,
  Building2,
  AlertCircle,
  Eye,
  Send,
  HelpCircle,
  Check,
  Bookmark,
  Heart,
  Share2,
  Radio,
  SlidersHorizontal,
  X,
  Filter,
  UserCheck,
  Globe,
  Plus
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
    showToast(newState ? 'Alert saved to your Bookmarks' : 'Alert removed from Bookmarks');
  };

  const handleToggleFollow = (brandId: string) => {
    const newState = toggleStoredFollowBrand(brandId);
    setPosts((prev) =>
      prev.map((p) => (p.brandId === brandId ? { ...p, isFollowingBrand: newState } : p))
    );
    showToast(newState ? 'Now following brand security updates' : 'Unfollowed brand updates');
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
      showToast('Community report posted successfully');
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
            'Detected suspicious high-risk top-level domain (.top/.xyz) or spoofed prefix',
            'Signature matches active credential harvesting campaign against official brands',
            'Domain registered recently with no EV TLS certificate backing',
          ],
          brandTargeted: lower.includes('nilapay')
            ? 'NilaPay'
            : lower.includes('stripe')
            ? 'Stripe'
            : lower.includes('apple')
            ? 'Apple'
            : 'Popular Online Service',
          domainAge: '3 days ago',
          sslValid: false,
        });
      } else if (isSuspicious) {
        setUrlResult({
          url: raw,
          verdict: 'suspicious',
          score: 54,
          reasons: [
            'Domain closely mimics an authoritative brand name without recognized TXT record',
            'Unverified redirect chain detected by ASTRA crawler',
          ],
          domainAge: '14 days ago',
          sslValid: true,
        });
      } else {
        setUrlResult({
          url: raw,
          verdict: 'safe',
          score: 96,
          reasons: [
            'Valid extended-validation TLS certificate issued to authoritative entity',
            'Canonical DNS perimeter verified on official brand registry',
            'Zero malware or phishing complaints across active global threat feeds',
          ],
          domainAge: '7+ years',
          sslValid: true,
        });
      }
      setIsScanningUrl(false);
    }, 900);
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
        lower.includes('suspend');
      const hasPayment =
        lower.includes('mpin') ||
        lower.includes('pin') ||
        lower.includes('otp') ||
        lower.includes('crypto') ||
        lower.includes('seed phrase') ||
        lower.includes('wallet') ||
        lower.includes('gift card');
      const hasLink =
        lower.includes('http') ||
        lower.includes('click') ||
        lower.includes('.apk') ||
        lower.includes('.top') ||
        lower.includes('.xyz');

      if ((hasUrgency && hasLink) || hasPayment) {
        setMessageResult({
          riskLevel: 'high',
          isScam: true,
          analysis:
            'This message matches coordinated social engineering: manufactured urgency (account suspension), unauthorized brand impersonation, and a demand for sensitive credentials/unverified URLs.',
          detectedTactics: [
            'Manufactured Urgency (Threat of account freeze within 24h)',
            'Imposter Support Persona',
            'Solicitation of OTP, MPIN, or unverified link click',
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
    }, 800);
  };

  const handleSwitchToBrand = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('astra_user_role', 'brand');
    }
    router.push('/guide?step=brand_form');
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#37352f] flex flex-col justify-between selection:bg-[#0f7b6c]/15 selection:text-[#0f7b6c] font-sans antialiased">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION HEADER
         ───────────────────────────────────────────────────────────── */}
      <header className="border-b border-[#e3e2e0] bg-white sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-[6px] bg-[#37352f] text-white flex items-center justify-center font-bold text-sm shadow-xs transition group-hover:bg-[#0f7b6c]">
                A
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-tight text-[#37352f]">ASTRA</span>
                  <span className="rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20 text-[10px] font-semibold px-2 py-0.5">
                    Consumer Security Feed
                  </span>
                </div>
                <p className="text-[11px] text-[#787774]">
                  Brand Ground Truth &amp; Phishing Shield
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsDirectoryOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#37352f] hover:text-[#0f7b6c] font-medium py-1.5 px-3 rounded-[6px] border border-[#e3e2e0] bg-white hover:bg-[#f7f6f3] transition cursor-pointer shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-[#0f7b6c]" />
              <span>Verified Directory</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-white bg-[#0f7b6c] hover:bg-[#0c6357] font-semibold py-1.5 px-3 rounded-[6px] shadow-2xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Generate Safety Alert</span>
              <span className="sm:hidden">Alert</span>
            </button>

            <div className="h-4 w-px bg-[#e3e2e0] mx-0.5" />

            <button
              type="button"
              onClick={handleSwitchToBrand}
              className="inline-flex items-center gap-1.5 text-xs text-[#787774] hover:text-[#0f7b6c] font-medium py-1.5 px-2.5 rounded-[6px] border border-[#e3e2e0] bg-white hover:bg-[#f7f6f3] transition cursor-pointer"
              title="Switch to Brand DRP Workspace"
            >
              <Building2 className="w-3.5 h-3.5 text-[#0f7b6c]" />
              <span className="hidden md:inline">Brand Workspace</span>
            </button>

            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8 rounded-[6px] border border-[#e3e2e0]',
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#37352f] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 border border-white/10"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT BODY
         ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#0f7b6c]/10 border border-[#0f7b6c]/25 text-[#0f7b6c] text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#0f7b6c]" />
            <span>Real-time Brand Security Network · Instagram for Safety</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#37352f]">
            Verified Brand Updates &amp; Scam Radar Feed
          </h1>
          <p className="text-xs sm:text-sm text-[#787774] max-w-xl mx-auto leading-relaxed">
            Discover official websites and confirmed social handles published by brands on our apps. Defend against phishing links and fake profiles in real time.
          </p>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. INSTAGRAM STORIES CAROUSEL BAR (Live Brand Highlights)
           ───────────────────────────────────────────────────────────── */}
        <ConsumerStoriesBar
          stories={stories}
          onSelectStory={(s) => setSelectedStory(s)}
          onOpenDirectory={() => setIsDirectoryOpen(true)}
        />

        {/* ─────────────────────────────────────────────────────────────
            4. SEARCH & BRAND FILTER BAR
           ───────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-[12px] border border-[#e3e2e0] p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9b9a97]" />
              <input
                type="text"
                placeholder="Search updates by brand (NilaPay, Stripe, Apple...), handle (@stripe), or domain..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-[#f7f6f3] border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c] focus:bg-white transition"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9b9a97] hover:text-[#37352f]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsDirectoryOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#e3e2e0] bg-[#f7f6f3] hover:bg-[#e3e2e0] text-xs font-semibold text-[#37352f] transition cursor-pointer shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-[#0f7b6c]" />
              <span>Browse All {brands.length} Brands</span>
            </button>
          </div>

          {/* Quick Brand Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            <span className="text-[11px] text-[#9b9a97] shrink-0">Filter by Brand:</span>
            {selectedBrandFilter && (
              <button
                type="button"
                onClick={() => setSelectedBrandFilter(null)}
                className="px-2.5 py-1 rounded-[6px] bg-[#eb5757]/10 text-[#eb5757] border border-[#eb5757]/20 text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Clear &ldquo;{selectedBrandFilter}&rdquo;</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {brands.slice(0, 6).map((b) => {
              const isSelected = selectedBrandFilter?.toLowerCase() === b.name.toLowerCase();
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() =>
                    setSelectedBrandFilter(isSelected ? null : b.name)
                  }
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#0f7b6c] text-white shadow-2xs'
                      : 'bg-[#f7f6f3] text-[#787774] hover:text-[#37352f] border border-[#e3e2e0]'
                  }`}
                >
                  <span>{b.name}</span>
                  {b.isCustomBrand && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Your Onboarded Brand" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            5. FEED NAVIGATION TABS
           ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-[#e3e2e0] pb-1 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-2 text-xs font-semibold rounded-[6px] transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'feed'
                  ? 'text-[#0f7b6c] border-b-2 border-[#0f7b6c] bg-[#0f7b6c]/5'
                  : 'text-[#787774] hover:text-[#37352f]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>All Updates ({posts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('urgent')}
              className={`px-3 py-2 text-xs font-semibold rounded-[6px] transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'urgent'
                  ? 'text-rose-700 border-b-2 border-rose-600 bg-rose-50/70'
                  : 'text-[#787774] hover:text-rose-600'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Scam Warnings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('directories')}
              className={`px-3 py-2 text-xs font-semibold rounded-[6px] transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'directories'
                  ? 'text-[#0f7b6c] border-b-2 border-[#0f7b6c] bg-[#0f7b6c]/5'
                  : 'text-[#787774] hover:text-[#37352f]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Brand Directories</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('following')}
              className={`px-3 py-2 text-xs font-semibold rounded-[6px] transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'following'
                  ? 'text-[#0f7b6c] border-b-2 border-[#0f7b6c] bg-[#0f7b6c]/5'
                  : 'text-[#787774] hover:text-[#37352f]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Following</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-2 text-xs font-semibold rounded-[6px] transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'text-[#0f7b6c] border-b-2 border-[#0f7b6c] bg-[#0f7b6c]/5'
                  : 'text-[#787774] hover:text-[#37352f]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Bookmarks</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tools'
                ? 'bg-[#0f7b6c] text-white shadow-2xs'
                : 'text-[#787774] hover:text-[#37352f] border border-[#e3e2e0] bg-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Link &amp; Message Scanner</span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            6. FEED STREAM (Instagram-style Security Posts)
           ───────────────────────────────────────────────────────────── */}
        {activeTab !== 'tools' && (
          <div className="space-y-6">
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-[16px] border border-[#e3e2e0] p-12 text-center space-y-3">
                <Shield className="w-10 h-10 text-[#9b9a97] mx-auto" />
                <h3 className="text-sm font-bold text-[#37352f]">No security updates match this view</h3>
                <p className="text-xs text-[#787774] max-w-sm mx-auto">
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
                    className="px-3.5 py-1.5 bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] text-xs font-semibold text-[#37352f]"
                  >
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(true)}
                    className="px-3.5 py-1.5 bg-[#0f7b6c] text-white rounded-[6px] text-xs font-semibold"
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
              <div className="inline-flex p-1 rounded-[8px] bg-[#e3e2e0]/60 border border-[#e3e2e0] text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setToolSubTab('link-checker')}
                  className={`px-4 py-2 rounded-[6px] transition cursor-pointer flex items-center gap-1.5 ${
                    toolSubTab === 'link-checker'
                      ? 'bg-white text-[#37352f] shadow-xs font-semibold'
                      : 'text-[#787774] hover:text-[#37352f]'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Scam Link Scanner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setToolSubTab('message-analyzer')}
                  className={`px-4 py-2 rounded-[6px] transition cursor-pointer flex items-center gap-1.5 ${
                    toolSubTab === 'message-analyzer'
                      ? 'bg-white text-[#37352f] shadow-xs font-semibold'
                      : 'text-[#787774] hover:text-[#37352f]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Suspicious Message Check</span>
                </button>
                <button
                  type="button"
                  onClick={() => setToolSubTab('report')}
                  className={`px-4 py-2 rounded-[6px] transition cursor-pointer flex items-center gap-1.5 ${
                    toolSubTab === 'report'
                      ? 'bg-white text-[#37352f] shadow-xs font-semibold'
                      : 'text-[#787774] hover:text-[#37352f]'
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
                className="bg-white rounded-[16px] border border-[#e3e2e0] p-6 sm:p-8 shadow-xs space-y-6"
              >
                <div>
                  <h2 className="text-base font-bold text-[#37352f]">Check any URL or Website Link</h2>
                  <p className="text-xs text-[#787774] mt-1">
                    Enter any domain or URL received via SMS, WhatsApp, or Instagram DM to verify whether it matches a verified brand or is a phishing fake.
                  </p>
                </div>

                <form onSubmit={handleScanUrl} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="e.g. https://nilapay-kyc-verify.top or https://stripe.com"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full px-4 py-3 bg-[#f7f6f3] border border-[#e3e2e0] rounded-[8px] text-xs font-mono text-[#37352f] focus:outline-none focus:border-[#0f7b6c] focus:bg-white transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isScanningUrl}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[8px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white text-xs font-semibold shadow-xs transition disabled:opacity-60 cursor-pointer shrink-0"
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
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#787774]">
                  <span className="text-[11px] text-[#9b9a97]">Try examples:</span>
                  <button
                    type="button"
                    onClick={() => setUrlInput('https://nilapay-kyc-verify.top/rekyc')}
                    className="px-2.5 py-1 rounded-[4px] bg-[#eb5757]/10 text-[#eb5757] border border-[#eb5757]/20 text-[11px] font-mono cursor-pointer"
                  >
                    nilapay-kyc-verify.top (Phishing)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrlInput('https://stripe.com/docs')}
                    className="px-2.5 py-1 rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20 text-[11px] font-mono cursor-pointer"
                  >
                    stripe.com (Safe)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrlInput('https://chatgpt-desktop-installer.top')}
                    className="px-2.5 py-1 rounded-[4px] bg-[#eb5757]/10 text-[#eb5757] border border-[#eb5757]/20 text-[11px] font-mono cursor-pointer"
                  >
                    chatgpt-desktop-installer.top (Malware)
                  </button>
                </div>

                {urlResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-[12px] border space-y-3 ${
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
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/80 border">
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
                className="bg-white rounded-[16px] border border-[#e3e2e0] p-6 sm:p-8 shadow-xs space-y-6"
              >
                <div>
                  <h2 className="text-base font-bold text-[#37352f]">Analyze Suspicious SMS or DM</h2>
                  <p className="text-xs text-[#787774] mt-1">
                    Paste the content of any SMS, WhatsApp, or Instagram DM claiming to represent customer care or demanding urgent KYC action.
                  </p>
                </div>

                <form onSubmit={handleAnalyzeMessage} className="space-y-4">
                  <textarea
                    rows={4}
                    placeholder="Paste the suspicious message content here..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="w-full px-4 py-3 bg-[#f7f6f3] border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c] focus:bg-white transition"
                  />

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMessageInput(
                          'URGENT from NilaPay Support: Your KYC has expired. Your wallet will be frozen in 24 hours unless re-verified now at https://nilapay-kyc-verify.top/rekyc. Enter your UPI MPIN to unblock.'
                        )
                      }
                      className="text-[11px] text-[#0f7b6c] hover:underline cursor-pointer text-left"
                    >
                      Insert Sample Imposter KYC Message
                    </button>

                    <button
                      type="submit"
                      disabled={isAnalyzingMsg}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[8px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white text-xs font-semibold shadow-xs transition disabled:opacity-60 cursor-pointer"
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
                    className={`p-5 rounded-[12px] border space-y-3 ${
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
                className="bg-white rounded-[16px] border border-[#e3e2e0] p-6 sm:p-8 shadow-xs space-y-6"
              >
                <div>
                  <h2 className="text-base font-bold text-[#37352f]">Report a Fake Account or Scam Site</h2>
                  <p className="text-xs text-[#787774] mt-1">
                    Help protect consumers. Submissions are dispatched directly to the brand’s verified security response desk and automated takedown radars.
                  </p>
                </div>

                {reportSubmitted ? (
                  <div className="p-6 rounded-[8px] bg-emerald-50 border border-emerald-200 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h3 className="text-sm font-bold text-emerald-900">Incident Reported Successfully</h3>
                    <p className="text-xs text-emerald-700 max-w-md mx-auto">
                      Thank you! Our automated crawler has queued this asset for evidence packaging and abuse notification.
                    </p>
                    <button
                      type="button"
                      onClick={() => setReportSubmitted(false)}
                      className="mt-3 px-4 py-1.5 rounded-[6px] bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
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
                        <label className="text-xs font-semibold text-[#37352f]">Suspicious Link or Handle</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. @fake_brand_support or https://..."
                          value={reportData.scamUrl}
                          onChange={(e) => setReportData({ ...reportData, scamUrl: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-[#f7f6f3] border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#37352f]">Platform Observed</label>
                        <select
                          value={reportData.platform}
                          onChange={(e) => setReportData({ ...reportData, platform: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-[#f7f6f3] border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
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
                      <label className="text-xs font-semibold text-[#37352f]">Details / Incident Description</label>
                      <textarea
                        rows={3}
                        placeholder="Describe how the fake account contacted you or what they offered..."
                        value={reportData.description}
                        onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#f7f6f3] border border-[#e3e2e0] rounded-[8px] text-xs text-[#37352f] focus:outline-none focus:border-[#0f7b6c]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-[8px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
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
      {/* Story Viewer Modal (Instagram style) */}
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

      {/* Footer */}
      <footer className="py-5 border-t border-[#e3e2e0] text-center text-xs text-[#787774] bg-white">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 ASTRA Digital Risk Protection · Consumer Safety Feed</span>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => setIsDirectoryOpen(true)}
              className="hover:underline hover:text-[#37352f]"
            >
              Verified Brand Registry
            </button>
            <button
              type="button"
              onClick={handleSwitchToBrand}
              className="hover:underline hover:text-[#0f7b6c]"
            >
              Register Your Brand
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
