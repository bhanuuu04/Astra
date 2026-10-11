'use client';

import React from 'react';

interface DemoDataWarningProps {
  className?: string;
  message?: string;
}

export function DemoDataWarning({ 
  className = '',
  message = 'Demo data for testing purposes only'
}: DemoDataWarningProps) {
  return (
    <div className={`mt-2 p-2 rounded bg-amber-500/5 border border-amber-500/20 ${className}`}>
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-xs text-amber-400/80 flex-1">{message}</p>
      </div>
    </div>
  );
}
