'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe2,
  LoaderCircle,
  Play,
  Radar,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { getThreatScanStatus, startThreatScan, ThreatScanStatus } from '@/lib/api';

interface ThreatScanHUDProps {
  brandId?: string;
  brandName: string;
  brandDomain: string;
}

export function ThreatScanHUD({ brandId, brandName, brandDomain }: ThreatScanHUDProps) {
  const queryClient = useQueryClient();
  const [showLogs, setShowLogs] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Poll scan status every 2 seconds while active
  const { data: scanState, isError: statusError, refetch } = useQuery<ThreatScanStatus | null>({
    queryKey: ['threat-scan-status', brandId],
    queryFn: () => getThreatScanStatus(brandId),
    refetchInterval: (query) => {
      const state = query.state.data;
      return state?.is_scanning ? 2000 : 15000;
    },
  });

  const scanMutation = useMutation({
    mutationFn: () => startThreatScan(brandId),
    onSuccess: (data) => {
      if (data?.eta_seconds) {
        setCountdown(data.eta_seconds);
      }
      queryClient.invalidateQueries({ queryKey: ['threat-scan-status'] });
    },
  });

  // Countdown clock effect
  useEffect(() => {
    if (scanState?.is_scanning && scanState?.eta_seconds) {
      setCountdown(scanState.eta_seconds);
    } else if (!scanState?.is_scanning) {
      setCountdown(null);
    }
  }, [scanState?.is_scanning, scanState?.eta_seconds]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev && prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // When scan finishes, invalidate all dashboard data queries
  useEffect(() => {
    if (scanState?.status === 'completed' && !scanState?.is_scanning) {
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      queryClient.invalidateQueries({ queryKey: ['sightings'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    }
  }, [scanState?.status, scanState?.is_scanning, queryClient]);

  const isScanning = Boolean(scanState?.is_scanning || scanMutation.isPending);
  const progressPct = scanState?.progress_pct ?? 0;
  const stage = scanState?.stage ?? 'Perimeter Sentinel Standby';
  const stageIndex = scanState?.stage_index ?? 0;
  const totalStages = scanState?.total_stages ?? 4;
  const logs = scanState?.logs ?? [];
  const findingsCount = scanState?.findings_found ?? 0;
  const liveThreats = scanState?.live_threats ?? [];

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section className="overflow-hidden rounded-[8px] border border-[#e3e2e0] bg-white shadow-2xs transition-all">
      {/* Top Header */}
      <div className="flex flex-col gap-3 border-b border-[#e3e2e0] bg-[#faf9f8] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-7 w-7 items-center justify-center rounded-[6px] border ${
            isScanning
              ? 'border-cyan-300 bg-cyan-50 text-cyan-700 animate-pulse'
              : 'border-[#e3e2e0] bg-white text-[#0f7b6c]'
          }`}>
            <Radar className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#37352f]">
                {isScanning ? 'Analysis in progress' : 'Threat surface analysis'}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isScanning
                  ? 'border border-cyan-200 bg-cyan-50 text-cyan-800'
                  : 'border border-[#e3e2e0] bg-white text-[#0f7b6c]'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isScanning ? 'bg-cyan-600 animate-ping' : 'bg-[#0f7b6c]'}`} />
                {isScanning ? 'Running' : statusError ? 'Status unavailable' : scanState?.status || 'Not started'}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#787774]">
              {brandDomain ? <>Current scope: <strong className="font-semibold text-[#37352f]">{brandDomain}</strong>. Review each result and its evidence before triage.</> : <>Add and verify a brand domain to establish the analysis scope.</>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="inline-flex h-7 items-center gap-1.5 rounded-[6px] border border-[#e3e2e0] bg-white px-2.5 text-[11px] font-medium text-[#787774] shadow-2xs transition hover:bg-[#f7f6f3] hover:text-[#37352f]"
          >
            <Terminal className="h-3 w-3 text-[#9b9a97]" />
            <span>Telemetry Log ({logs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => scanMutation.mutate()}
            disabled={isScanning || !brandId}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0f766e] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                <span>Running…</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Run analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main HUD Body */}
      <div className="space-y-4 p-4 sm:p-5">
        {statusError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-950">
            <span>Analysis status is unavailable. Existing results remain available elsewhere in the workspace.</span>
            <button type="button" onClick={() => void refetch()} className="font-semibold underline underline-offset-2">Retry status</button>
          </div>
        )}
        {scanMutation.isError && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-900">
            {scanMutation.error instanceof Error ? scanMutation.error.message : 'Analysis could not be started. Check the API connection and try again.'}
          </div>
        )}

        {isScanning ? (
          /* SCANNING ACTIVE STATE */
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0f766e]">
                  Stage {stageIndex} of {totalStages}
                </span>
                <h3 className="text-sm font-bold text-[#37352f]">{stage}</h3>
              </div>

              {countdown !== null && (
                <div className="flex items-center gap-2 self-start rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] px-3 py-1 sm:self-auto">
                  <Clock3 className="h-3.5 w-3.5 text-[#0f7b6c]" />
                  <span className="text-xs text-[#787774]">Estimated time:</span>
                  <span className="font-mono text-xs font-bold text-[#37352f]">{formatCountdown(countdown)}</span>
                </div>
              )}
            </div>

            {/* Progress from the current backend job */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#787774]">
                <span>Analysis progress</span>
                <span className="font-mono font-bold text-[#37352f]">{progressPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0eee9]">
                <div
                  className="h-full rounded-full bg-[#0f7b6c] transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(progressPct, 5)}%` }}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Results to review</span>
                <p className="mt-1 font-mono text-lg font-semibold text-slate-900">{findingsCount}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Job status</span>
                <p className="mt-1 text-sm font-semibold capitalize text-slate-900">{scanState?.status || 'Running'}</p>
              </div>
            </div>
          </div>
        ) : (
          /* COMPLETED / STANDBY STATE */
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#f7f6f3] text-[#0f7b6c] border border-[#e3e2e0]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#37352f]">
                  {scanState?.status === 'completed' ? 'Analysis completed' : 'No completed analysis yet'}
                </h3>
                <p className="mt-0.5 text-xs text-[#787774]">
                  {scanState?.status === 'completed'
                    ? `${findingsCount} result${findingsCount === 1 ? '' : 's'} returned. Review source details and supporting evidence before deciding whether an item is a threat.`
                    : brandDomain
                      ? `Run an analysis for ${brandDomain}. Results depend on available sources and are not verified solely because a scan completed.`
                      : 'Enroll a brand and add its official domain before starting an analysis.'}
                </p>
              </div>
            </div>

            {liveThreats.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900">
                  {liveThreats.length} observed domain{liveThreats.length === 1 ? '' : 's'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Domains returned by the current analysis job */}
        {liveThreats.length > 0 && (
          <div className="mt-4 border-t border-[#e3e2e0] pt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#37352f]">
              Domains observed by this analysis:
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {liveThreats.map((t) => (
                <div
                  key={t.domain}
                  className="flex items-center gap-2 rounded-[6px] border border-rose-200 bg-rose-50/60 px-2.5 py-1 text-xs font-medium text-rose-900"
                >
                  <Globe2 className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <span className="font-semibold">{t.domain}</span>
                  <span className="font-mono text-[10px] text-rose-700">({t.ips[0]})</span>
                  <a
                    href={`https://${t.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-700 hover:text-rose-900 hover:underline ml-1"
                  >
                    Open ↗
                  </a>
                  <span className="text-rose-300">|</span>
                  <a
                    href={t.whois}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[11px] text-rose-700 hover:text-rose-900 hover:underline"
                  >
                    WHOIS ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXPANDABLE TELEMETRY TERMINAL */}
        {showLogs && (
          <div className="mt-4 rounded-[6px] border border-[#e3e2e0] bg-[#1e1e1e] p-3 text-xs font-mono text-[#d4d4d4] shadow-inner">
            <div className="mb-2 flex items-center justify-between border-b border-[#333] pb-1.5 text-[11px] text-[#888]">
              <span className="flex items-center gap-1.5">
                <Terminal className="h-3 w-3 text-emerald-400" />
                ASTRA OSINT Telemetry Stream
              </span>
              <span>{logs.length} events logged</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 text-[11px]">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`leading-relaxed ${
                    log.includes('[ALERT]')
                      ? 'text-amber-300 font-semibold'
                      : log.includes('verified') || log.includes('complete')
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
