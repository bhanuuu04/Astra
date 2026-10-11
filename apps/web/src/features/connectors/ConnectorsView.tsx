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
  Activity,
  Key,
  X,
  Lock,
  Play,
  Check
} from 'lucide-react';
import { 
  listConnectors, 
  checkConnectorHealth, 
  createConnector, 
  syncConnector, 
  deleteConnector, 
  type Connector 
} from '@/lib/api';
import { ConnectorStatusCard, type ConnectorData } from '@/components/connectors/ConnectorStatusCard';

const CONNECTOR_PRESETS: Record<string, { name: string; defaultKey: string; keyLabel: string; keyPlaceholder: string; extraField?: string }> = {
  virustotal: {
    name: 'VirusTotal URL Reputation Enrichment',
    defaultKey: 'api_key',
    keyLabel: 'VirusTotal API Key (v3)',
    keyPlaceholder: 'Enter a real VirusTotal API key',
  },
  meta_graph: {
    name: 'Meta / Instagram Graph API',
    defaultKey: 'access_token',
    keyLabel: 'Page Access Token',
    keyPlaceholder: 'Enter an authorized Meta access token',
    extraField: 'app_secret',
  },
  google_play: {
    name: 'Google Play Reviews (owned apps)',
    defaultKey: 'service_account_json',
    keyLabel: 'Service Account JSON / Credentials',
    keyPlaceholder: 'Paste service-account JSON with Android Publisher access',
  },
  youtube: {
    name: 'YouTube Brand Impersonation Scanner',
    defaultKey: 'api_key',
    keyLabel: 'YouTube Data API v3 Key',
    keyPlaceholder: 'Enter a real YouTube Data API v3 key',
  },
  telegram_bot: {
    name: 'Telegram Bot Updates',
    defaultKey: 'bot_token',
    keyLabel: 'Telegram Bot Token',
    keyPlaceholder: 'Enter a real Telegram bot token',
  },
};

const supportsPullSync = (connector: ConnectorData) =>
  !['meta_graph', 'meta_graph_api', 'meta_webhook', 'instagram'].includes(connector.connector_type.toLowerCase());

