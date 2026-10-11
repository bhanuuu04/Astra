'use client';

import React from 'react';
import { 
  SocialMessage, 
  BrandAssetRegistry 
} from '@/types/threat';
import { 
  ShieldAlert, 
  FileWarning, 
  UserX, 
  Terminal, 
  Copy, 
  Check, 
  Ban, 
  ArrowRight,
  Fingerprint,
  Calendar,
  Users,
  AlertOctagon,
  DownloadCloud
} from 'lucide-react';

interface MessageDetailViewProps {
  message: SocialMessage;
  brand: BrandAssetRegistry;
  onOpenTakedown: (message: SocialMessage) => void;
  onUpdateStatus: (messageId: string, status: SocialMessage['status']) => void;
}

export function MessageDetailView({
  message,
  brand,
  onOpenTakedown,
  onUpdateStatus
}: MessageDetailViewProps) {
  const [copiedArtifact, setCopiedArtifact] = React.useState<string | null>(null);

  const sender = message.sender;
  const analysis = message.analysis;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedArtifact(id);
    setTimeout(() => setCopiedArtifact(null), 2000);
  };

  const exportForensicJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(message, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ASTRA_THREAT_${message.id}_${sender.username}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 overflow-y-auto">
      {/* Action Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-white/95 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 font-semibold">Status:</span>
          <select
            value={message.status}
            onChange={(e) => onUpdateStatus(message.id, e.target.value as SocialMessage['status'])}
            className="bg-white border border-slate-200 text-xs font-mono rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
          >
            <option value="new">New (Needs Triage)</option>
            <option value="investigating">Investigating</option>
            <option value="quarantined">Quarantined (Blocked)</option>
            <option value="takedown_requested">Takedown Requested</option>
            <option value="resolved">Resolved / Safe</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Export JSON */}
          <button
            onClick={exportForensicJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-mono transition shadow-xs"
            title="Download full forensic IOC payload"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-cyan-600" />
            Export IOC
          </button>

          {/* Quarantine / Block */}
          {message.status !== 'quarantined' && (
            <button
              onClick={() => onUpdateStatus(message.id, 'quarantined')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-mono font-semibold transition"
            >
              <Ban className="w-3.5 h-3.5" />
              Quarantine & Block
            </button>
          )}

          {/* 1-Click Takedown Generator */}
          <button
            onClick={() => onOpenTakedown(message)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Generate Takedown Notice
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Executive Threat Score Banner */}
        <div className={`p-5 rounded-2xl border shadow-xs ${
          analysis.severity === 'critical'
            ? 'bg-red-50 border-red-200 text-red-950'
            : analysis.severity === 'high'
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : analysis.severity === 'medium'
            ? 'bg-yellow-50 border-yellow-200 text-yellow-950'
            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl border ${
                analysis.severity === 'critical'
                  ? 'bg-red-100 border-red-300 text-red-700'
                  : 'bg-white border-slate-200 text-cyan-600'
              }`}>
                {analysis.severity === 'critical' ? (
                  <AlertOctagon className="w-7 h-7" />
                ) : (
                  <Fingerprint className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider font-bold">
                    Risk Classification
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-extrabold uppercase bg-white/90 border border-current">
                    {analysis.severity}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                  {analysis.summary}
                </h3>
              </div>
            </div>

            {/* Score Gauges */}
            <div className="flex items-center gap-4 shrink-0 font-mono">
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Astra Risk Score</div>
                <div className="text-2xl font-black text-slate-900">
                  {analysis.riskScore}<span className="text-xs text-slate-500 font-normal">/100</span>
                </div>
              </div>

              <div className="text-right border-l border-slate-200/80 pl-4">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Impersonation</div>
                <div className="text-lg font-bold text-amber-700">
                  {analysis.impersonationScore}%
                </div>
              </div>

              <div className="text-right border-l border-slate-200/80 pl-4">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Fake Probability</div>
                <div className="text-lg font-bold text-red-600">
                  {analysis.fakeAccountProbability}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sender Profile Forensic Dossier */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-800 flex items-center gap-1.5">
              <UserX className="w-3.5 h-3.5 text-cyan-600" />
              Sender Profile Intelligence ({message.platform.toUpperCase()})
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              ID: {sender.id}
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={sender.avatarUrl}
                  alt={sender.displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">
                      {sender.displayName}
                    </span>
                    {sender.isFakeBadgeEmoji && (
                      <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-mono font-bold">
                        [!] Fake Badge Emoji In Display Name
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-cyan-700 font-mono font-semibold">
                    @{sender.username}
                  </div>
                </div>
              </div>

              {/* Account Stats */}
              <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span><strong>{sender.followerCount}</strong> Followers</span>
                </div>
                <div className="flex items-center gap-1">
                  <span><strong>{sender.followingCount}</strong> Following</span>
                </div>
                {sender.accountCreatedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Created {new Date(sender.accountCreatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {sender.bio && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono">
                <span className="text-slate-400 mr-2 font-semibold">Bio:</span>
                &quot;{sender.bio}&quot;
              </div>
            )}
          </div>
        </div>

        {/* Message Content & Inspection */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-800 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-600" />
              Inbound Direct Message Payload
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Timestamp: {new Date(message.timestamp).toLocaleString()}
            </span>
          </div>

          <div className="p-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed font-mono whitespace-pre-wrap selection:bg-cyan-100">
              {message.content}
            </div>
          </div>
        </div>

        {/* Extracted Artifacts / IOCs (APKs, URLs, Domains, Wallets) */}
        {analysis.extractedArtifacts.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-800 flex items-center gap-1.5">
                <FileWarning className="w-3.5 h-3.5 text-red-600" />
                Extracted Threat Artifacts (IOCs)
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {analysis.extractedArtifacts.length} Captured
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.extractedArtifacts.map((art, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                    art.isMalicious
                      ? 'bg-red-50/70 border-red-200 text-red-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-700">
                      {art.type}
                    </span>
                    {art.isMalicious && (
                      <span className="text-[10px] font-mono text-red-700 font-bold uppercase">
                        MALICIOUS
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-xs break-all text-slate-900 font-medium">
                    {art.value}
                  </div>

                  {art.notes && (
                    <div className="text-[11px] text-slate-500">
                      {art.notes}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-end">
                    <button
                      onClick={() => copyToClipboard(art.value, `art-${idx}`)}
                      className="text-xs font-mono text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
                    >
                      {copiedArtifact === `art-${idx}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Forensic Diagnostic Indicators */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-mono font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-600" />
              Forensic Risk Signals & Trigger Heuristics
            </span>
          </div>

          <div className="p-5 space-y-3">
            {analysis.indicators.map((ind, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {ind.title}
                  </span>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                    ind.severity === 'critical'
                      ? 'bg-red-100 text-red-800 border-red-300 font-bold'
                      : ind.severity === 'high'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                      : 'bg-slate-200 text-slate-800 border-slate-300'
                  }`}>
                    {ind.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ind.description}
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-800">
                  <strong className="text-slate-500 mr-2">Evidence:</strong>
                  {ind.evidence}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Incident Response Actions */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3 shadow-xs">
          <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5">
            <ArrowRight className="w-4 h-4" />
            Recommended SOC Playbook Actions
          </h4>
          <ul className="space-y-2">
            {analysis.recommendedActions.map((act, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-xs text-slate-300 font-mono"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
