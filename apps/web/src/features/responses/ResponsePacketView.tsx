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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#787774] hover:text-[#37352f] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Campaign Graph</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e3e2e0]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0f7b6c] tracking-wide uppercase mb-1">
              <span>Takedown Operations</span>
              <span>•</span>
              <span className="text-[#9b9a97]">Multi-Surface Response Packet</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#37352f] tracking-tight">
              Evidence Manifest &amp; Enforcement Drafts
            </h1>
            <p className="text-sm text-[#787774] mt-1 max-w-2xl">
              Platform-tailored takedown notices, registrar notices, and abuse packets linked to cryptographic evidence hashes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#f7f6f3] text-[#37352f] rounded-[6px] text-xs font-medium border border-[#e3e2e0] shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#0f7b6c]" />
              <span>Export Dossier (JSON)</span>
            </button>

            <button
              onClick={() => simulateMutation.mutate()}
              disabled={simulateMutation.isPending || simulationResult !== null}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-xs font-medium shadow-xs transition cursor-pointer ${
                simulationResult
                  ? 'bg-[#0f7b6c] text-white cursor-default'
                  : 'bg-[#0f7b6c] hover:bg-[#0c6357] disabled:bg-[#e3e2e0] text-white'
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
        <div className="p-4 rounded-[8px] bg-[#0f7b6c]/10 border border-[#0f7b6c]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#0f7b6c] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#0f7b6c]">
                Response Action Simulated Successfully
              </p>
              <p className="text-xs text-[#787774]">
                Action ID: <span className="font-mono">{simulationResult.action_id}</span> • Simulated by: {simulationResult.simulated_by} • Audit timestamp: {new Date(simulationResult.simulated_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-[4px] bg-[#0f7b6c]/20 text-[#0f7b6c] text-xs font-mono font-semibold">
            STATUS: SIMULATED
          </span>
        </div>
      )}

      {/* Drafts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recipient Tabs */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-[#787774] uppercase tracking-wider block px-1">
            Recipient Channels ({drafts.length})
          </span>

          {drafts.map((d, idx) => {
            const isSelected = activeTab === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`w-full text-left p-3.5 rounded-[8px] border transition cursor-pointer flex flex-col gap-1 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
                  isSelected
                    ? 'bg-[#f7f6f3] border-[#0f7b6c] shadow-[inset_3px_0_0_#0f7b6c]'
                    : 'bg-white border-[#e3e2e0] hover:bg-[#f7f6f3]/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#37352f] uppercase tracking-wider">
                    {d.recipient_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] font-mono font-medium">
                    Ready
                  </span>
                </div>
                <span className="text-xs text-[#37352f] font-medium truncate">
                  {d.recipient_name}
                </span>
                <span className="text-[11px] text-[#787774] font-mono truncate">
                  {d.contact_email}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Draft Editor / Preview */}
        <div className="lg:col-span-2 p-6 rounded-[8px] bg-white border border-[#e3e2e0] space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#e3e2e0]">
            <div>
              <h3 className="text-sm font-semibold text-[#37352f]">{currentDraft.recipient_name}</h3>
              <p className="text-xs text-[#787774] font-mono mt-0.5">Policy Ref: {currentDraft.policy_reference}</p>
            </div>
            <button
              onClick={() => handleCopyDraft(currentDraft.body_text)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f7f6f3] hover:bg-[#e3e2e0] text-[#37352f] border border-[#e3e2e0] rounded-[6px] text-xs font-medium transition cursor-pointer"
            >
              {copiedDraft ? <Check className="w-3.5 h-3.5 text-[#0f7b6c]" /> : <Copy className="w-3.5 h-3.5 text-[#787774]" />}
              <span>{copiedDraft ? 'Copied to Clipboard' : 'Copy Draft'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#787774] uppercase tracking-wider mb-1">
                Subject Line
              </label>
              <input
                readOnly
                value={currentDraft.subject}
                className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#787774] uppercase tracking-wider mb-1">
                Notice Body &amp; Cryptographic Allegations
              </label>
              <textarea
                readOnly
                rows={10}
                value={currentDraft.body_text}
                className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] p-3 text-xs font-mono text-[#37352f] leading-relaxed resize-none focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Manifest Table */}
      <div className="p-6 rounded-[8px] bg-white border border-[#e3e2e0] space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#37352f]">Cryptographic Evidence Manifest</h3>
            <p className="text-xs text-[#787774]">Verifiable SHA-256 artifacts included in the takedown submission</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-[4px] bg-[#f7f6f3] border border-[#e3e2e0] text-[#787774] font-mono font-medium">
            {manifestItems.filter(i => i.included).length} Artifacts Bound
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f7f6f3] text-[#787774] border-b border-[#e3e2e0]">
              <tr>
                <th className="p-3 font-semibold">Include</th>
                <th className="p-3 font-semibold">Evidence Name</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold">SHA-256 Fingerprint</th>
                <th className="p-3 font-semibold">Source Reference</th>
                <th className="p-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e2e0] font-mono">
              {manifestItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#787774]">
                    No evidence objects attached. Reset demo fixtures to populate manifest items.
                  </td>
                </tr>
              ) : (
                manifestItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f7f6f3]/60 transition">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={item.included}
                        onChange={() => toggleManifestInclude(item.id)}
                        className="rounded-[4px] border-[#e3e2e0] text-[#0f7b6c] focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-semibold text-[#37352f]">{item.name}</td>
                    <td className="p-3 text-[#787774]">{item.media_type}</td>
                    <td className="p-3 text-[#0f7b6c] font-mono text-[11px] truncate max-w-[200px]">
                      {item.sha256}
                    </td>
                    <td className="p-3 text-[#787774] truncate max-w-[180px]">{item.source_reference}</td>
                    <td className="p-3 text-[#787774] text-[11px]">{new Date(item.captured_at).toLocaleTimeString()}</td>
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
