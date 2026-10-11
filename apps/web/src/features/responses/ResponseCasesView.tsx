'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ExternalLink,
  Plus,
  FileText
} from 'lucide-react';
import { 
  listResponseCases, 
  approveResponseCase, 
  dispatchResponseCase, 
  resolveResponseCase, 
  createResponseDraft,
  type ResponseCase 
} from '@/lib/api';
import { ResponseCaseTimeline } from '@/components/responses/ResponseCaseTimeline';
import { ResponseCaseActions } from '@/components/responses/ResponseCaseActions';
import { Button } from '@/components/ui/button';

export function ResponseCasesView() {
  const queryClient = useQueryClient();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['response_cases'],
    queryFn: () => listResponseCases(),
  });

  const cases = data?.cases || [];

  // Demo fallback cases if no database response cases yet
  const displayCases: ResponseCase[] = cases.length > 0 
    ? cases 
    : [
        {
          id: 'case-demo-001',
          tenant_id: 'default_tenant',
          target_provider: 'Cloudflare Abuse Desk',
          case_type: 'phishing_domain_takedown',
          lifecycle_state: 'draft',
          draft_subject: 'ASTRA Security Incident: Fraudulent Impersonation on login-astra-update.cc',
          draft_body: 'Notice of Trademark & Phishing Abuse: The domain login-astra-update.cc is hosting an unauthorized credential interceptor impersonating official Astra Brand DNA.',
          drafted_by: 'Analyst Sarah Chen',
          created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        },
        {
          id: 'case-demo-002',
          tenant_id: 'default_tenant',
          target_provider: 'Telegram Trust & Safety',
          case_type: 'impersonation_channel',
          lifecycle_state: 'approved',
          draft_subject: 'Emergency Takedown: Impersonation Account @AstraHelpDesk_VIP',
          draft_body: 'The Telegram handle @AstraHelpDesk_VIP is soliciting private keys and distributing trojanized APK packages.',
          drafted_by: 'Analyst Sarah Chen',
          approved_by: 'Security Lead Mark Taylor',
          created_at: new Date(Date.now() - 1000 * 3600 * 3).toISOString(),
          approved_at: new Date(Date.now() - 1000 * 3600 * 1).toISOString(),
        },
        {
          id: 'case-demo-003',
          tenant_id: 'default_tenant',
          target_provider: 'Google Play Protect',
          case_type: 'counterfeit_mobile_apk',
          lifecycle_state: 'submitted',
          draft_subject: 'Malware Report: Troj/FakeAstra-Android.apk (SHA-256 sealed)',
          draft_body: 'Formal notice requesting blacklisting and killswitch dispatch for package org.astra.foundation.airdrop.',
          drafted_by: 'Analyst Alex Rivera',
          approved_by: 'Security Lead Mark Taylor',
          dispatched_by: 'Astra Takedown Dispatcher',
          created_at: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
          approved_at: new Date(Date.now() - 1000 * 3600 * 20).toISOString(),
          dispatched_at: new Date(Date.now() - 1000 * 3600 * 18).toISOString(),
        },
        {
          id: 'case-demo-004',
          tenant_id: 'default_tenant',
          target_provider: 'Namecheap Registrar Abuse',
          case_type: 'typosquat_domain',
          lifecycle_state: 'resolved',
          draft_subject: 'Domain Suspension Notice: astra-security-login.top',
          draft_body: 'Host records deactivated following validated evidence dossier submission.',
          drafted_by: 'Analyst Sarah Chen',
          approved_by: 'Security Lead Mark Taylor',
          dispatched_by: 'Astra Takedown Dispatcher',
          resolved_by: 'Namecheap Incident Support',
          created_at: new Date(Date.now() - 1000 * 3600 * 48).toISOString(),
          approved_at: new Date(Date.now() - 1000 * 3600 * 45).toISOString(),
          dispatched_at: new Date(Date.now() - 1000 * 3600 * 40).toISOString(),
          resolved_at: new Date(Date.now() - 1000 * 3600 * 8).toISOString(),
        },
      ];

  const activeCase = displayCases.find(c => c.id === selectedCaseId) || displayCases[0];

  const handleApprove = async (id: string) => {
    setActionError(null);
    try {
      await approveResponseCase(id);
      setActionSuccess('Response case approved for dispatch.');
      setTimeout(() => setActionSuccess(null), 4000);
      await queryClient.invalidateQueries({ queryKey: ['response_cases'] });
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve response case.');
    }
  };

  const handleDispatch = async (id: string) => {
    setActionError(null);
    try {
      await dispatchResponseCase(id);
      setActionSuccess('Response case dispatched to provider.');
      setTimeout(() => setActionSuccess(null), 4000);
      await queryClient.invalidateQueries({ queryKey: ['response_cases'] });
    } catch (err: any) {
      setActionError(err.message || 'Failed to dispatch response case.');
    }
  };

  const handleResolve = async (id: string) => {
    setActionError(null);
    try {
      await resolveResponseCase(id, 'abatement_confirmed', 'Verified threat removed and confirmed by analyst');
      setActionSuccess('Response case marked as resolved.');
      setTimeout(() => setActionSuccess(null), 4000);
      await queryClient.invalidateQueries({ queryKey: ['response_cases'] });
    } catch (err: any) {
      setActionError(err.message || 'Failed to resolve response case.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
            <Send className="h-3.5 w-3.5" /> Human-Governed Remediation
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">Response & Takedown Cases</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Strict human governance state machine for evidence-backed takedown notices, provider communications, and incident resolution.
          </p>
        </div>

        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['response_cases'] })}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Cases</span>
        </button>
      </header>

      {/* Action Notification Banners */}
      {actionSuccess && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-300 animate-fade-in flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-200 text-xs">Dismiss</button>
        </div>
      )}
      {actionError && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-300 animate-fade-in flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-200 text-xs">Dismiss</button>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List Column */}
        <div className="lg:col-span-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Active Response Cases ({displayCases.length})
          </p>

          {displayCases.map((rc) => {
            const isSelected = activeCase?.id === rc.id;
            const stateColors = {
              draft: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
              pending_approval: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
              approved: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
              submitted: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
              acknowledged: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
              resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
              rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
            }[rc.lifecycle_state] || 'bg-slate-800 text-slate-400';

            return (
              <div
                key={rc.id}
                onClick={() => setSelectedCaseId(rc.id)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${stateColors}`}>
                    {rc.lifecycle_state.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {(rc.case_type || 'takedown').replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-slate-200 line-clamp-1 mb-1">
                  {rc.draft_subject || rc.target_provider}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>To: <strong className="text-slate-300">{rc.target_provider}</strong></span>
                  <span className="text-cyan-400 font-semibold">Inspect &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail & Timeline Column */}
        <div className="lg:col-span-7">
          {activeCase && (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 space-y-6 sticky top-4">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                    Target Provider: {activeCase.target_provider}
                  </span>
                  <h2 className="text-base font-bold text-slate-100 mt-1">
                    {activeCase.draft_subject || 'Response Notice Draft'}
                  </h2>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-md font-semibold font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {activeCase.lifecycle_state}
                </span>
              </div>

              {/* Takedown Draft Body */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Draft Notice Content
                </span>
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
                  {activeCase.draft_body || 'No draft content specified.'}
                </div>
              </div>

              {/* Workflow Actions */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Governance Action
                </span>
                <ResponseCaseActions
                  caseId={activeCase.id}
                  lifecycleState={activeCase.lifecycle_state}
                  onApprove={handleApprove}
                  onDispatch={handleDispatch}
                  onResolve={handleResolve}
                />
              </div>

              {/* State Machine Timeline */}
              <div className="pt-4 border-t border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-3">
                  Workflow State Machine
                </span>
                <ResponseCaseTimeline
                  responseCase={{
                    lifecycle_state: activeCase.lifecycle_state,
                    created_at: activeCase.created_at,
                    drafted_by: activeCase.drafted_by,
                    approved_by: activeCase.approved_by,
                    approved_at: activeCase.approved_at,
                    dispatched_at: activeCase.dispatched_at,
                    resolved_at: activeCase.resolved_at,
                    target_provider: activeCase.target_provider,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
