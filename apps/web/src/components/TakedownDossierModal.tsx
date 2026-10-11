'use client';

import React, { useState, useEffect } from 'react';
import { SocialMessage, BrandAssetRegistry } from '@/types/threat';
import { 
  X, 
  ShieldAlert, 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2
} from 'lucide-react';

interface TakedownDossierModalProps {
  message: SocialMessage | null;
  brand: BrandAssetRegistry;
  onClose: () => void;
  onConfirmTakedown: (messageId: string) => void;
}

export function TakedownDossierModal({
  message,
  brand,
  onClose,
  onConfirmTakedown
}: TakedownDossierModalProps) {
  const [loading, setLoading] = useState(true);
  const [dossier, setDossier] = useState<any>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  useEffect(() => {
    if (!message) return;
    setLoading(true);

    const isRogueApp = message.analysis.fakeMobileAppDetected;
    fetch('/api/takedown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        targetType: isRogueApp ? 'rogue_app' : 'platform_impersonation',
        brand
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setDossier(data.takedownDossier);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [message, brand]);

  if (!message) return null;

  const copyToClipboard = (text: string, type: 'subject' | 'body') => {
    navigator.clipboard.writeText(text);
    if (type === 'subject') {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  };

  const handleApplyAndFile = () => {
    onConfirmTakedown(message.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 lg:p-5 bg-red-50 border-b border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 border border-red-300 text-red-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Automated DMCA & Impersonation Takedown Dossier</span>
              </h2>
              <p className="text-xs text-red-700 font-mono font-medium">
                Target: @{message.sender.username} on {message.platform.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 font-mono text-xs">
          {loading ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-medium text-slate-700">Compiling Legal Brand Rights Evidence & Formulating Notice...</p>
            </div>
          ) : dossier ? (
            <>
              {/* Destination Abuse Portal */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Filing Destination</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {dossier.destination?.policy || 'Platform Abuse Desk'}
                  </div>
                  <div className="text-slate-600 text-[11px] font-medium mt-0.5">
                    Direct Abuse Contact: <span className="text-cyan-700 font-bold">{dossier.destination?.email}</span>
                  </div>
                </div>

                {dossier.destination?.portal && (
                  <a
                    href={dossier.destination.portal}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold shadow-2xs transition"
                  >
                    Open Platform Abuse Portal <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Subject Line */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-600 font-semibold">
                  <span>Formal Notice Subject Line</span>
                  <button
                    onClick={() => copyToClipboard(dossier.subject, 'subject')}
                    className="text-cyan-700 hover:underline flex items-center gap-1"
                  >
                    {copiedSubject ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSubject ? 'Copied' : 'Copy Subject'}
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 select-all font-sans font-medium">
                  {dossier.subject}
                </div>
              </div>

              {/* Notice Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-600 font-semibold">
                  <span>Structured Legal Notice & Threat Forensics Proof</span>
                  <button
                    onClick={() => copyToClipboard(dossier.bodyText, 'body')}
                    className="text-cyan-700 hover:underline flex items-center gap-1"
                  >
                    {copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedBody ? 'Copied' : 'Copy Notice Text'}
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 whitespace-pre-wrap select-all max-h-72 overflow-y-auto leading-relaxed font-mono">
                  {dossier.bodyText}
                </div>
              </div>
            </>
          ) : (
            <div className="text-red-600 font-bold">Failed to generate takedown notice.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-mono font-semibold hover:bg-slate-100 transition shadow-2xs"
          >
            Cancel
          </button>

          <button
            onClick={handleApplyAndFile}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark Filed & Update Incident Status
          </button>
        </div>
      </div>
    </div>
  );
}
