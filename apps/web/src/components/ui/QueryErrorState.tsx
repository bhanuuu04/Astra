'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface QueryErrorStateProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function QueryErrorState({ title, message, onRetry, compact = false }: QueryErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex ${compact ? 'items-center' : 'items-start'} gap-3 rounded-xl border border-rose-200 bg-rose-50/80 ${compact ? 'p-3' : 'p-4 sm:p-5'}`}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-rose-700 ring-1 ring-rose-200">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-rose-950">{title}</p>
        <p className="mt-1 text-sm leading-5 text-rose-800">
          {message || 'The service did not return this data. Try again when the connection is available.'}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-900 transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}
