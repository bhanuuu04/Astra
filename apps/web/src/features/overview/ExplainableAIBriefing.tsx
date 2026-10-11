'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Network, 
  HelpCircle, 
  ArrowRight,
  Send,
  Lock
} from 'lucide-react';
import { submitCampaignDecision } from '@/lib/api';

interface ExplainableAIBriefingProps {
  campaignId?: string;
  campaignTitle?: string;
  riskScore?: number;
}

export function ExplainableAIBriefing({
  campaignId = 'camp-nilapay-01',
  campaignTitle = 'Operation Fake NilaPay Updater & Credential Extortion',
  riskScore = 94.0
}: ExplainableAIBriefingProps) {
  const [analystDecision, setAnalystDecision] = useState<string | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDecision = async (decision: 'accept' | 'benign' | 'reject') => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (campaignId && campaignId !== 'camp-nilapay-01') {
        await submitCampaignDecision(campaignId, decision, decisionNotes || `Analyst evaluated via AI Briefing Deck`);
      } else {
        // Also call the API if camp-nilapay-01 or test backend connectivity
        await submitCampaignDecision(campaignId || 'camp-nilapay-01', decision, decisionNotes || `Analyst evaluated via AI Briefing Deck`);
      }
      // Only set decision state upon verified successful API response
      setAnalystDecision(decision);
    } catch (err: any) {
      setErrorMessage(err?.message || 'API submission failed. Please verify API server connectivity before confirming decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Explainable Threat Briefing &amp; Analyst Gate
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Hybrid NLP + Heuristic
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evidence-grounded forensic briefing generated with uncertainty boundaries and review gating
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Composite Risk {riskScore} / 100
          </span>
        </div>
      </div>

      {/* Error Message Toast/Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-100 text-xs font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Structured Explainable Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: What Happened & Multi-Engine Signals */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              1. Multi-Engine Detection Signals
            </div>
            <span className="text-xs font-mono text-slate-400">P1 Incident</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Coordinated brand impersonation campaign targeting NilaPay customers across Instagram and Telegram.
            The attacker lures victims with urgent fake account verification claims, directing them to download a trojanized Android APK (<code>com.nilapay.security.patch</code>) to harvest 2FA tokens and extort advance renewal fees.
          </p>
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Vision &amp; Homoglyph Engine:</span>
              <span className="text-indigo-300 font-semibold">94% Confidence</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Trojan APK Decompiler:</span>
              <span className="text-indigo-300 font-semibold">91% Confidence</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Social Extortion NLP:</span>
              <span className="text-indigo-300 font-semibold">88% Confidence</span>
            </div>
          </div>
        </div>

        {/* Card 2: Correlated Evidence & Cryptographic Pivots */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              2. Grounded Evidence &amp; Graph Pivots
            </div>
            <span className="text-xs font-mono text-emerald-400/90 font-semibold">3 Invariants Linked</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 list-none">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-slate-200">Shared UPI Handle:</strong> <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">fraudster@okhdfcbank</code> verified in DM extortion demands.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-slate-200">Lookalike Domain:</strong> <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">nilapay-secure-updater.xyz</code> hosting credential phishing form.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-slate-200">APK SHA-256 Digest:</strong> <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">9f83e204c3210b4105a...</code> matches static package signature.
              </span>
            </li>
          </ul>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              SHA-256 Evidence Manifest Validated
            </span>
            <span className="text-slate-500">Demo Baseline</span>
          </div>
        </div>

        {/* Card 3: Uncertainty & Forensic Boundaries */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              3. Uncertainty &amp; Forensic Boundaries
            </div>
            <span className="text-xs font-mono text-amber-400/90 font-semibold">Boundary Check</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Telegram channel C2 infrastructure IP is routed through known bulletproof hosting (ASN 48282).
            Attacker identity remains pseudonymous; while the UPI payment handle is active, true KYC beneficiary may be an unwitting money mule.
          </p>
          <div className="pt-2 border-t border-slate-800/80 text-xs text-amber-400/90 font-mono">
            Forensic Boundary: Automated takedown recommended; law enforcement subpoena required for KYC deanonymization.
          </div>
        </div>

        {/* Card 4: Recommended Analyst Action */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-300 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              4. Recommended Action Packet
            </div>
            <span className="text-xs font-mono text-rose-400/90 font-semibold">Triage Steps</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-none">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>1. Submit Meta Rights Manager takedown for Instagram handle.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>2. Send ICANN Registrar suspension notice for lookalike domain.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>3. Dispatch NPCI fraud alert to freeze UPI handle <code className="text-slate-200">fraudster@okhdfcbank</code>.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>4. Publish customer safety advisory on official NilaPay channels.</span>
            </li>
          </ul>
          <div className="pt-1">
            <Link 
              href={`/campaigns/${campaignId}/response`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              <span>Draft Response Packet &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop Analyst Decision Gate */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white">Analyst Review &amp; Decision Gate</span>
            {analystDecision && (
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase font-mono ${
                analystDecision === 'accept'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : analystDecision === 'benign'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                Decision: {analystDecision}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            AI recommendations never trigger automated external takedowns without affirmative analyst sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleDecision('accept')}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirm Threat</span>
          </button>

          <button
            onClick={() => handleDecision('benign')}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Mark Benign</span>
          </button>

          <button
            onClick={() => handleDecision('reject')}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs font-medium transition cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Cluster</span>
          </button>
        </div>
      </div>
    </div>
  );
}
