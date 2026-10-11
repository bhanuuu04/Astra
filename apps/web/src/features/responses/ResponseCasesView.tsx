'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Send, 
  RefreshCw, 
  CheckCircle2
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

export function ResponseCasesView() {
  const queryClient = useQueryClient();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string>('');
  const [targetProvider, setTargetProvider] = useState('cloudflare_abuse');

  const { data, isLoading, error: casesError } = useQuery({
    queryKey: ['response_cases'],
    queryFn: () => listResponseCases(),
  });

  const { data: findingsData } = useQuery({
    queryKey: ['response_draft_findings'],
    queryFn: () => listFindings({ limit: 50, offset: 0 }),
  });

  const cases = data?.cases || [];
  const displayCases: ResponseCase[] = cases;
  const eligibleFindings: Finding[] = (findingsData?.findings || []).filter((finding) => finding.raw_evidence_id && finding.triage_status === 'confirmed_threat');
  const selectedFinding = eligibleFindings.find((finding) => finding.id === selectedFindingId) || eligibleFindings[0];

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
      setActionSuccess('Manual portal submission recorded. ASTRA did not send the notice.');
      setTimeout(() => setActionSuccess(null), 4000);
      await queryClient.invalidateQueries({ queryKey: ['response_cases'] });
    } catch (err: any) {
      setActionError(err.message || 'Failed to dispatch response case.');
    }
  };

  const handleResolve = async (id: string) => {
    setActionError(null);
    const notes = window.prompt('Record the provider or analyst observed outcome (at least 10 characters):');
    if (!notes) return;
    const reference = window.prompt('Provider ticket/reference ID (optional):') || undefined;
    try {
      await resolveResponseCase(id, notes, reference);
      setActionSuccess('Recorded analyst-provided outcome.');
      setTimeout(() => setActionSuccess(null), 4000);
      await queryClient.invalidateQueries({ queryKey: ['response_cases'] });
    } catch (err: any) {
      setActionError(err.message || 'Failed to resolve response case.');
    }
  };

  const handleCreateDraft = async () => {
    if (!selectedFinding) return;
    setActionError(null);
    try {
      const created = await createResponseDraft({
        finding_id: selectedFinding.id,
        target_provider: targetProvider,
        case_type: 'suspected_impersonation_or_abuse',
        draft_subject: `Evidence review: ${selectedFinding.target_identifier}`,
        draft_body: [
          'Review this report and validate the source evidence before submission.',
          `Target: ${selectedFinding.target_identifier}`,
          `Surface: ${selectedFinding.surface}`,
          `Observed at: ${selectedFinding.observed_at}`,
          `ASTRA triage status: ${selectedFinding.triage_status}; heuristic priority: ${selectedFinding.triage_priority}.`,
          'This draft is advisory. Confirm the applicable provider process and make any required edits before manually submitting.',
        ].join('\n'),
        submission_payload: { source_finding_id: selectedFinding.id, source_mode: selectedFinding.data_mode },
        evidence_manifest: [selectedFinding.raw_evidence_id!],
      });
      if (created) {
        setSelectedCaseId(created.id);
        setActionSuccess('Evidence-linked response draft created.');
        await queryClient.invalidateQueries({ queryKey: ['response_cases'] });
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to create response draft.');
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

          {casesError && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">Could not load response cases. Check the API connection and retry.</p>}
          {isLoading ? (
            <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">Loading response cases…</p>
          ) : displayCases.length === 0 && !casesError && (
            <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs leading-relaxed text-slate-400">No response cases have been created for this organization.</p>
          )}

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
          <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Create a response draft from finding evidence</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Only analyst-confirmed findings with persisted evidence can be used. The draft is editable and ASTRA will not submit it.</p>
            {eligibleFindings.length > 0 ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <select value={selectedFinding?.id || ''} onChange={(event) => setSelectedFindingId(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200">
                  {eligibleFindings.map((finding) => <option key={finding.id} value={finding.id}>{finding.surface}: {finding.target_identifier}</option>)}
                </select>
                <select value={targetProvider} onChange={(event) => setTargetProvider(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200">
                  <option value="meta_takedown">Meta abuse portal</option>
                  <option value="google_abuse">Google abuse portal</option>
                  <option value="cloudflare_abuse">Cloudflare abuse portal</option>
                  <option value="registrar_dmca">Domain registrar</option>
                </select>
                <Button onClick={handleCreateDraft} className="bg-cyan-600 text-white hover:bg-cyan-500">Create Draft</Button>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">No findings with stored evidence are available yet.</p>
            )}
          </div>
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
