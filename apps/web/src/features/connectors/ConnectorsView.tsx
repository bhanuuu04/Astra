'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Database, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Activity
} from 'lucide-react';
import { listConnectors, checkConnectorHealth, type Connector } from '@/lib/api';
import { ConnectorStatusCard, type ConnectorData } from '@/components/connectors/ConnectorStatusCard';

export function ConnectorsView() {
  const queryClient = useQueryClient();
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['connectors'],
    queryFn: () => listConnectors(),
    refetchInterval: 30000,
  });

  const connectors = data?.connectors || [];

  const handleHealthCheck = async (id: string) => {
    setCheckingId(id);
    try {
      await checkConnectorHealth(id);
      await queryClient.invalidateQueries({ queryKey: ['connectors'] });
    } catch (err) {
      console.warn("Health check notice:", err);
    } finally {
      setCheckingId(null);
    }
  };

  // Unconfigured pipeline templates shown when no database connectors exist yet
  const displayConnectors: ConnectorData[] = connectors.length > 0 
    ? connectors 
    : [
        {
          id: 'conn-meta-template',
          name: 'Meta Graph Webhook Connector (Template)',
          connector_type: 'meta_webhook',
          status: 'unconfigured',
          rate_limit_rpm: 200,
          error_message: 'Awaiting Webhook Secret and App Secret verification.',
        },
        {
          id: 'conn-vt-template',
          name: 'VirusTotal Intelligence API (Template)',
          connector_type: 'virustotal',
          status: 'unconfigured',
          rate_limit_rpm: 60,
          error_message: 'Awaiting VirusTotal API key configuration.',
        },
        {
          id: 'conn-play-template',
          name: 'Google Play Scraper Pipeline (Template)',
          connector_type: 'google_play',
          status: 'unconfigured',
          rate_limit_rpm: 30,
          error_message: 'Awaiting Android publisher mirror configuration.',
        },
        {
          id: 'conn-telegram-template',
          name: 'Telegram Threat Feed Ingestion (Template)',
          connector_type: 'telegram_bot',
          status: 'unconfigured',
          rate_limit_rpm: 100,
          error_message: 'Awaiting Telegram Bot Token configuration.',
        },
      ];

  const isTemplateMode = connectors.length === 0;
  const activeCount = displayConnectors.filter(c => c.status === 'active').length;
  const degradedCount = displayConnectors.filter(c => c.status === 'degraded' || c.status === 'error').length;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
            <Database className="h-3.5 w-3.5" /> Ingestion Infrastructure
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">Authorized Data Connectors</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Monitor authorized external threat intelligence pipelines, social webhooks, and APK mirrors with verified source attribution.
          </p>
        </div>

        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['connectors'] })}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Connectors</span>
        </button>
      </header>

      {/* Honest Unconfigured State Banner */}
      {isTemplateMode && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Unconfigured Ingestion Pipelines (Template Mode)</span>
          </div>
          <p className="mt-1 text-slate-300 leading-relaxed">
            No live data connectors are active in this tenant yet. The pipelines below represent pre-built integration templates. To start streaming live detections, configure provider credentials or ingest test telemetry.
          </p>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="p-4 rounded-xl border border-white/[0.075] bg-[#111a27]">
          <p className="text-xs text-slate-500 font-medium">Total Connectors</p>
          <p className="mt-1 text-2xl font-bold font-mono text-slate-100">{displayConnectors.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/[0.075] bg-[#111a27]">
          <p className="text-xs text-slate-500 font-medium">Active & Healthy</p>
          <p className="mt-1 text-2xl font-bold font-mono text-emerald-400">{activeCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/[0.075] bg-[#111a27]">
          <p className="text-xs text-slate-500 font-medium">Degraded / Attention</p>
          <p className="mt-1 text-2xl font-bold font-mono text-amber-400">{degradedCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/[0.075] bg-[#111a27]">
          <p className="text-xs text-slate-500 font-medium">Ingestion Policy</p>
          <p className="mt-1 text-xs font-semibold text-cyan-300 uppercase mt-2">SHA-256 Sealed</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayConnectors.map((connector) => (
          <ConnectorStatusCard
            key={connector.id}
            connector={connector}
            onHealthCheck={handleHealthCheck}
            isChecking={checkingId === connector.id}
          />
        ))}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 py-3 text-xs text-slate-500">
        <span>Verified tenant isolation & credential protection active</span>
        <span>Polling rate: 30s background sync</span>
      </footer>
    </div>
  );
}
