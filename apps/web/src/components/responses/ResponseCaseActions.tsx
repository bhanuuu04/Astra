'use client';

import React, { useState } from 'react';
import { Check, Send, XCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResponseCaseActionsProps {
  caseId: string;
  lifecycleState: string;
  onApprove: (id: string) => Promise<void>;
  onDispatch: (id: string) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
}

export function ResponseCaseActions({
  caseId,
  lifecycleState,
  onApprove,
  onDispatch,
  onResolve,
  onReject,
}: ResponseCaseActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await action();
    } catch (err: any) {
      setError(err?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {/* Draft state: Show approve/reject */}
        {lifecycleState === 'draft' && (
          <>
            <Button
              onClick={() => handleAction(() => onApprove(caseId))}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Approve for Dispatch
            </Button>
            {onReject && (
              <Button
                onClick={() => handleAction(() => onReject(caseId))}
                disabled={loading}
                variant="outline"
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject Draft
              </Button>
            )}
          </>
        )}

        {/* Approved state: Show dispatch */}
        {lifecycleState === 'approved' && (
          <div className="space-y-2">
            <p className="max-w-xl text-xs leading-relaxed text-slate-400">Submit the approved notice through the provider’s official portal first. Then record that submission here; ASTRA does not send it.</p>
            <Button
              onClick={() => handleAction(() => onDispatch(caseId))}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              I Submitted via Provider Portal
            </Button>
          </div>
        )}

        {/* Submitted or Acknowledged: Show resolve */}
        {(lifecycleState === 'submitted' || lifecycleState === 'acknowledged') && (
          <Button
            onClick={() => handleAction(() => onResolve(caseId))}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Record Outcome & Close Case
          </Button>
        )}

        {/* Resolved state */}
        {lifecycleState === 'resolved' && (
          <div className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Case Resolved
          </div>
        )}

        {/* Rejected state */}
        {lifecycleState === 'rejected' && (
          <div className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            Draft Rejected
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-400 font-mono mt-1">⚠️ {error}</p>
      )}
    </div>
  );
}
