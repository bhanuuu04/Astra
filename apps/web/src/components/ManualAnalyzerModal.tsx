'use client';

import React, { useState } from 'react';
import { 
  SocialPlatform, 
  SenderProfile, 
  ThreatAnalysis, 
  BrandAssetRegistry 
} from '@/types/threat';
import { 
  X, 
  Terminal, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';

interface ManualAnalyzerModalProps {
  brand: BrandAssetRegistry;
  onClose: () => void;
  onIngestAsNewMessage?: (message: any) => void;
}

export function ManualAnalyzerModal({
  brand,
  onClose,
  onIngestAsNewMessage
}: ManualAnalyzerModalProps) {
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [username, setUsername] = useState('astra_official_helpdesk');
  const [displayName, setDisplayName] = useState('Astra Technical Support ✓');
  const [followers, setFollowers] = useState(18);
  const [following, setFollowing] = useState(940);
  const [content, setContent] = useState(
    'URGENT: Your account requires immediate security patch confirmation. Download the emergency Astra Mobile Security update: https://astra-mobile-patch.xyz/AstraSecurity_v2.apk to avoid permanent termination within 12 hours.'
  );

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ThreatAnalysis | null>(null);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const senderProfile: SenderProfile = {
      id: `manual-${Date.now()}`,
      platform,
      username: username.replace('@', ''),
      displayName,
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      followerCount: Number(followers) || 0,
      followingCount: Number(following) || 0,
      isVerifiedBadge: false,
      isFakeBadgeEmoji: displayName.includes('✓') || displayName.includes('☑️'),
      accountCreatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 4).toISOString()
    };

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          sender: senderProfile,
          brand
        })
      });
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleIngestToFeed = () => {
    if (!analysis) return;
    if (onIngestAsNewMessage) {
      onIngestAsNewMessage({
        id: `manual-inbound-${Date.now()}`,
        platform,
        brandAccountId: brand.id,
        sender: {
          id: `manual-usr-${Date.now()}`,
          platform,
          username: username.replace('@', ''),
          displayName,
          avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
          followerCount: Number(followers),
          followingCount: Number(following),
          isVerifiedBadge: false,
          isFakeBadgeEmoji: displayName.includes('✓')
        },
        content,
        timestamp: new Date().toISOString(),
        analysis,
        status: analysis.severity === 'critical' ? 'quarantined' : 'new'
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 lg:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Astra Forensic Diagnostic Lab</span>
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Test any suspect Direct Message, Sender Handle, or Rogue APK link
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <form onSubmit={handleRunAnalysis} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-mono text-slate-700 font-semibold">Social Channel</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                >
                  <option value="instagram">Instagram</option>
                  <option value="x_twitter">X (Twitter)</option>
                  <option value="telegram">Telegram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="discord">Discord</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-700 font-semibold">Sender Username (@)</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. astra_mobile_support"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-700 font-semibold">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Astra Support ✓"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-slate-700 font-semibold">Followers Count</label>
                <input
                  type="number"
                  value={followers}
                  onChange={(e) => setFollowers(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-700 font-semibold">Following Count</label>
                <input
                  type="number"
                  value={following}
                  onChange={(e) => setFollowing(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-700 font-semibold">Inbound Message Content</label>
              <textarea
                required
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste suspect message text..."
                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold font-mono transition flex items-center justify-center gap-2 shadow-xs"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Heuristic Analysis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Astra Threat Diagnostics</span>
                </>
              )}
            </button>
          </form>

          {/* Analysis Results View */}
          {analysis && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 font-mono shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${
                    analysis.severity === 'critical'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : analysis.severity === 'high'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {analysis.severity} Risk
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    Score: {analysis.riskScore}/100
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600 font-medium">Impersonation: <strong className="text-amber-800">{analysis.impersonationScore}%</strong></span>
                  <span className="text-slate-600 font-medium">Fake Probability: <strong className="text-red-700">{analysis.fakeAccountProbability}%</strong></span>
                </div>
              </div>

              <div className="text-xs text-slate-700 font-medium">
                {analysis.summary}
              </div>

              {/* Matched Indicators */}
              <div className="space-y-2">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Signals Triggered:</div>
                {analysis.indicators.map((ind, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1 shadow-2xs">
                    <div className="text-cyan-800 font-bold">{ind.title}</div>
                    <div className="text-slate-600 text-[11px]">{ind.description}</div>
                  </div>
                ))}
              </div>

              {/* Ingest to main feed button */}
              {onIngestAsNewMessage && (
                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={handleIngestToFeed}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Push to Threat Inbox Feed
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
