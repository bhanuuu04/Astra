'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  UserCheck, 
  UserX, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  Sparkles, 
  Eye, 
  Zap, 
  MessageSquare,
  BadgeAlert,
  ChevronRight,
  Filter,
  X,
  Send,
  Loader2
} from 'lucide-react';

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function TwitterIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function TelegramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" x2="11" y1="2" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function YoutubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
      <polygon points="10 15 15 12 10 9 10 15"/>
    </svg>
  );
}

function LinkedinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect width="4" height="12" x="2" y="9"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}
import { analyzeSocialMessage } from '@/lib/threat-engine';
import { 
  SocialMessage, 
  SocialPlatform, 
  BrandAssetRegistry, 
  SenderProfile, 
  ThreatAnalysis 
} from '@/types/threat';

import { listBrands, type Brand, type BrandAsset } from '@/lib/api';

export function InboundMessageSafetyFeed() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<SocialMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'safe' | 'threats' | 'collab'>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Analyze new DM modal state
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [analyzingPlatform, setAnalyzingPlatform] = useState<SocialPlatform>('instagram');
  const [analyzingHandle, setAnalyzingHandle] = useState('');
  const [analyzingDisplayName, setAnalyzingDisplayName] = useState('');
  const [analyzingFakeBadge, setAnalyzingFakeBadge] = useState(true);
  const [analyzingFollowers, setAnalyzingFollowers] = useState(14);
  const [analyzingContent, setAnalyzingContent] = useState('');
  const [isSubmittingAnalysis, setIsSubmittingAnalysis] = useState(false);
  const [analysisBanner, setAnalysisBanner] = useState<string | null>(null);

  // Fetch active brands from Supabase
  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: () => listBrands()
  });

  const activeBrand = brands[0] || null;

  // Construct dynamic brand registry
  const currentBrandRegistry: BrandAssetRegistry = useMemo(() => {
    let fallbackName = 'DOCK';
    let fallbackDomain = 'dockcloud.in';

    if (mounted && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('astra_current_brand_dna');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.name) fallbackName = parsed.name;
          if (parsed.domain) fallbackDomain = parsed.domain;
        }
      } catch {}
    }

    const bName = activeBrand?.name || fallbackName;
    const domains = activeBrand?.assets?.filter(a => a.asset_type === 'domain').map(a => a.canonical_value) || [fallbackDomain];
    const handles = activeBrand?.assets?.filter(a => a.asset_type === 'social_handle').map(a => ({
      platform: (a.metadata?.platform || 'instagram') as SocialPlatform,
      handle: a.canonical_value,
      verified: true
    })) || [];

    return {
      id: activeBrand?.id || 'brand-active',
      brandName: bName,
      legalEntity: `${bName} Technologies`,
      officialDomains: domains.length ? domains : [fallbackDomain],
      officialHandles: handles,
      officialMobileApps: [],
      protectedExecutives: [],
      contactEmail: `security@${domains[0] || 'brand.com'}`
    };
  }, [activeBrand]);

  // Fetch real inbound sightings from the database
  const { data: inboundData } = useQuery({
    queryKey: ['inbound-messages'],
    queryFn: async () => {
      const res = await fetch('/api/messages/inbound');
      if (!res.ok) return [];
      const json = await res.json();
      return json.sightings || [];
    },
    refetchInterval: 10000
  });

  // Convert database sightings to live analyzed SocialMessage objects
  useEffect(() => {
    if (!inboundData || inboundData.length === 0) {
      setMessages([]);
      setSelectedMessage(null);
      return;
    }

    const brandSlug = currentBrandRegistry.brandName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Strict Zero-Mock: ONLY ingest messages that actually have a real sender username
    const validSightings = inboundData.filter((sighting: any) => {
      const payload = sighting.normalized_payload || {};
      const rawSender = payload.sender;
      return Boolean(rawSender?.username && rawSender.username.trim());
    });

    if (validSightings.length === 0) {
      setMessages([]);
      setSelectedMessage(null);
      return;
    }

    const realMessages: SocialMessage[] = validSightings.map((sighting: any, idx: number) => {
      const payload = sighting.normalized_payload || {};
      const surface = sighting.surface || 'instagram';
      const rawSender = payload.sender;
      const cleanUsername = rawSender.username.replace('@', '').trim();

      const sender: SenderProfile = {
        id: rawSender?.id || `usr-${sighting.id}`,
        platform: (['instagram', 'x_twitter', 'facebook', 'telegram', 'youtube', 'linkedin'].includes(surface) ? surface : 'instagram') as SocialPlatform,
        username: cleanUsername,
        displayName: rawSender?.displayName || rawSender?.name || `@${cleanUsername}`,
        avatarUrl: rawSender?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        bio: rawSender?.bio || `Direct message sender on ${surface}.`,
        followerCount: typeof rawSender?.followerCount === 'number' ? rawSender.followerCount : 0,
        followingCount: typeof rawSender?.followingCount === 'number' ? rawSender.followingCount : 0,
        accountCreatedAt: rawSender?.accountCreatedAt || sighting.created_at || new Date().toISOString(),
        isVerifiedBadge: Boolean(rawSender?.isVerifiedBadge),
        isFakeBadgeEmoji: Boolean(rawSender?.isFakeBadgeEmoji)
      };

      const content = payload.content || sighting.raw_ref || 'Inbound message captured across monitored channels.';

      const socialMsg: SocialMessage = {
        id: sighting.id || `msg-${idx}`,
        platform: (['instagram', 'x_twitter', 'facebook', 'telegram', 'youtube', 'linkedin'].includes(surface) ? surface : 'instagram') as SocialPlatform,
        brandAccountId: `@${brandSlug}_official`,
        sender,
        content,
        timestamp: sighting.observed_at || sighting.created_at || new Date().toISOString(),
        status: 'new',
        analysis: {} as ThreatAnalysis
      };

      socialMsg.analysis = analyzeSocialMessage(content, sender, currentBrandRegistry);
      return socialMsg;
    });

    setMessages(realMessages);
    if (!selectedMessage && realMessages.length > 0) {
      setSelectedMessage(realMessages[0]);
    }
  }, [inboundData, currentBrandRegistry]);


  const handleExecuteAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analyzingHandle.trim() || !analyzingContent.trim()) return;

    setIsSubmittingAnalysis(true);
    setAnalysisBanner(null);

    try {
      const res = await fetch('/api/messages/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: activeBrand?.id,
          brandName: currentBrandRegistry.brandName,
          domain: currentBrandRegistry.officialDomains[0],
          surface: analyzingPlatform,
          content: analyzingContent.trim(),
          sender: {
            username: analyzingHandle.trim().replace(/^@/, ''),
            displayName: analyzingDisplayName.trim() || `${analyzingHandle.trim()} ✓`,
            isVerifiedBadge: false,
            isFakeBadgeEmoji: analyzingFakeBadge,
            followerCount: Number(analyzingFollowers) || 12,
            followingCount: 890,
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        await queryClient.invalidateQueries({ queryKey: ['inbound-messages'] });
        await queryClient.invalidateQueries({ queryKey: ['sightings'] });
        setShowAnalyzeModal(false);
        setAnalyzingContent('');
        setAnalyzingHandle('');
        setAnalysisBanner(`Analysis complete: ${data.analysis.isFakeAccount ? '🚨 Fake account detected' : '✓ Sender verified'} (${data.analysis.riskScore}/100)`);
        setTimeout(() => setAnalysisBanner(null), 6000);
      } else {
        alert(data.error || 'Failed to complete analysis');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      alert(err.message || 'Error executing analysis');
    } finally {
      setIsSubmittingAnalysis(false);
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'safe') return (m.analysis.profileSafety?.isSafe ?? false);
    if (filter === 'threats') return !(m.analysis.profileSafety?.isSafe ?? false);
    if (filter === 'collab') return m.analysis.profileSafety?.intent === 'collaboration_proposal' || m.analysis.profileSafety?.intent === 'sponsorship_inquiry';
    return true;
  });

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'instagram': return <InstagramIcon className="h-4 w-4 text-pink-600" />;
      case 'x_twitter': return <TwitterIcon className="h-4 w-4 text-sky-500" />;
      case 'facebook': return <FacebookIcon className="h-4 w-4 text-blue-600" />;
      case 'telegram': return <TelegramIcon className="h-4 w-4 text-cyan-600" />;
      case 'youtube': return <YoutubeIcon className="h-4 w-4 text-red-600" />;
      case 'linkedin': return <LinkedinIcon className="h-4 w-4 text-indigo-600" />;
      default: return <MessageSquare className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="rounded-[8px] border border-[#e3e2e0] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] relative">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[#e3e2e0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-[#37352f] text-white">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm font-bold text-[#37352f]">
              Inbound Message Radar &amp; Sender Safety Analyzer
            </h2>
            <span className="rounded-full bg-[#f7f6f3] px-2 py-0.5 text-[10px] font-semibold text-[#0f7b6c] border border-[#e3e2e0]">
              Live Stream
            </span>
          </div>
          <p className="mt-1 text-xs text-[#787774] max-w-2xl">
            Monitors incoming direct messages across all connected brand socials (Instagram, X, LinkedIn, etc.). Evaluates sender authenticity, burner account metrics, and collaboration proposals in real-time.
          </p>
        </div>

        {/* Actions Strip */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-[#e3e2e0] bg-[#f7f6f3] px-2.5 py-1 text-xs font-medium text-[#0f7b6c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0f7b6c]" />
            <span>Database Ingestion Active</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAnalyzeModal(true)}
            className="flex items-center gap-1.5 rounded-[6px] bg-[#0f7b6c] hover:bg-[#0b5e52] text-white px-3 py-1.5 text-xs font-medium shadow-2xs transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Analyze New DM</span>
          </button>
        </div>
      </div>

      {analysisBanner && (
        <div className="mt-4 flex items-center justify-between rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] px-3.5 py-2 text-xs font-medium text-[#37352f]">
          <span>{analysisBanner}</span>
          <button onClick={() => setAnalysisBanner(null)} className="text-[#9b9a97] hover:text-[#37352f]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mt-4 flex items-center justify-between border-b border-[#e3e2e0] pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-[6px] px-2.5 py-1 text-xs font-medium transition ${
              filter === 'all'
                ? 'bg-[#37352f] text-white'
                : 'text-[#787774] hover:bg-[#f7f6f3]'
            }`}
          >
            All Inbound ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('safe')}
            className={`rounded-[6px] px-2.5 py-1 text-xs font-medium transition ${
              filter === 'safe'
                ? 'bg-[#0f7b6c] text-white'
                : 'text-[#0f7b6c] hover:bg-[#f7f6f3]'
            }`}
          >
            Verified Safe Profiles
          </button>
          <button
            type="button"
            onClick={() => setFilter('threats')}
            className={`rounded-[6px] px-2.5 py-1 text-xs font-medium transition ${
              filter === 'threats'
                ? 'bg-rose-700 text-white'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Threats &amp; Impersonators
          </button>
          <button
            type="button"
            onClick={() => setFilter('collab')}
            className={`rounded-[6px] px-2.5 py-1 text-xs font-medium transition ${
              filter === 'collab'
                ? 'bg-[#37352f] text-white'
                : 'text-[#787774] hover:bg-[#f7f6f3]'
            }`}
          >
            Collaboration Requests
          </button>
        </div>

        <span className="hidden sm:inline text-[11px] text-[#9b9a97] font-medium">
          Target Brand DNA: <strong className="text-[#37352f] font-semibold">{currentBrandRegistry.brandName}</strong>
        </span>
      </div>

      {/* Content Columns: Inbound Stream + Deep Profile Inspector */}
      {messages.length === 0 ? (
        <div className="mt-5 rounded-[8px] border border-[#e3e2e0] bg-[#faf9f8] p-8 text-center shadow-2xs">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white border border-[#e3e2e0] text-[#0f7b6c] shadow-2xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-[#37352f]">Inbound Message Safety Radar · Perimeter Secure</h3>
          <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-[#787774]">
            Zero unverified DMs or impersonators detected. When collaborators, customers, or external accounts message your brand channels, ASTRA autonomously profiles them for badge spoofing, homoglyphs, and phishing links.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowAnalyzeModal(true)}
              className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#e3e2e0] bg-white px-3 py-1.5 text-xs font-semibold text-[#37352f] shadow-2xs hover:bg-[#f7f6f3] transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#0f7b6c]" />
              <span>Inspect a Specific Inbound Message</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          {/* Left: Message List */}
          <div className="space-y-3 lg:col-span-5 max-h-[580px] overflow-y-auto pr-1">
            {filteredMessages.map((msg) => {

            const isSelected = selectedMessage?.id === msg.id;
            const safety = msg.analysis.profileSafety;
            const isSafe = safety?.isSafe ?? false;
            const score = safety?.safetyScore ?? 50;

            return (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`cursor-pointer rounded-[8px] border p-3.5 transition ${
                  isSelected
                    ? 'border-[#0f7b6c] bg-[#f7f6f3] shadow-2xs'
                    : 'border-[#e3e2e0] bg-white hover:border-[#9b9a97] hover:bg-[#f7f6f3]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={msg.sender.avatarUrl}
                      alt={msg.sender.displayName}
                      className="h-7 w-7 rounded-full border border-[#e3e2e0] object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-bold text-[#37352f]">
                          {msg.sender.displayName}
                        </span>
                        {msg.sender.isVerifiedBadge && (
                          <span className="text-[10px] text-[#0f7b6c] font-bold" title="Authentic Badge">✓</span>
                        )}
                        {msg.sender.isFakeBadgeEmoji && (
                          <span className="text-[9px] rounded bg-rose-100 text-rose-700 px-1 font-bold" title="Fake Unicode Badge">
                            Fake Badge
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#9b9a97]">
                        <span>@{msg.sender.username}</span>
                        <span>·</span>
                        <span className="capitalize">{msg.platform.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Safety Pill */}
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                        isSafe
                          ? 'border-[#e3e2e0] bg-white text-[#0f7b6c]'
                          : score < 40
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {isSafe ? '🟢 Safe' : score < 40 ? '🔴 High Risk' : '🟡 Review'}
                      <span className="font-mono">({score}%)</span>
                    </span>
                  </div>
                </div>

                {/* Snippet */}
                <p className="mt-2.5 line-clamp-2 text-xs text-slate-700 leading-relaxed font-normal">
                  {msg.content}
                </p>

                {/* Intent & Timestamp Tag */}
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600 capitalize">
                    {safety?.intent.replace('_', ' ') || 'Inquiry'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Deep Profile Safety & Verification Inspector */}
        <div className="lg:col-span-7">
          {selectedMessage ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-xs">
              {/* Profile Card Top */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedMessage.sender.avatarUrl}
                    alt={selectedMessage.sender.displayName}
                    className="h-12 w-12 rounded-full border border-slate-300 object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900">
                        {selectedMessage.sender.displayName}
                      </h3>
                      {selectedMessage.sender.isVerifiedBadge && (
                        <span className="rounded bg-sky-100 px-1.5 py-0.2 text-[10px] font-bold text-sky-700">
                          Official Verified
                        </span>
                      )}
                    </div>
                    {(() => {
                      const cleanUser = selectedMessage.sender.username.replace('@', '');
                      const profileUrl =
                        selectedMessage.platform === 'instagram'
                          ? `https://instagram.com/${cleanUser}`
                          : selectedMessage.platform === 'x_twitter'
                          ? `https://x.com/${cleanUser}`
                          : selectedMessage.platform === 'facebook'
                          ? `https://facebook.com/${cleanUser}`
                          : selectedMessage.platform === 'linkedin'
                          ? `https://linkedin.com/in/${cleanUser}`
                          : selectedMessage.platform === 'telegram'
                          ? `https://t.me/${cleanUser}`
                          : selectedMessage.platform === 'youtube'
                          ? `https://youtube.com/@${cleanUser}`
                          : `https://instagram.com/${cleanUser}`;

                      return (
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                          <a
                            href={profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0f7b6c] hover:underline font-semibold inline-flex items-center gap-1"
                          >
                            <span>@{selectedMessage.sender.username}</span>
                            <ExternalLink className="h-3 w-3 inline" />
                          </a>
                          <span>·</span>
                          <span className="capitalize font-sans flex items-center gap-1">
                            {getPlatformIcon(selectedMessage.platform)}
                            {selectedMessage.platform.replace('_', ' ')}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Score Widget */}
                <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Profile Safety
                    </div>
                    <div className={`text-xl font-bold font-mono ${
                      (selectedMessage.analysis.profileSafety?.safetyScore ?? 0) >= 70
                        ? 'text-emerald-700'
                        : (selectedMessage.analysis.profileSafety?.safetyScore ?? 0) < 40
                        ? 'text-rose-700'
                        : 'text-amber-700'
                    }`}>
                      {selectedMessage.analysis.profileSafety?.safetyScore}%
                    </div>
                  </div>
                  <div className={`h-10 w-1 rounded-full ${
                    (selectedMessage.analysis.profileSafety?.safetyScore ?? 0) >= 70
                      ? 'bg-emerald-500'
                      : (selectedMessage.analysis.profileSafety?.safetyScore ?? 0) < 40
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                  }`} />
                </div>
              </div>

              {/* Bio & Profile Forensics */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase">Followers</span>
                  <span className="mt-0.5 block text-sm font-bold font-mono text-slate-800">
                    {selectedMessage.sender.followerCount.toLocaleString()}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase">Following</span>
                  <span className="mt-0.5 block text-sm font-bold font-mono text-slate-800">
                    {selectedMessage.sender.followingCount.toLocaleString()}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase">Burner Probability</span>
                  <span className={`mt-0.5 block text-sm font-bold font-mono ${
                    selectedMessage.analysis.fakeAccountProbability > 30 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {selectedMessage.analysis.fakeAccountProbability}%
                  </span>
                </div>
              </div>

              {selectedMessage.sender.bio && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Sender Bio: </span>
                  {selectedMessage.sender.bio}
                </div>
              )}

              {/* Message Payload */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Inbound Message Content
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100 font-sans">
                  &ldquo;{selectedMessage.content}&rdquo;
                </p>
              </div>

              {/* Engine Diagnosis & Indicators */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Engine Safety Breakdown
                </h4>
                
                <div className="space-y-2">
                  {selectedMessage.analysis.profileSafety?.reasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-700"
                    >
                      <CheckCircle className={`h-4 w-4 shrink-0 mt-0.5 ${
                        selectedMessage.analysis.profileSafety?.isSafe ? 'text-emerald-600' : 'text-rose-600'
                      }`} />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>

                {/* Threat Indicators List */}
                {selectedMessage.analysis.indicators.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-[11px] font-bold text-rose-700 uppercase">Flagged Risks:</p>
                    {selectedMessage.analysis.indicators.map((ind, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-rose-200 bg-rose-50/70 p-2.5 text-xs text-rose-900"
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <BadgeAlert className="h-3.5 w-3.5 text-rose-600" />
                          {ind.title}
                        </div>
                        <p className="mt-0.5 text-[11px] text-rose-800">{ind.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="mt-4 flex items-center justify-between gap-3">
                {selectedMessage.analysis.profileSafety?.isSafe ? (
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Accept Collaboration Inquiry &amp; Route to Brand Partnerships
                  </button>
                ) : (
                  <div className="w-full flex items-center gap-2">
                    <button
                      type="button"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 text-xs font-semibold shadow-xs transition"
                    >
                      <UserX className="h-4 w-4" />
                      Block &amp; Submit Impersonator Takedown
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 hover:bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition"
                    >
                      Quarantine
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-center">
              <Eye className="h-8 w-8 text-slate-400" />
              <p className="mt-2 text-xs font-medium text-slate-500">
                Select any inbound message from the stream to inspect sender identity and safety forensics.
              </p>
            </div>
          )}
        </div>
      </div>
      )}


      {/* Real-Time DM Analysis Modal */}
      {showAnalyzeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Analyze Inbound DM Forensics</h3>
                  <p className="text-[11px] text-slate-500">Autonomous Fake Account Detection via NVIDIA NIM</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAnalyzeModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteAnalysis} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Channel Surface</label>
                  <select
                    value={analyzingPlatform}
                    onChange={(e) => setAnalyzingPlatform(e.target.value as SocialPlatform)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="x_twitter">Twitter (X)</option>
                    <option value="facebook">Facebook</option>
                    <option value="telegram">Telegram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sender Handle *</label>
                  <input
                    type="text"
                    required
                    placeholder="@brand_support_desk"
                    value={analyzingHandle}
                    onChange={(e) => setAnalyzingHandle(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    placeholder="Brand Resolution Desk"
                    value={analyzingDisplayName}
                    onChange={(e) => setAnalyzingDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Follower Count</label>
                  <input
                    type="number"
                    min={0}
                    value={analyzingFollowers}
                    onChange={(e) => setAnalyzingFollowers(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={analyzingFakeBadge}
                  onChange={(e) => setAnalyzingFakeBadge(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>Simulate spoofed checkmark emoji (e.g. ✓) in sender profile</span>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Direct Message Body *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Paste direct message text received from this profile..."
                  value={analyzingContent}
                  onChange={(e) => setAnalyzingContent(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAnalyzeModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAnalysis}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmittingAnalysis ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Inference via NVIDIA NIM...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Execute Threat Analysis &amp; Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
