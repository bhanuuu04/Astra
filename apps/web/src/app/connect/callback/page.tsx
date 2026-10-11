'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

function CallbackContent() {
  const searchParams = useSearchParams();
  const platform = searchParams.get('platform') || 'channel';
  const connectedAccountId = searchParams.get('connected_account_id');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Notify opener window of successful OAuth authorization
    if (window.opener) {
      try {
        window.opener.postMessage(
          {
            type: 'COMPOSIO_OAUTH_SUCCESS',
            platform,
            connectedAccountId,
            timestamp: Date.now(),
          },
          '*'
        );
      } catch (err) {
        console.warn('Failed to dispatch postMessage to opener:', err);
      }

      setClosing(true);
      const timer = setTimeout(() => {
        window.close();
      }, 1200);

      return () => clearTimeout(timer);
    } else {
      // If opened directly without popup, redirect back to guide or overview
      const timer = setTimeout(() => {
        window.location.href = '/guide';
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [platform, connectedAccountId]);

  return (
    <div className="w-full max-w-sm bg-white rounded-[10px] border border-[#e3e2e0] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] text-center space-y-4">
      <div className="w-12 h-12 rounded-[8px] bg-[#0f7b6c]/10 border border-[#0f7b6c]/20 text-[#0f7b6c] mx-auto flex items-center justify-center">
        <ShieldCheck className="w-6 h-6" />
      </div>

      <div>
        <h1 className="text-lg font-semibold text-[#37352f] tracking-tight">
          Authorization Confirmed
        </h1>
        <p className="text-xs text-[#787774] mt-1">
          Successfully linked official {platform.toUpperCase()} telemetry to ASTRA Sentinel.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-center gap-2 text-xs text-[#0f7b6c] font-medium">
        {closing ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Closing window...</span>
          </>
        ) : (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Synchronizing security tokens...</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConnectCallbackPage() {
  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#37352f] flex items-center justify-center p-6">
      <Suspense
        fallback={
          <div className="w-full max-w-sm bg-white rounded-[10px] border border-[#e3e2e0] p-6 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#0f7b6c] mx-auto" />
            <p className="text-xs text-[#787774]">Loading verification status...</p>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
