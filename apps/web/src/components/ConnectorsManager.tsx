'use client';

import React, { useState } from 'react';
import { ConnectorCredential, SocialPlatform } from '@/types/threat';
import { 
  Link2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  Send, 
  Eye, 
  EyeOff, 
  Radio, 
  Sparkles 
} from 'lucide-react';

interface ConnectorsManagerProps {
  connectors: ConnectorCredential[];
  onUpdateConnector: (platform: SocialPlatform, credentials: any, enabled: boolean) => void;
  onInjectTestMessage: (platform: SocialPlatform, customContent?: string, customUsername?: string) => void;
}

export function ConnectorsManager({
  connectors,
  onUpdateConnector,
  onInjectTestMessage
}: ConnectorsManagerProps) {
  const [activePlatform, setActivePlatform] = useState<SocialPlatform>('x_twitter');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [testingStatus, setTestingStatus] = useState<{ loading: boolean; message?: string; success?: boolean } | null>(null);

  const currentConnector = connectors.find(c => c.platform === activePlatform) || connectors[0];
  const [formCredentials, setFormCredentials] = useState<any>(currentConnector.credentials || {});

  React.useEffect(() => {
    const conn = connectors.find(c => c.platform === activePlatform);
    if (conn) {
      setFormCredentials(conn.credentials || {});
      setTestingStatus(null);
    }
  }, [activePlatform, connectors]);

  const toggleShowSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const copyWebhookUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleTestConnection = async () => {
    setTestingStatus({ loading: true });
    try {
      const res = await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          platform: activePlatform,
          credentials: formCredentials
        })
      });
      const data = await res.json();
      setTestingStatus({
        loading: false,
        success: data.success,
        message: `${data.message} (${data.latencyMs}ms)`
      });
    } catch (err: any) {
      setTestingStatus({
        loading: false,
        success: false,
        message: err.message || 'Connection test failed'
      });
    }
  };

  const handleSaveCredentials = () => {
    onUpdateConnector(activePlatform, formCredentials, true);
    setTestingStatus({
      loading: false,
      success: true,
      message: 'Credentials securely saved to Astra Vault.'
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-700 uppercase tracking-wider font-bold">
          <Link2 className="w-4 h-4" />
          Production Live Connectors & Webhook Ingestion
        </div>
        <h1 className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
          Social Media Handles & Messaging API Credentials
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Connect your brand&apos;s live developer credentials and configure webhook listeners. Astra continuously monitors every inbound direct message, mention, and payload for impersonation, scam networks, and rogue mobile apps.
        </p>
      </div>

      {/* Platform Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {connectors.map((conn) => {
          const isSelected = conn.platform === activePlatform;
          return (
            <button
              key={conn.platform}
              onClick={() => setActivePlatform(conn.platform)}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-24 shadow-xs ${
                isSelected
                  ? 'bg-white border-cyan-600 ring-2 ring-cyan-600/20 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold font-mono text-slate-900 uppercase">
                  {conn.platform.replace('_', ' ')}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  conn.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`} />
              </div>

              <div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  conn.status === 'connected'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {conn.status.toUpperCase()}
                </span>
                <div className="text-[10px] text-slate-500 mt-1 truncate">
                  {conn.metrics.threatsDetected} threats flagged
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {currentConnector.name}
              </h2>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                currentConnector.status === 'connected'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {currentConnector.status === 'connected' ? 'LIVE & MONITORING' : 'NOT CONFIGURED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Auth Mode: <strong className="font-mono text-cyan-700 uppercase">{currentConnector.authType}</strong> | Last Synced: {currentConnector.lastSyncedAt ? new Date(currentConnector.lastSyncedAt).toLocaleString() : 'Never'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testingStatus?.loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-mono transition border border-slate-200 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingStatus?.loading ? 'animate-spin text-cyan-600' : ''}`} />
              Test API Ping
            </button>

            <button
              onClick={handleSaveCredentials}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs transition"
            >
              Save Credentials
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {testingStatus && (
          <div className={`p-3 border-b text-xs font-mono flex items-center gap-2 ${
            testingStatus.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {testingStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
            <span>{testingStatus.message}</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Credentials Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePlatform === 'x_twitter' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-700 font-semibold flex items-center justify-between">
                    <span>OAuth 2.0 Client ID</span>
                    <span className="text-[10px] text-slate-500 font-normal">Twitter Developer Portal</span>
                  </label>
                  <input
                    type="text"
                    value={formCredentials.clientId || ''}
                    onChange={(e) => setFormCredentials({ ...formCredentials, clientId: e.target.value })}
                    placeholder="e.g. ASTRA_X_CLIENT_ID_PROD"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-700 font-semibold flex items-center justify-between">
                    <span>Client Secret / Consumer Secret</span>
                    <button
                      type="button"
                      onClick={() => toggleShowSecret('clientSecret')}
                      className="text-[10px] text-cyan-700 flex items-center gap-1 hover:underline"
                    >
                      {showSecrets['clientSecret'] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showSecrets['clientSecret'] ? 'Hide' : 'Show'}
                    </button>
                  </label>
                  <input
                    type={showSecrets['clientSecret'] ? 'text' : 'password'}
                    value={formCredentials.clientSecret || ''}
                    onChange={(e) => setFormCredentials({ ...formCredentials, clientSecret: e.target.value })}
                    placeholder="Enter Secret Key"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-mono text-slate-700 font-semibold">
                    Bearer Token / User Access Token (Read DMs & Mentions)
                  </label>
                  <input
                    type={showSecrets['accessToken'] ? 'text' : 'password'}
                    value={formCredentials.accessToken || ''}
                    onChange={(e) => setFormCredentials({ ...formCredentials, accessToken: e.target.value })}
                    placeholder="AAAAAAAAAAAAAAAAAAAA..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
              </>
            )}

            {activePlatform === 'instagram' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-700 font-semibold">
                    Meta Page ID / Instagram Professional Account ID
                  </label>
                  <input
                    type="text"
                    value={formCredentials.pageId || ''}
                    onChange={(e) => setFormCredentials({ ...formCredentials, pageId: e.target.value })}
                    placeholder="e.g. 109845729184712"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-700 font-semibold">
                    Meta Webhook Verify Token
                  </label>
                  <input
                    type="text"
                    value={formCredentials.webhookSecret || 'astra_secure_webhook_token'}
                    onChange={(e) => setFormCredentials({ ...formCredentials, webhookSecret: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-mono text-slate-700 font-semibold flex items-center justify-between">
                    <span>Page Access Token (Requires `instagram_manage_messages` scope)</span>
                  </label>
                  <input
                    type="password"
                    value={formCredentials.accessToken || ''}
                    onChange={(e) => setFormCredentials({ ...formCredentials, accessToken: e.target.value })}
                    placeholder="EAABwzL9..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
              </>
            )}

            {activePlatform === 'telegram' && (
              <>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-mono text-slate-700 font-semibold flex items-center justify-between">
                    <span>Telegram Bot API Token (@BotFather)</span>
                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-cyan-700 flex items-center gap-1 hover:underline"
                    >
                      Open BotFather <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </label>
                  <input
                    type="text"
                    value={formCredentials.botToken || ''}
                    onChange={(e) => setFormCredentials({ ...formCredentials, botToken: e.target.value })}
                    placeholder="e.g. 682940172:AAFZ_sample_token..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
              </>
            )}

            {activePlatform === 'linkedin' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-700 font-semibold">
                    LinkedIn Organization URN
                  </label>
                  <input
                    type="text"
                    value={formCredentials.pageId || 'urn:li:organization:9847291'}
                    onChange={(e) => setFormCredentials({ ...formCredentials, pageId: e.target.value })}
                    placeholder="urn:li:organization:..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-700 font-semibold">
                    OAuth 2.0 Client ID
                  </label>
                  <input
                    type="text"
                    value={formCredentials.clientId || ''}
                    onChange={(e) => setFormCredentials({ ...formCredentials, clientId: e.target.value })}
                    placeholder="Enter Client ID"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
              </>
            )}
          </div>

          {/* Ingest Webhook Endpoint Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Live Ingestion Webhook URL
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Method: POST / GET (Handshake)
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Provide this endpoint to your {activePlatform.replace('_', ' ')} developer console to receive real-time message events:
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs text-cyan-800 select-all overflow-x-auto shadow-2xs font-semibold">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/${activePlatform}` : `https://your-domain.com/api/webhooks/${activePlatform}`}
              </div>
              <button
                onClick={() => {
                  const url = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/${activePlatform}` : `https://your-domain.com/api/webhooks/${activePlatform}`;
                  copyWebhookUrl(url, 'webhook-url');
                }}
                className="px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-mono flex items-center gap-1.5 transition shrink-0 border border-slate-200 shadow-2xs"
              >
                {copiedUrl === 'webhook-url' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Live Webhook Payload Injector */}
          <div className="p-5 rounded-2xl bg-cyan-50/70 border border-cyan-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-700" />
                Live Ingestion Simulator & Defense Verification
              </span>
              <span className="text-[10px] font-mono text-cyan-700 font-semibold">
                Instant Threat Pipeline Test
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Want to see how Astra immediately catches rogue mobile APKs or brand impersonators on {activePlatform.toUpperCase()}? Click below to inject a simulated live threat event into the real engine:
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onInjectTestMessage(
                  activePlatform,
                  'URGENT: Your brand account is being suspended for violating Meta Trademark standards. Download the official Astra Security mobile compliance update immediately: https://astra-support-patch.xyz/files/AstraProtect_v3.4.apk or confirm your master seed phrase.',
                  'astra_security_compliance_team'
                )}
                className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-semibold transition flex items-center gap-1.5 shadow-2xs"
              >
                <Send className="w-3 h-3" />
                Inject Rogue APK & Impersonator DM
              </button>

              <button
                onClick={() => onInjectTestMessage(
                  activePlatform,
                  'Hello support team, we noticed our enterprise license is up for renewal next week. Can you send the updated invoice to billing@enterprise-cloud.io?',
                  'legitimate_enterprise_client'
                )}
                className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-mono font-semibold transition flex items-center gap-1.5 border border-slate-300 shadow-2xs"
              >
                <Send className="w-3 h-3" />
                Inject Clean Inbound Inquiry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
