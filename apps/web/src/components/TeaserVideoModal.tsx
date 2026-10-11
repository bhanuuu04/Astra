'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Smartphone, 
  Sparkles, 
  ShieldAlert, 
  Network, 
  CheckCircle2, 
  Share2, 
  ExternalLink, 
  Flame, 
  ArrowRight,
  Tv,
  Maximize2
} from 'lucide-react';

interface TeaserVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeaserVideoModal({ isOpen, onClose }: TeaserVideoModalProps) {
  const [activeTab, setActiveTab] = useState<'film' | 'vertical'>('film');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0); // 0 to 15 seconds
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const DURATION = 15; // 15 seconds sequence

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      if (videoRef.current) videoRef.current.pause();
      return;
    }

    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [isOpen]);

  // Storyboard timer for vertical mode
  useEffect(() => {
    if (!isPlaying || activeTab !== 'vertical') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= DURATION) {
          return 0; // Loop seamlessly
        }
        return Number((prev + 0.1).toFixed(1));
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, activeTab]);

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const restartVideo = () => {
    if (activeTab === 'film' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  if (!isOpen) return null;

  const phase = 
    currentTime < 3.5 ? 1 :
    currentTime < 7.5 ? 2 :
    currentTime < 11.5 ? 3 : 4;

  const phaseDescription = 
    phase === 1 ? 'Phase 1: Suspicious social handle identified (@brand_official_help)' :
    phase === 2 ? 'Phase 2: Phishing domain & trojanized APK payload emerge across surfaces' :
    phase === 3 ? 'Phase 3: Cryptographic pivot invariants connect vectors into unified graph' :
    'Phase 4: Clustered campaign locked with 1-click legal takedown dossier';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Navigation Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
              <button
                onClick={() => {
                  setActiveTab('film');
                  setIsPlaying(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'film'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>16:9 Product Film</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('vertical');
                  setIsPlaying(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'vertical'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16 Social Teaser</span>
              </button>
            </div>

            <span className="text-xs text-slate-400 hidden sm:inline">
              ASTRA Investigation Flow: Social ➔ Graph ➔ Review
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'film' ? (
            /* TAB 1: 16:9 CINEMA PRODUCT FILM */
            <div className="p-6 space-y-6">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl aspect-video group">
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  playsInline
                  src="/videos/astra-product-film.mp4"
                  poster="/images/hero-network.jpg"
                  className="w-full h-full object-cover"
                />

                {/* Overlaid Authentic ASTRA Branding (Covers generic watermark) */}
                <div className="absolute top-4 left-4 flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-xl">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs">
                    A
                  </div>
                  <div className="leading-tight">
                    <div className="text-xs font-bold text-white tracking-wide">ASTRA DRP</div>
                    <div className="text-[10px] text-cyan-300 font-mono">Threat Correlation Engine</div>
                  </div>
                </div>

                {/* Overlaid Live Sighting Invariant Pin */}
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Cross-Surface Pivot: <strong className="text-cyan-300">fraudster@okhdfcbank</strong></span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                    Risk 94.0 Critical
                  </span>
                </div>
              </div>

              {/* Film Narrative & Context */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-indigo-400 uppercase font-mono">1. Multi-Surface Alert</div>
                  <p className="text-xs text-slate-300">
                    Suspicious Instagram DM, lookalike phishing URL, and trojanized APK detected concurrently.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-cyan-400 uppercase font-mono">2. Invariant Graphing</div>
                  <p className="text-xs text-slate-300">
                    Shared UPI handle and package signatures automatically consolidate alerts into one campaign.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-emerald-400 uppercase font-mono">3. Human Review Gate</div>
                  <p className="text-xs text-slate-300">
                    Analyst reviews cryptographic manifest before dispatching verified takedowns to Meta and NPCI.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: 9:16 VERTICAL SOCIAL TEASER */
            <div className="p-6 flex flex-col md:flex-row items-center gap-6">
              {/* Smartphone Frame */}
              <div className="w-64 h-[440px] rounded-[36px] p-2 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl relative border border-slate-700/80 shrink-0">
                <div className="w-full h-full rounded-[28px] bg-slate-950 overflow-hidden relative flex flex-col justify-between">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-30" />

                  <div className="absolute inset-0 z-0">
                    <img 
                      src="/images/vertical-social-teaser.jpg" 
                      alt="ASTRA Vertical Social Teaser 9:16" 
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/90" />
                  </div>

                  <div className="relative z-10 flex-1 flex flex-col justify-between p-4 pt-8">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-cyan-300 font-semibold shadow">
                        {currentTime.toFixed(1)}s / {DURATION}s
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Phase {phase}/4
                      </span>
                    </div>

                    <div className="space-y-3 py-6 text-center">
                      {phase === 1 && (
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 text-left animate-fade-in shadow-lg">
                          <div className="text-[10px] font-bold text-amber-400 uppercase">Suspicious Profile</div>
                          <div className="text-xs font-bold text-white mt-1">@brand_official_help</div>
                        </div>
                      )}
                      {phase === 2 && (
                        <div className="space-y-2 animate-fade-in text-left">
                          <div className="p-2 rounded-lg bg-slate-900/90 border border-blue-500/40 text-[10px] text-blue-300">
                            Web Phishing: brand-secure-updater.xyz
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900/90 border border-emerald-500/40 text-[10px] text-emerald-300">
                            Trojan APK: com.brand.security.patch
                          </div>
                        </div>
                      )}
                      {phase === 3 && (
                        <div className="p-3 rounded-xl bg-indigo-950/90 border border-cyan-500/60 text-left animate-fade-in shadow-xl">
                          <div className="text-[10px] font-bold text-cyan-300 uppercase">Pivot Invariant Linked</div>
                          <div className="text-xs font-bold text-white mt-1 font-mono">UPI: fraudster@okhdfcbank</div>
                        </div>
                      )}
                      {phase === 4 && (
                        <div className="space-y-2 py-4 animate-fade-in text-center">
                          <div className="text-sm font-extrabold text-white">ASTRA 2.0</div>
                          <div className="text-[10px] text-slate-300">Digital Risk Protection Platform</div>
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-semibold">
                            <span>1-Click Takedown</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-100"
                        style={{ width: `${(currentTime / DURATION) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Storyboard Context Panel */}
              <div className="flex-1 space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-mono font-bold text-cyan-400 uppercase">9:16 Sequence Timeline</div>
                  <div className="text-sm font-semibold text-white">{phaseDescription}</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Designed for vertical video formats (Instagram Reels, YouTube Shorts, product teasers).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href="/images/vertical-social-teaser.jpg"
                    target="_blank"
                    rel="noreferrer"
                    download="astra-vertical-teaser-9-16.jpg"
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Download 9:16 Artwork</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={activeTab === 'film' ? toggleVideoPlayback : () => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={restartVideo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/videos/astra-product-film.mp4"
              download="astra-product-film.mp4"
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Download MP4</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