export function ConnectorsView() {
  const queryClient = useQueryClient();
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [selectedType, setSelectedType] = useState<string>('virustotal');
  const [connectorName, setConnectorName] = useState<string>(CONNECTOR_PRESETS['virustotal'].name);
  const [primaryCredential, setPrimaryCredential] = useState<string>('');
  const [secondaryCredential, setSecondaryCredential] = useState<string>('');
  const [rateLimit, setRateLimit] = useState<number>(60);

  const { data, isLoading } = useQuery({
    queryKey: ['connectors'],
    queryFn: () => listConnectors(),
    refetchInterval: 30000,
  });

  const connectors = data?.connectors || [];

  const handleHealthCheck = async (id: string) => {
    setCheckingId(id);
    try {
      const res = await checkConnectorHealth(id);
      await queryClient.invalidateQueries({ queryKey: ['connectors'] });
      if (res?.status === 'active') {
        setNotification({ message: 'Connector credentials verified and active!', type: 'success' });
      } else {
        setNotification({ message: `Health check notice: ${res?.error_message || 'Status degraded'}`, type: 'error' });
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'Health check failed', type: 'error' });
    } finally {
      setCheckingId(null);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await syncConnector(id);
      await queryClient.invalidateQueries({ queryKey: ['connectors'] });
      await queryClient.invalidateQueries({ queryKey: ['findings'] });
      setNotification({
        message: res.error_message
          ? `Partial sync: ${res.synced_findings_count} records ingested. ${res.error_message}`
          : `Provider sync complete. ${res.synced_findings_count} source records ingested for analyst review.`,
        type: res.status === 'degraded' ? 'error' : 'success',
      });
    } catch (err: any) {
      setNotification({ message: err.message || 'Sync failed', type: 'error' });
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this connector? Credentials in the vault will be permanently deleted.')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteConnector(id);
      await queryClient.invalidateQueries({ queryKey: ['connectors'] });
      setNotification({ message: 'Connector removed successfully.', type: 'success' });
    } catch (err: any) {
      setNotification({ message: err.message || 'Deletion failed', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenConfigure = (template?: ConnectorData) => {
    if (template) {
      const cType = template.connector_type.toLowerCase();
      const matchedType = CONNECTOR_PRESETS[cType] ? cType : 'virustotal';
      setSelectedType(matchedType);
      setConnectorName(template.name.replace(' (Template)', ''));
    } else {
      setSelectedType('virustotal');
      setConnectorName(CONNECTOR_PRESETS['virustotal'].name);
    }
    setPrimaryCredential('');
    setSecondaryCredential('');
    setRateLimit(60);
    setModalOpen(true);
  };

  const handleCreateConnector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectorName.trim()) return;

    const preset = CONNECTOR_PRESETS[selectedType];
    const authConfig: Record<string, string> = {};
    if (primaryCredential.trim()) {
      authConfig[preset.defaultKey] = primaryCredential.trim();
    }
    if (preset.extraField && secondaryCredential.trim()) {
      authConfig[preset.extraField] = secondaryCredential.trim();
    }

    try {
      const created = await createConnector({
        connector_type: selectedType,
        name: connectorName.trim(),
        auth_config: Object.keys(authConfig).length > 0 ? authConfig : undefined,
        rate_limit_rpm: rateLimit,
      });

      // Auto run health check if credentials were provided
      if (Object.keys(authConfig).length > 0) {
        await checkConnectorHealth(created.id);
      }

      await queryClient.invalidateQueries({ queryKey: ['connectors'] });
      setModalOpen(false);
      setNotification({
        message: `Connector '${created.name}' created and encrypted in secret vault!`,
        type: 'success',
      });
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to create connector', type: 'error' });
    }
  };

  // Default templates when no connectors have been configured yet
  const displayConnectors: ConnectorData[] = connectors.length > 0 
    ? connectors 
    : [
        {
          id: 'conn-virustotal-template',
          name: 'VirusTotal Intelligence API (Template)',
          connector_type: 'virustotal',
          status: 'unconfigured',
          rate_limit_rpm: 60,
          error_message: 'Awaiting VirusTotal API key configuration in secret vault.',
        },
        {
          id: 'conn-meta-template',
          name: 'Meta / Instagram Graph API (Template)',
          connector_type: 'meta_graph',
          status: 'unconfigured',
          rate_limit_rpm: 120,
          error_message: 'Awaiting Page Access Token and App Secret configuration.',
        },
        {
          id: 'conn-play-template',
          name: 'Google Play Store Catalog Watcher (Template)',
          connector_type: 'google_play',
          status: 'unconfigured',
          rate_limit_rpm: 30,
          error_message: 'Awaiting Android publisher service account credentials.',
        },
        {
          id: 'conn-youtube-template',
          name: 'YouTube Impersonation Scanner (Template)',
          connector_type: 'youtube',
          status: 'unconfigured',
          rate_limit_rpm: 60,
          error_message: 'Awaiting YouTube Data API v3 key configuration.',
        },
        {
          id: 'conn-telegram-template',
          name: 'Telegram Scam Channel Monitor (Template)',
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
      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-[6px] border flex items-center justify-between text-xs font-medium ${
          notification.type === 'success'
            ? 'bg-[#0f7b6c]/10 border-[#0f7b6c]/30 text-[#0f7b6c]'
            : 'bg-[#eb5757]/10 border-[#eb5757]/30 text-[#eb5757]'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0f7b6c]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#eb5757]" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="hover:opacity-70 p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-[#e3e2e0] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-[#0f7b6c]">
            <Database className="h-3.5 w-3.5" /> Ingestion Infrastructure & Secret Vault
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#37352f] sm:text-3xl">Authorized Data Connectors</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#787774]">
            Configure authorized providers and run supported collections on demand. A saved API key does not start continuous monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['connectors'] })}
            className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-[#e3e2e0] bg-white px-3 text-xs font-medium text-[#37352f] hover:bg-[#f7f6f3] transition cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleOpenConfigure()}
            className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-[#0f7b6c] px-3.5 text-xs font-semibold text-white hover:bg-[#0c6357] transition cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Configure New Connector</span>
          </button>
        </div>
      </header>

      {/* Unconfigured State Banner */}
      {isTemplateMode && (
        <div className="rounded-[8px] border border-[#d97706]/30 bg-[#d97706]/10 p-4 text-xs text-[#d97706]">
          <div className="flex items-center gap-2 font-semibold text-[#d97706]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#d97706]" />
            <span>Unconfigured Ingestion Pipelines (Template Mode)</span>
          </div>
          <p className="mt-1 text-[#787774] leading-relaxed">
            No provider connections are configured. Configure credentials, run a live health check, then use on-demand sync where the provider exposes an authorized read API. ASTRA does not run background polling yet.
          </p>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="p-4 rounded-[8px] border border-[#e3e2e0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-xs text-[#787774] font-medium">Configured Connectors</p>
          <p className="mt-1 text-2xl font-bold font-mono text-[#37352f]">{connectors.length}</p>
        </div>
        <div className="p-4 rounded-[8px] border border-[#e3e2e0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-xs text-[#787774] font-medium">Active & Healthy</p>
          <p className="mt-1 text-2xl font-bold font-mono text-[#0f7b6c]">{activeCount}</p>
        </div>
        <div className="p-4 rounded-[8px] border border-[#e3e2e0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-xs text-[#787774] font-medium">Degraded / Attention</p>
          <p className="mt-1 text-2xl font-bold font-mono text-[#d97706]">{degradedCount}</p>
        </div>
        <div className="p-4 rounded-[8px] border border-[#e3e2e0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-xs text-[#787774] font-medium">Secret Storage</p>
          <p className="mt-1 text-xs font-semibold text-[#0f7b6c] uppercase mt-2 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#0f7b6c]" /> AES-Authenticated Vault
          </p>
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
            onSync={supportsPullSync(connector) ? handleSync : undefined}
            isSyncing={syncingId === connector.id}
            onConfigure={handleOpenConfigure}
            onDelete={handleDelete}
            isDeleting={deletingId === connector.id}
          />
        ))}
      </div>

      {/* Configuration Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e3e2e0] rounded-[8px] max-w-lg w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#e3e2e0]">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0f7b6c]" />
                <h3 className="text-base font-semibold text-[#37352f]">Configure Secret Vault Connector</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#787774] hover:text-[#37352f] p-1 rounded-[4px] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateConnector} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#37352f] mb-1.5">
                  Connector Source Platform
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSelectedType(next);
                    setConnectorName(CONNECTOR_PRESETS[next]?.name || next);
                  }}
                  className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] focus:outline-none focus:bg-white focus:border-[#0f7b6c]"
                >
                  <option value="virustotal">VirusTotal URL Reputation Enrichment</option>
                  <option value="meta_graph">Meta / Instagram Graph API (authorized account only)</option>
                  <option value="google_play">Google Play Reviews (developer account apps)</option>
                  <option value="youtube">YouTube Data API v3</option>
                  <option value="telegram_bot">Telegram Bot API</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#37352f] mb-1.5">
                  Connector Display Name
                </label>
                <input
                  type="text"
                  value={connectorName}
                  onChange={(e) => setConnectorName(e.target.value)}
                  required
                  placeholder="e.g. Production Threat Feed"
                  className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] focus:outline-none focus:bg-white focus:border-[#0f7b6c] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#37352f] mb-1.5 flex items-center justify-between">
                  <span>{CONNECTOR_PRESETS[selectedType]?.keyLabel || 'Authentication Key'}</span>
                  <span className="text-[10px] text-[#0f7b6c] font-mono">Encrypted before storage</span>
                </label>
                <input
                  type="password"
                  value={primaryCredential}
                  onChange={(e) => setPrimaryCredential(e.target.value)}
                  placeholder={CONNECTOR_PRESETS[selectedType]?.keyPlaceholder || 'Enter provider credential'}
                  className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] focus:outline-none focus:bg-white focus:border-[#0f7b6c] font-mono"
                />
              </div>

              {CONNECTOR_PRESETS[selectedType]?.extraField && (
                <div>
                  <label className="block text-xs font-semibold text-[#37352f] mb-1.5">
                    App Secret / Secondary Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={secondaryCredential}
                    onChange={(e) => setSecondaryCredential(e.target.value)}
                    placeholder="Enter secondary secret..."
                    className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] focus:outline-none focus:bg-white focus:border-[#0f7b6c] font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#37352f] mb-1.5">
                    Rate Limit (Req / Min)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={rateLimit}
                    onChange={(e) => setRateLimit(Number(e.target.value))}
                    className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] focus:outline-none focus:bg-white focus:border-[#0f7b6c] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#37352f] mb-1.5">
                    Live connector note
                  </label>
                  <p className="text-[11px] text-[#787774] mt-2 leading-tight">
                    Sync collects only provider-authorized records. Mock/test keys are rejected.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#e3e2e0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white hover:bg-[#f7f6f3] border border-[#e3e2e0] text-[#37352f] rounded-[6px] text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#0f7b6c] hover:bg-[#0c6357] text-white rounded-[6px] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Encrypt & Save Connector</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e2e0] py-3 text-xs text-[#787774]">
        <span>Verified tenant isolation & cryptographic secret protection active</span>
        <span>Collection: analyst-triggered; no background schedule</span>
      </footer>
    </div>
  );
}
