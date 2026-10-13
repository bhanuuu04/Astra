'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, ShieldAlert, Sparkles, X } from 'lucide-react';
import { getAuthToken } from '@/lib/api';

interface VerificationModalProps {
  isOpen: boolean;
  brandName: string;
  domain?: string;
  handles?: string[];
  onComplete: (data: any) => void;
}

export function BrandVerificationModal({
  isOpen,
  brandName,
  domain,
  handles = [],
  onComplete,
}: VerificationModalProps) {
  const [attempt, setAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const handlesSignature = handles.join('\u0000');

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const runAnalysis = async () => {
      setIsLoading(true);
      setAnalysis(null);
      setError(null);
      try {
        const token = getAuthToken();
        const response = await fetch('/api/brand/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ brandName, domain, handles: handlesSignature ? handlesSignature.split('\u0000') : [] }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not analyze these brand signals.');
        if (!cancelled) setAnalysis(data.analysis);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not analyze these brand signals.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void runAnalysis();
    return () => { cancelled = true; };
  }, [isOpen, brandName, domain, handlesSignature, attempt]);

  const patternItems: string[] = Array.isArray(analysis?.potentialImpersonationPatterns)
    ? (analysis.potentialImpersonationPatterns as unknown[]).filter((item: unknown): item is string => typeof item === 'string')
    : [];
  const validationSteps: string[] = Array.isArray(analysis?.recommendedValidationSteps)
    ? (analysis.recommendedValidationSteps as unknown[]).filter((item: unknown): item is string => typeof item === 'string')
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          role="presentation"
        >
          <motion.section
            initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7"
            role="dialog" aria-modal="true" aria-labelledby="brand-analysis-title"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h2 id="brand-analysis-title" className="text-base font-semibold text-slate-900">Brand signal review</h2>
                  <p className="mt-1 text-sm text-slate-600">{brandName}{domain ? ` · ${domain}` : ''}</p>
                </div>
              </div>
              <button type="button" onClick={() => onComplete(analysis)} aria-label="Close analysis" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            </header>

            {isLoading ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 py-8 text-center" role="status">
                <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
                <p className="text-sm font-medium text-slate-800">Reviewing the identifiers you provided…</p>
                <p className="max-w-sm text-xs leading-5 text-slate-500">This analysis can suggest patterns. It does not verify ownership or authenticity.</p>
              </div>
            ) : error ? (
              <div className="my-5 rounded-xl border border-amber-200 bg-amber-50 p-4" role="alert">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-950">Analysis unavailable</p>
                    <p className="mt-1 text-sm leading-5 text-amber-900">{error}</p>
                    <button type="button" onClick={() => setAttempt((current) => current + 1)} className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100">Retry analysis</button>
                  </div>
                </div>
              </div>
            ) : analysis ? (
              <div className="space-y-5 py-5">
                <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-teal-950"><CheckCircle2 className="h-4 w-4" />Research summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{analysis.summary || 'Review the suggestions below with source evidence.'}</p>
                </div>
                {patternItems.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Potential patterns to review</h3>
                    <ul className="mt-2 space-y-2">
                      {patternItems.map((item: string, index: number) => <li key={`${index}-${item}`} className="flex gap-2 text-sm text-slate-700"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />{item}</li>)}
                    </ul>
                  </div>
                )}
                {validationSteps.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended validation steps</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-slate-700">{validationSteps.map((item: string, index: number) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
                  </div>
                )}
                <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">{analysis.limitations || 'AI-generated research is unverified. Confirm domain ownership with a DNS challenge and review source evidence before acting.'}</p>
              </div>
            ) : null}

            <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => onComplete(analysis)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
                Done <ArrowRight className="h-4 w-4" />
              </button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
