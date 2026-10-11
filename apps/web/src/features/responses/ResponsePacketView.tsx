'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileCheck, 
  ArrowLeft, 
  ShieldCheck, 
  Download, 
  Send, 
  CheckCircle2, 
  Copy, 
  Share2, 
  Globe, 
  Smartphone, 
  Play, 
  Clock, 
  FileText, 
  Hash,
  Check,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  generateResponsePacket, 
  simulateAction, 
  ResponsePacket, 
  ResponseDraftItem, 
  EvidenceManifestItem,
  SimulateActionResult 
} from '@/lib/api';

interface ResponsePacketViewProps {
  campaignId: string;
}

export function ResponsePacketView({ campaignId }: ResponsePacketViewProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [manifestItems, setManifestItems] = useState<EvidenceManifestItem[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulateActionResult | null>(null);

  const { data: packet, isLoading, refetch } = useQuery({
    queryKey: ['responsePacket', campaignId],
    queryFn: () => generateResponsePacket(campaignId),
  });

  useEffect(() => {
    if (packet?.manifest) {
      setManifestItems(packet.manifest);
    }
  }, [packet]);

  const simulateMutation = useMutation({
    mutationFn: async () => {
      if (!packet?.action_id) return null;
      return await simulateAction(packet.action_id, 'Lead SOC Analyst', 'Simulated emergency takedown across 4 surface providers');
    },
    onSuccess: (res) => {
      setSimulationResult(res);
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      refetch();
    },
  });

  const toggleManifestInclude = (id: string) => {
    setManifestItems(prev =>
      prev.map(item => item.id === id ? { ...item, included: !item.included } : item)
    );
  };

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  const handleExportJson = () => {
    if (!packet) return;
    const exportData = {
      ...packet,
      manifest: manifestItems,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astra-response-packet-${campaignId.substring(0, 8)}.json`;
    a.click();
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Generating multi-recipient response drafts &amp; evidence manifest...</div>;
  }

  /* Canned legal and enforcement drafts are intentionally disabled. Packets must be evidence-backed.
  const fallbackDrafts: ResponseDraftItem[] = [
    {
      recipient_type: 'meta_rights_manager',
      recipient_name: 'Meta IP & Rights Management Operations',
      subject: 'Urgent: Trademark Infringement & Malicious Impersonation of NilaPay',
      body_text: 'Dear Meta Operations Team,\n\nWe hereby submit an emergency takedown notice regarding active brand impersonation of NilaPay (Trademark Registration: IN-892144).\n\nInfringing Profile: https://www.instagram.com/nilapay.support.helpdesk\nActor bio falsely claims official support and promotes credential harvesting phishing site.\n\nEvidence SHA-256 Manifest Attached.\nSigned,\nAstra Digital Risk Protection SOC',
      contact_email: 'ip@support.facebook.com',
      policy_reference: 'Meta Commerce & Impersonation Policy Section 4.2',
    },
    {
      recipient_type: 'icann_registrar',
      recipient_name: 'GoDaddy LLC Abuse & Legal Department',
      subject: 'Notice of Phishing Domain & Fraudulent eKYC Harvesting: nilapay-kyc-verify.top',
      body_text: 'Dear Abuse Team,\n\nThe domain nilapay-kyc-verify.top registered through your service is actively operating a credential-harvesting phishing portal targeting NilaPay fintech users.\n\nRegistrar: GoDaddy LLC\nTarget: NilaPay Financial Technologies\nFraudulent Payee UPI: fraud-upi@axisbank\n\nPlease suspend the domain under ICANN RAA Specification 11 (Security Threats).',
      contact_email: 'abuse@godaddy.com',
      policy_reference: 'ICANN RAA Specification 11 (Security Threat Remediation)',
    },
    {
      recipient_type: 'google_play_abuse',
      recipient_name: 'Google Play Protect & Android Security',
      subject: 'Malicious Sideloaded APK Impersonating NilaPay with Trojanized SMS Permissions',
      body_text: 'Package Name: in.nilapay.recharge.offers\nCert Fingerprint: SHA256:FF:EE:DD:CC:BB:AA...\nMalicious Behavior: Requests READ_SMS and SEND_SMS to intercept 2FA OTPs for unauthorized bank transfers.\nPayee UPI: fraud-upi@axisbank',
      contact_email: 'abuse@android.com',
      policy_reference: 'Google Play Malware & Financial Fraud Enforcement',
    },
  ];
  */

  const drafts: ResponseDraftItem[] = packet?.drafts ?? [];
  const currentDraft = drafts[activeTab] || drafts[0];

  if (!packet) {
    return (
      <div role="alert" className="mx-auto max-w-3xl p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-amber-300" />
        <h2 className="mt-3 text-lg font-semibold text-slate-100">Response packet unavailable</h2>
        <p className="mt-2 text-sm text-slate-400">ASTRA could not load a packet for this campaign. Try again after checking the API connection.</p>
        <button onClick={() => refetch()} className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">Try again</button>
      </div>
    );
  }
  if (drafts.length === 0) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <FileText className="mx-auto h-8 w-8 text-slate-500" />
        <h2 className="mt-3 text-lg font-semibold text-slate-100">No response drafts available</h2>
        <p className="mt-2 text-sm text-slate-400">This campaign does not have enough persisted evidence to generate a response packet yet.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Back Button */}
      <div className="space-y-3">
        <Link
          href={`/campaigns/${campaignId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Campaign Graph</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1">
              <span>Takedown Operations</span>
              <span>•</span>
              <span className="text-slate-400">Multi-Surface Response Packet</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Evidence Manifest &amp; Enforcement Drafts
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Platform-tailored takedown notices, registrar notices, and Google Play abuse packets linked to cryptographic evidence hashes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Export Dossier (JSON)</span>
            </button>

            <button
              onClick={() => simulateMutation.mutate()}
              disabled={simulateMutation.isPending || simulationResult !== null}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow transition cursor-pointer ${
                simulationResult
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white'
              }`}
            >
              {simulationResult ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulated (Live Audit Logged)</span>
                </>
              ) : (
                <>
                  <Play className={`w-4 h-4 ${simulateMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>{simulateMutation.isPending ? 'Simulating...' : 'Simulate Response Action'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Feedback Banner */}
      {simulationResult && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-200">
                Response Action Simulated Successfully
              </p>
              <p className="text-xs text-emerald-300/80">
                Action ID: <span className="font-mono">{simulationResult.action_id}</span> • Simulated by: {simulationResult.simulated_by} • Audit timestamp: {new Date(simulationResult.simulated_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
            STATUS: SIMULATED
          </span>
        </div>
      )}

      {/* Drafts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recipient Tabs */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            Recipient Channels ({drafts.length})
          </span>

          {drafts.map((d, idx) => {
            const isSelected = activeTab === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {d.recipient_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Ready
                  </span>
                </div>
                <span className="text-xs text-slate-300 font-medium truncate">
                  {d.recipient_name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono truncate">
                  {d.contact_email}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Draft Editor / Preview */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">{currentDraft.recipient_name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Policy Ref: {currentDraft.policy_reference}</p>
            </div>
            <button
              onClick={() => handleCopyDraft(currentDraft.body_text)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              {copiedDraft ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDraft ? 'Copied to Clipboard' : 'Copy Draft'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Subject Line
              </label>
              <input
                readOnly
                value={currentDraft.subject}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Notice Body &amp; Cryptographic Allegations
              </label>
              <textarea
                readOnly
                rows={10}
                value={currentDraft.body_text}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Manifest Table */}
      <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Cryptographic Evidence Manifest</h3>
            <p className="text-xs text-slate-400">Verifiable SHA-256 artifacts included in the takedown submission</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
            {manifestItems.filter(i => i.included).length} Artifacts Bound
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Include</th>
                <th className="p-3">Evidence Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">SHA-256 Fingerprint</th>
                <th className="p-3">Source Reference</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {manifestItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No evidence objects attached. Reset demo fixtures to populate manifest items.
                  </td>
                </tr>
              ) : (
                manifestItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-950/40 transition">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={item.included}
                        onChange={() => toggleManifestInclude(item.id)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-semibold text-slate-200">{item.name}</td>
                    <td className="p-3 text-slate-400">{item.media_type}</td>
                    <td className="p-3 text-indigo-300 font-mono text-[11px] truncate max-w-[200px]">
                      {item.sha256}
                    </td>
                    <td className="p-3 text-slate-400 truncate max-w-[180px]">{item.source_reference}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{new Date(item.captured_at).toLocaleTimeString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
