'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Send, 
  RefreshCw, 
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { 
  listResponseCases, 
  approveResponseCase, 
  dispatchResponseCase, 
  resolveResponseCase, 
  createResponseDraft,
  listFindings,
  type Finding,
  type ResponseCase 
} from '@/lib/api';
import { ResponseCaseTimeline } from '@/components/responses/ResponseCaseTimeline';
import { ResponseCaseActions } from '@/components/responses/ResponseCaseActions';
import { Button } from '@/components/ui/button';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { useDemoSafe } from '@/providers/DemoProvider';

export function ResponseCasesView() {
  const queryClient = useQueryClient();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string>('');
  const [targetProvider, setTargetProvider] = useState('cloudflare_abuse');

  const demo = useDemoSafe();
  const isDemoMode = demo?.isDemoMode ?? false;

  const { data, isLoading: apiLoading, error: casesError, refetch: refetchCases } = useQuery({
    queryKey: ['response_cases'],
    queryFn: () => listResponseCases(),
    enabled: !isDemoMode,
  });

  const { data: findingsData, isLoading: findingsLoading, isError: findingsError, refetch: refetchFindings } = useQuery({
    queryKey: ['response_draft_findings'],
    queryFn: () => listFindings({ limit: 50, offset: 0 }),
    enabled: !isDemoMode,
  });

  const demoDisplayCases: ResponseCase[] = (demo?.responseCases ?? []).map((rc, idx) => ({
    id: rc.action_id,
    tenant_id: 'demo-tenant-bytexl-2026',
    finding_id: 'demo-sight-002',
    campaign_cluster_id: rc.campaign_id,
    lifecycle_state: (idx === 0 ? 'approved' : idx === 1 ? 'submitted' : 'resolved') as any,
    target_provider: rc.drafts[0]?.recipient_name || 'Cloudflare Abuse Team',
    case_type: 'infringement_takedown',
    draft_recipient: rc.drafts[0]?.contact_email || 'abuse@cloudflare.com',
    draft_subject: rc.drafts[0]?.subject || 'Abuse Report: Phishing Infrastructure',
    draft_body: rc.drafts[0]?.body_text || 'Formal abuse complaint and evidence package.',
    drafted_by: 'Demo Security Analyst',
    approved_by: 'Automated Rule Engine',
    created_at: rc.created_at,
  }));

  const cases = isDemoMode ? demoDisplayCases : (data?.cases || []);
  const displayCases: ResponseCase[] = cases;
  const isLoading = isDemoMode ? false : apiLoading;

  const eligibleFindings: Finding[] = (findingsData?.findings || []).filter((finding) => finding.raw_evidence_id && finding.triage_status === 'confirmed_threat');
  const selectedFinding = eligibleFindings.find((finding) => finding.id === selectedFindingId) || eligibleFindings[0];

  const activeCase = displayCases.find(c => c.id === selectedCaseId) || displayCases[0];

  const handleApprove = async (id: string) => {
    setActionError(null);
    if (isDemoMode) {
      demo?.triggerTakedown(id);
      demo?.addSimulatedAction('approve_case');
      setActionSuccess('Simulated case approved. Platform takedown dispatched.');
      setTimeout(() => setActionSuccess(null), 4000);
      return;
    }
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
    if (isDemoMode) {
      demo?.addSimulatedAction('dispatch_case');
      setActionSuccess('Simulated dispatch to destination provider completed.');
      setTimeout(() => setActionSuccess(null), 4000);
      return;
    }
    try {
      await dispatchResponseCase(id);
      setActionSuccess('Response case dispatched to destination provider.');
      setTimeout(() => setActionSuccess(null), 4000);
      await queryClient.invalidateQueries({ queryKey: ['response_cases'] });
    } catch (err: any) {
      setActionError(err.message || 'Failed to dispatch response case.');
    }
  };

  const handleResolve = async (id: string) => {
    setActionError(null);
    if (isDemoMode) {
      demo?.addSimulatedAction('resolve_case');
      setActionSuccess('Simulated case marked resolved.');
      setTimeout(() => setActionSuccess(null), 4000);
      return;
    }
    try {
      await resolveResponseCase(id, 'Case verified and resolved by security analyst.');
      setActionSuccess('Response case resolved successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
      await queryClient.invalidateQueries({ queryKey: ['response_cases'] });
    } catch (err: any) {
      setActionError(err.message || 'Failed to resolve response case.');
    }
  };

  const handleCreateDraft = async () => {
    if (!selectedFinding) {
      setActionError('Select an eligible finding before generating a draft.');
      return;
    }
    setActionError(null);
    try {
      const created = await createResponseDraft({
        finding_id: selectedFinding.id,
        target_provider: targetProvider,
      });
      if (created) {
        setSelectedCaseId(created.id);
        setActionSuccess(`Response draft created for ${targetProvider.replace(/_/g, ' ')}.`);
        setTimeout(() => setActionSuccess(null), 4000);
        await queryClient.invalidateQueries({ queryKey: ['response_cases'] });
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to create response draft.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-[#e3e2e0] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-[#0f7b6c]">
            <Send className="h-3.5 w-3.5" /> Human-Governed Remediation
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#37352f] sm:text-3xl">Response &amp; Takedown Cases</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#787774]">
            Strict human governance state machine for evidence-backed takedown notices, provider communications, and incident resolution.
          </p>
        </div>

        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['response_cases'] })}
          className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-[#e3e2e0] bg-white px-3.5 text-xs font-medium text-[#37352f] shadow-xs hover:bg-[#f7f6f3] transition cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Cases</span>
        </button>
      </header>

      {/* Action Notification Banners */}
      {actionSuccess && (
        <div className="rounded-[6px] border border-[#0f7b6c]/30 bg-[#0f7b6c]/10 px-4 py-3 text-xs font-medium text-[#0f7b6c] shadow-xs flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#0f7b6c]" />{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-[#0f7b6c] hover:underline text-xs font-semibold cursor-pointer">Dismiss</button>
        </div>
      )}
      {actionError && (
        <div className="rounded-[6px] border border-[#eb5757]/30 bg-[#eb5757]/10 px-4 py-3 text-xs font-medium text-[#eb5757] shadow-xs flex items-center justify-between">
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#eb5757]" />{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-[#eb5757] hover:underline text-xs font-semibold cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Main Layout */}
      <div data-tour="response-cases" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List Column */}
        <div className="lg:col-span-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#787774] mb-2">
            Active Response Cases ({displayCases.length})
          </p>

          {casesError && <QueryErrorState compact title="Response cases are unavailable" message="Retry to reload the case queue." onRetry={() => { void refetchCases(); }} />}
          {isLoading ? (
            <p className="rounded-[6px] border border-[#e3e2e0] bg-white p-4 text-xs text-[#787774] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">Loading response cases…</p>
          ) : displayCases.length === 0 && !casesError && (
            <div className="rounded-[8px] border border-[#e3e2e0] bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <ShieldCheck className="w-8 h-8 text-[#0f7b6c] mx-auto" />
              <p className="text-sm font-semibold text-[#37352f]">No active response cases</p>
              <p className="text-xs text-[#787774]">Confirmed threat findings can be escalated into takedown drafts using the tool below.</p>
            </div>
          )}

          {displayCases.map((rc) => {
            const isSelected = activeCase?.id === rc.id;
            const stateColors = {
              draft: 'bg-[#f7f6f3] text-[#787774] border-[#e3e2e0]',
              pending_approval: 'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/30',
              approved: 'bg-[#0f7b6c]/10 text-[#0f7b6c] border-[#0f7b6c]/30',
              submitted: 'bg-[#2eaadc]/10 text-[#2eaadc] border-[#2eaadc]/30',
              acknowledged: 'bg-[#37352f]/10 text-[#37352f] border-[#37352f]/20',
              resolved: 'bg-[#0f7b6c]/10 text-[#0f7b6c] border-[#0f7b6c]/30',
              rejected: 'bg-[#eb5757]/10 text-[#eb5757] border-[#eb5757]/30',
            }[rc.lifecycle_state] || 'bg-[#f7f6f3] text-[#787774] border-[#e3e2e0]';

            return (
              <div
                key={rc.id}
                onClick={() => setSelectedCaseId(rc.id)}
                className={`p-4 rounded-[8px] border transition cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
                  isSelected
                    ? 'bg-[#f7f6f3] border-[#0f7b6c] shadow-[inset_3px_0_0_#0f7b6c]'
                    : 'bg-white border-[#e3e2e0] hover:border-[#9b9a97] hover:bg-[#f7f6f3]/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase tracking-wider border ${stateColors}`}>
                    {rc.lifecycle_state.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-mono text-[#787774] capitalize">
                    {(rc.case_type || 'takedown').replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-[#37352f] line-clamp-1 mb-1">
                  {rc.draft_subject || rc.target_provider}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-[#787774] mt-2">
                  <span>To: <strong className="text-[#37352f]">{rc.target_provider}</strong></span>
                  <span className="text-[#0f7b6c] font-semibold inline-flex items-center gap-1">Inspect <ArrowRight className="w-3 h-3" /></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail & Timeline Column */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-[8px] border border-[#e3e2e0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-semibold text-[#37352f]">Create Response Draft from Finding Evidence</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#787774]">Only analyst-confirmed findings with persisted evidence can be used. Draft notices require explicit approval before dispatch.</p>
            {findingsError ? (
              <div className="mt-3"><QueryErrorState compact title="Eligible findings could not be loaded" message="Draft creation is paused until evidence-backed findings are available." onRetry={() => { void refetchFindings(); }} /></div>
            ) : findingsLoading ? (
              <p className="mt-3 text-xs text-[#787774]" role="status">Loading evidence-backed findings…</p>
            ) : eligibleFindings.length > 0 ? (
              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <select value={selectedFinding?.id || ''} onChange={(event) => setSelectedFindingId(event.target.value)} className="min-w-0 flex-1 rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] px-3 py-2 text-xs text-[#37352f] font-medium focus:bg-white focus:border-[#0f7b6c] focus:outline-none">
                  {eligibleFindings.map((finding) => <option key={finding.id} value={finding.id}>{finding.surface}: {finding.target_identifier}</option>)}
                </select>
                <select value={targetProvider} onChange={(event) => setTargetProvider(event.target.value)} className="rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] px-3 py-2 text-xs text-[#37352f] font-medium focus:bg-white focus:border-[#0f7b6c] focus:outline-none">
                  <option value="meta_takedown">Meta abuse portal</option>
                  <option value="google_abuse">Google abuse portal</option>
                  <option value="cloudflare_abuse">Cloudflare abuse portal</option>
                  <option value="registrar_dmca">Domain registrar</option>
                </select>
                <Button onClick={handleCreateDraft} className="bg-[#0f7b6c] text-white hover:bg-[#0c6357] shadow-xs text-xs font-medium rounded-[6px]">Create Draft</Button>
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#787774] italic">No findings with stored evidence are currently available for drafting.</p>
            )}
          </div>

          {activeCase && (
            <div className="p-6 rounded-[8px] border border-[#e3e2e0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6 sticky top-4">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#e3e2e0]">
                <div>
                  <span className="text-xs font-mono text-[#787774] uppercase tracking-wider font-semibold">
                    Target Provider: {activeCase.target_provider}
                  </span>
                  <h2 className="text-base font-semibold text-[#37352f] mt-1">
                    {activeCase.draft_subject || 'Response Notice Draft'}
                  </h2>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-[4px] font-semibold font-mono uppercase bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20">
                  {activeCase.lifecycle_state.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Takedown Draft Body */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#787774]">
                  Draft Notice Content
                </span>
                <div className="p-3.5 rounded-[6px] bg-[#f7f6f3] border border-[#e3e2e0] text-xs font-mono text-[#37352f] leading-relaxed max-h-40 overflow-y-auto">
                  {activeCase.draft_body || 'No draft content specified.'}
                </div>
              </div>

              {/* Workflow Actions */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#787774] block mb-2">
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
              <div className="pt-4 border-t border-[#e3e2e0]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#787774] block mb-3">
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
