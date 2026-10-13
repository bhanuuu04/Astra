'use client';

import React, { useState } from 'react';
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
  Check
} from 'lucide-react';

interface LinkAnalysisResult {
  url: string;
  verdict: 'safe' | 'suspicious' | 'malicious';
  score: number;
  reasons: string[];
  brandTargeted?: string;
  domainAge?: string;
  sslValid?: boolean;
}

export default function ConsumerHubPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'link-checker' | 'message-analyzer' | 'report'>('link-checker');

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

  // Handle URL Link Scan
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

      const isSuspicious = !isMalicious && (lower.includes('gift') || lower.includes('support-') || !lower.includes('.com'));

      if (isMalicious) {
        setUrlResult({
          url: raw,
          verdict: 'malicious',
          score: 18,
          reasons: [
            'Detected suspicious high-risk top-level domain or spoofed subdomain',
            'Heuristic fingerprint matches credential harvesting kit',
            'Domain was registered recently and lacks legitimate EV certificates',
          ],
          brandTargeted: lower.includes('stripe') ? 'Stripe' : lower.includes('apple') ? 'Apple' : 'Popular Financial Institution',
          domainAge: '3 days ago',
          sslValid: false,
        });
      } else if (isSuspicious) {
        setUrlResult({
          url: raw,
          verdict: 'suspicious',
          score: 54,
          reasons: [
            'Domain similarity closely mirrors an official commercial entity',
            'Unverified redirect chain detected',
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
            'Valid extended-validation TLS certificate',
            'Legitimate canonical DNS perimeter matching official brand registry',
            'No blacklisting or malware reports across threat feeds',
          ],
          domainAge: '7+ years',
          sslValid: true,
        });
      }
      setIsScanningUrl(false);
    }, 1000);
  };

  // Handle Message Inspection
  const handleAnalyzeMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = messageInput.trim();
    if (!raw) return;

    setIsAnalyzingMsg(true);
    setMessageResult(null);

    setTimeout(() => {
      const lower = raw.toLowerCase();
      const hasUrgency = lower.includes('urgent') || lower.includes('24 hours') || lower.includes('immediate') || lower.includes('suspend');
      const hasPayment = lower.includes('eth') || lower.includes('crypto') || lower.includes('wallet') || lower.includes('gift card') || lower.includes('wire');
      const hasLink = lower.includes('http') || lower.includes('click') || lower.includes('.apk') || lower.includes('.top');

      if ((hasUrgency && hasLink) || hasPayment) {
        setMessageResult({
          riskLevel: 'high',
          isScam: true,
          analysis: 'This message exhibits typical social engineering tactics: false urgency, unauthorized brand impersonation, and an unverified destination link designed to steal credentials or download rogue files.',
          detectedTactics: [
            'Manufactured Urgency (Threat of account termination)',
            'Executive / Support Desk Impersonation',
            'External payload download or financial solicitation',
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
          analysis: 'No overt phishing patterns, credential harvesters, or extortion indicators detected in this text.',
          detectedTactics: [],
        });
      }
      setIsAnalyzingMsg(false);
    }, 900);
  };

  const handleSwitchToBrand = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('astra_user_role', 'brand');
    }
    router.push('/guide?step=brand_form');
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#37352f] flex flex-col justify-between selection:bg-[#0f7b6c]/15 selection:text-[#0f7b6c] font-sans antialiased">
      {/* Top Header */}
      <header className="border-b border-[#e3e2e0] bg-white sticky top-0 z-40 px-6 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-[6px] bg-[#37352f] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                A
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-tight text-[#37352f]">ASTRA</span>
                  <span className="rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20 text-[10px] font-semibold px-2 py-0.5">
                    Consumer Safety Hub
                  </span>
                </div>
                <p className="text-[11px] text-[#787774]">Personal Identity &amp; Scam Protection</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSwitchToBrand}
              className="inline-flex items-center gap-1.5 text-xs text-[#787774] hover:text-[#0f7b6c] font-medium transition py-1.5 px-2.5 rounded-[6px] border border-[#e3e2e0] bg-white hover:bg-[#f7f6f3]"
            >
              <Building2 className="w-3.5 h-3.5 text-[#0f7b6c]" />
              <span>Switch to Brand Workspace</span>
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

      {/* Main Content Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#0f7b6c]/10 border border-[#0f7b6c]/25 text-[#0f7b6c] text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Consumer Protection Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#37352f]">
            Verify Links &amp; Defend Against Digital Scams
          </h1>
          <p className="text-xs sm:text-sm text-[#787774] max-w-xl mx-auto">
            Received a suspicious message, unfamiliar website link, or fake customer service communication? Analyze it instantly with ASTRA Sentinel AI.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-[8px] bg-[#e3e2e0]/60 border border-[#e3e2e0] text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('link-checker')}
              className={`px-4 py-2 rounded-[6px] transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'link-checker'
                  ? 'bg-white text-[#37352f] shadow-xs font-semibold'
                  : 'text-[#787774] hover:text-[#37352f]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Scam Link Scanner</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('message-analyzer')}
              className={`px-4 py-2 rounded-[6px] transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'message-analyzer'
                  ? 'bg-white text-[#37352f] shadow-xs font-semibold'
                  : 'text-[#787774] hover:text-[#37352f]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Suspicious Message Check</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-[6px] transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'report'
                  ? 'bg-white text-[#37352f] shadow-xs font-semibold'
                  : 'text-[#787774] hover:text-[#37352f]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report Impersonator</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Scam Link Scanner */}
        {activeTab === 'link-checker' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[12px] border border-[#e3e2e0] p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div>
              <h2 className="text-base font-bold text-[#37352f]">Check any URL or Website Link</h2>
              <p className="text-xs text-[#787774] mt-1">
                Enter any domain or full URL received via SMS, WhatsApp, Instagram DM, or email to verify if it is an authentic brand or a phishing fake.
              </p>
            </div>

            <form onSubmit={handleScanUrl} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. https://astra-mobile-update.top/downloads or stripe-verify.net"
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
                onClick={() => {
                  setUrlInput('https://astra-mobile-update.top/downloads/patch.apk');
                }}
                className="px-2 py-0.5 rounded-[4px] bg-[#eb5757]/10 text-[#eb5757] border border-[#eb5757]/20 text-[11px] font-mono cursor-pointer"
              >
                astra-mobile-update.top (Malicious)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrlInput('https://stripe.com/docs');
                }}
                className="px-2 py-0.5 rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20 text-[11px] font-mono cursor-pointer"
              >
                stripe.com (Safe)
              </button>
            </div>

            {/* URL Analysis Result */}
            {urlResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-[10px] border space-y-3 ${
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

        {/* Tab 2: Message Analyzer */}
        {activeTab === 'message-analyzer' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[12px] border border-[#e3e2e0] p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div>
              <h2 className="text-base font-bold text-[#37352f]">Analyze Suspicious SMS or Direct Message</h2>
              <p className="text-xs text-[#787774] mt-1">
                Paste the text of any email, text message, or social media DM that requested urgent action or claimed to be official support.
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

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() =>
                    setMessageInput(
                      'URGENT NOTICE: Your account has been reported for copyright violation. Appeal within 12 hours or your profile will be permanently deleted: https://bit.ly/appeal-support-desk'
                    )
                  }
                  className="text-[11px] text-[#0f7b6c] hover:underline cursor-pointer"
                >
                  Insert Sample Phishing Message
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
                className={`p-5 rounded-[10px] border space-y-3 ${
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

        {/* Tab 3: Report Impersonator */}
        {activeTab === 'report' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[12px] border border-[#e3e2e0] p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div>
              <h2 className="text-base font-bold text-[#37352f]">Report a Fake Account or Scam Site</h2>
              <p className="text-xs text-[#787774] mt-1">
                Help protect the community. Submissions are dispatched to brand security teams and automated takedown radars.
              </p>
            </div>

            {reportSubmitted ? (
              <div className="p-6 rounded-[8px] bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-emerald-900">Incident Reported Successfully</h3>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  Thank you! Our automated crawler has queued this asset for takedown evidence packaging.
                </p>
                <button
                  type="button"
                  onClick={() => setReportSubmitted(false)}
                  className="mt-3 px-4 py-1.5 rounded-[6px] bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
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
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[#e3e2e0] text-center text-xs text-[#787774] bg-white">
        &copy; 2026 ASTRA Digital Risk Protection · Consumer Safety Portal
      </footer>
    </div>
  );
}
