'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShieldCheck, 
  Sparkles, 
  Network, 
  Bell, 
  Layers, 
  ArrowRight, 
  Lock, 
  Flame, 
  Activity, 
  FileCheck, 
  Smartphone, 
  Globe, 
  CreditCard,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Zap,
  Eye,
  Play
} from 'lucide-react';
import { TeaserVideoModal } from '@/components/TeaserVideoModal';

export default function LandingPage() {
  const [teaserModalOpen, setTeaserModalOpen] = useState(false);
  return (
    <div className="min-h-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. HERO SECTION WITH HERO NETWORK VISUAL */}
      <section className="relative px-6 pt-10 pb-16 md:pt-14 md:pb-24 max-w-7xl mx-auto w-full">
        {/* Ambient backdrop glow */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-mono font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>ASTRA 2.0 • Autonomous Digital Risk Protection</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Protect Your Brand <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-purple-400">
                Beyond the Perimeter
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
              Autonomous multi-surface threat intelligence for modern FinTech and enterprise brands. Correlate rogue social handles, lookalike phishing domains, and trojanized Android packages into cryptographically grounded campaign clusters.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2">
              <Link
                href="/overview"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Launch Live SOC Demo (NilaPay)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={() => setTeaserModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm transition-all cursor-pointer group"
              >
                <Play className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform fill-cyan-400/20" />
                <span>Watch Product Film &amp; Teaser</span>
              </button>

              <Link
                href="/campaigns"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-sm transition-all cursor-pointer"
              >
                <Network className="w-4 h-4 text-indigo-400" />
                <span>Campaign Graph</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-5 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Evidence-Grounded Ingestion
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Human-in-the-Loop Analyst Gate
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                18-Minute Takedown SLA
              </span>
            </div>
          </div>

          {/* Right Hero Column: Premium Motion Video Walkthrough */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl group">
              <video
                autoPlay
                loop
                muted
                playsInline
                poster="/images/hero-network.jpg"
                className="w-full h-auto object-cover opacity-95 group-hover:scale-102 transition-transform duration-700"
                src="/videos/astra-product-film.mp4"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 pointer-events-none" />
              
              {/* Clean ASTRA Brand Overlay (Hiding any generic watermark) */}
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/95 backdrop-blur-md border border-slate-700 text-xs font-mono font-semibold text-white shadow-xl z-10">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="tracking-wide">ASTRA DRP • Threat Correlation</span>
              </div>

              {/* Floating Tactical Overlay Chips */}
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex items-center justify-between z-10">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-mono font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                    Live Video: Profile ➔ Graph ➔ Review
                  </span>
                </div>
                <button
                  onClick={() => setTeaserModalOpen(true)}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Expand Film</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL CONSOLE INTERACTION PREVIEW */}
      <section className="px-6 pb-20 max-w-6xl mx-auto w-full">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
          {/* Terminal Titlebar */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">ASTRA Threat Recon Console — Cross-Surface Ingestion &amp; Graph Cluster Engine</span>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 px-2 py-0.5 rounded">
              Active Telemetry
            </span>
          </div>

          {/* Interactive Mockup Body */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-rose-400">Instagram DM</span>
                  <span>T-18h</span>
                </div>
                <div className="text-sm font-semibold text-white">@nilapay_official_help</div>
                <div className="text-xs text-slate-400">Fake account offering KYC unfreeze with phishing link</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-blue-400">Web Phishing</span>
                  <span>T-14h</span>
                </div>
                <div className="text-sm font-semibold text-white">nilapay-secure-updater.xyz</div>
                <div className="text-xs text-slate-400">Lookalike domain harvesting login credentials</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-emerald-400">Sideload APK</span>
                  <span>T-10h</span>
                </div>
                <div className="text-sm font-semibold text-white">com.nilapay.security.patch</div>
                <div className="text-xs text-slate-400">Trojanized APK intercepting SMS 2FA tokens</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-cyan-400">Telegram C2</span>
                  <span>T-4h</span>
                </div>
                <div className="text-sm font-semibold text-white">t.me/nilapay_vip_support</div>
                <div className="text-xs text-slate-400">Demands UPI transfer to fraudster@okhdfcbank</div>
              </div>
            </div>

            {/* Pivot Invariant Bar */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase font-mono">
                    Correlated Recurrence Invariant Identified
                  </div>
                  <div className="text-xs text-slate-300">
                    Shared UPI Handle <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">fraudster@okhdfcbank</code> links all 4 vectors into <strong>Operation Fake NilaPay</strong>
                  </div>
                </div>
              </div>

              <Link
                href="/overview"
                className="shrink-0 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
              >
                Inspect in Deck &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW ASTRA WORKS & THREAT GRAPH ILLUSTRATION */}
      <section className="px-6 py-20 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: 3D Threat Graph Illustration */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl group">
              <img
                src="/images/threat-graph-illustration.jpg"
                alt="3D Threat Investigation Graph Illustration"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-slate-900/90 text-[11px] font-mono text-cyan-400 border border-slate-800">
                Figure: Multi-Surface Convergence Architecture
              </div>
            </div>

            {/* Right: How ASTRA Works Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                  How ASTRA Works
                </h2>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  From Disjointed Noise to Clear Campaign Evidence
                </h3>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Traditional monitoring tools report isolated alerts that overwhelm security teams. ASTRA ingests data from four distinct surfaces and detects shared invariants:
              </p>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">1. Multi-Surface Ingestion</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Monitors Instagram, Telegram channels, lookalike DNS registrations, and rogue APK repositories in real time.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                    <Network className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">2. Pivot Invariant Correlation</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Links sightings by shared UPI IDs, registrant emails, and SHA-256 binary signatures into actionable campaign graphs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">3. Cryptographic Takedown Packets</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Generates verified takedown notices tailored for Meta Rights Manager, ICANN registrars, and NPCI authorities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HUMAN-IN-THE-LOOP SOC & EDITORIAL ANALYST PHOTO */}
      <section className="px-6 py-20 border-t border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Editorial Analyst Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Enterprise Trust &amp; Governance
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  AI Proposes. Analysts Decide.
                </h3>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                ASTRA eliminates alert fatigue without relinquishing control. Every AI clustering suggestion and takedown package requires affirmative analyst sign-off before external dispatch.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-2xl font-mono font-extrabold text-white">18 min</div>
                  <div className="text-xs text-slate-400">Average time to verified takedown dossier</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-2xl font-mono font-extrabold text-emerald-400">100%</div>
                  <div className="text-xs text-slate-400">Auditable evidence manifest backing</div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/console"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  <span>Explore Simulator Console &rarr;</span>
                </Link>
              </div>
            </div>

            {/* Right: Editorial Analyst Photo */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl group">
              <img
                src="/images/analyst-investigation.jpg"
                alt="Security Analyst Conducting Digital Risk Investigation"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-slate-900/90 text-[11px] font-mono text-slate-300 border border-slate-800">
                SOC Analyst Reviewing Multi-Node Campaign Correlation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER CALL-TO-ACTION */}
      <footer className="px-6 py-12 border-t border-slate-800 bg-slate-950 text-center space-y-4">
        <h4 className="text-lg font-bold text-white">
          Ready to experience the analyst command deck?
        </h4>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/overview"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <span>Open SOC Command Deck</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-xs text-slate-500 pt-2 font-mono">
          ASTRA DRP Platform v2.0 • Designed for Enterprise Cybersecurity &amp; FinTech Operations
        </p>
      </footer>

      {/* 9:16 Vertical Social Media Teaser Video Modal */}
      <TeaserVideoModal 
        isOpen={teaserModalOpen} 
        onClose={() => setTeaserModalOpen(false)} 
      />
    </div>
  );
}
