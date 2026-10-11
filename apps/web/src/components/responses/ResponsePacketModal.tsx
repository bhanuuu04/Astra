'use client';

import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Send, 
  FileText, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Lock, 
  Layers, 
  AlertCircle 
} from 'lucide-react';
import { 
  ResponsePacket, 
  ResponseDraftItem, 
  EvidenceManifestItem, 
  simulateAction 
} from '@/lib/api';

interface ResponsePacketModalProps {
  packet: ResponsePacket;
  onClose: () => void;
  onActionSimulated?: (simulatedResult: any) => void;
}

export function ResponsePacketModal({
  packet,
  onClose,
  onActionSimulated,
}: ResponsePacketModalProps) {
  const [selectedRecipientIndex, setSelectedRecipientIndex] = useState(0);
  const [drafts, setDrafts] = useState<ResponseDraftItem[]>(packet.drafts || []);
  const [manifest, setManifest] = useState<EvidenceManifestItem[]>(packet.manifest || []);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const currentDraft = drafts[selectedRecipientIndex] || drafts[0];

  const handleUpdateDraftText = (newText: string) => {
    setDrafts(prev =>
      prev.map((d, i) => (i === selectedRecipientIndex ? { ...d, body_text: newText } : d))
    );
  };

  const handleToggleEvidence = (id: string) => {
    setManifest(prev =>
      prev.map(m => (m.id === id ? { ...m, included: !m.included } : m))
    );
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await simulateAction(packet.action_id, 'analyst@astra.security', 'Simulated via Response Packet Console');
      if (res) {
        setSimulationResult(res);
        if (onActionSimulated) onActionSimulated(res);
      }
    } catch (err: any) {
      alert(err?.message || 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopy = () => {
    if (!currentDraft) return;
    const fullText = `SUBJECT: ${currentDraft.subject}\n\nRECIPIENT: ${currentDraft.recipient_name} (${currentDraft.contact_email})\nPOLICY: ${currentDraft.policy_reference}\n\n${currentDraft.body_text}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDossier = () => {
    const includedManifest = manifest.filter(m => m.included);
    const content = `# Legal Takedown & Evidence Dossier
Campaign: ${packet.campaign_title}
Action ID: ${packet.action_id}
Generated: ${packet.created_at}
Status: ${simulationResult ? 'SIMULATED' : 'DRAFT'}

---

## 1. Official Response Notice (${currentDraft.recipient_name})
Subject: ${currentDraft.subject}
Policy Reference: ${currentDraft.policy_reference}
Destination: ${currentDraft.contact_email}

${currentDraft.body_text}

---

## 2. Cryptographic Evidence Manifest (${includedManifest.length} Items)
${includedManifest.map((m, i) => `${i + 1}. [${m.name}] SHA-256: ${m.sha256} | Media: ${m.media_type} | Captured: ${m.captured_at}`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ASTRA-Takedown-${packet.campaign_title.replace(/\s+/g, '-').substring(0, 30)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-5xl h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Multi-Recipient Response Packet
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  simulationResult ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {simulationResult ? 'SIMULATED (AUDITED)' : 'DRAFT'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {packet.campaign_title} · Action ID: <span className="font-mono text-[11px]">{packet.action_id.substring(0, 8)}...</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDossier}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Dossier (.md)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Columns */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left: Recipient Selector & Manifest */}
          <div className="w-72 border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-3 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500">
              Recipient Channels ({drafts.length})
            </div>
            <div className="p-2 space-y-1">
              {drafts.map((d, index) => (
                <button
                  key={d.recipient_type}
                  onClick={() => setSelectedRecipientIndex(index)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex flex-col gap-0.5 ${
                    selectedRecipientIndex === index
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="font-bold truncate">{d.recipient_name}</span>
                  <span className={`text-[10px] font-mono ${selectedRecipientIndex === index ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {d.contact_email}
                  </span>
                </button>
              ))}
            </div>

            {/* Evidence Manifest Checklist */}
            <div className="p-3 border-t border-slate-200 text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 flex items-center justify-between">
              <span>Evidence Manifest</span>
              <span className="text-slate-400 font-normal">
                {manifest.filter(m => m.included).length}/{manifest.length}
              </span>
            </div>
            <div className="p-2 space-y-1.5 flex-1 overflow-y-auto">
              {manifest.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleEvidence(item.id)}
                  className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    item.included ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.included}
                      onChange={() => handleToggleEvidence(item.id)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span className="font-semibold text-slate-800 text-[11px] truncate flex-1">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 mt-1 truncate">
                    SHA: {item.sha256}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Active Notice Editor */}
          <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto p-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Policy Standard:</span>
                <span className="font-bold text-slate-900">{currentDraft?.policy_reference}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Recipient Abuse Desk:</span>
                <span className="font-mono text-indigo-600 font-semibold">{currentDraft?.contact_email}</span>
              </div>
              {currentDraft?.portal_url && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Submission Portal:</span>
                  <a
                    href={currentDraft.portal_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    {currentDraft.portal_url.substring(0, 45)}... <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-1.5 mb-4">
              <label className="block text-xs font-bold text-slate-700">Notice Subject Line</label>
              <input
                type="text"
                value={currentDraft?.subject || ''}
                readOnly
                className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-900"
              />
            </div>

            <div className="flex-1 flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Notice Body & Legal Evidence</label>
                <button
                  onClick={handleCopy}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied to Clipboard!' : 'Copy Text'}
                </button>
              </div>
              <textarea
                value={currentDraft?.body_text || ''}
                onChange={(e) => handleUpdateDraftText(e.target.value)}
                rows={12}
                className="w-full flex-1 p-3 text-xs font-mono text-slate-800 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {simulationResult && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Dry-run simulation:</strong> Logged into the audit trail by {simulationResult.simulated_by} at {new Date(simulationResult.simulated_at).toLocaleTimeString()}. No external action was submitted.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Safety Rule: Real external notifications are feature-flagged off for hackathon demonstration.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={handleSimulate}
              disabled={isSimulating || Boolean(simulationResult)}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 flex items-center gap-2 shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {isSimulating ? 'Simulating...' : simulationResult ? 'Simulated & Audited ✓' : 'Simulate Action & Log Audit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
