'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  ArrowRight, 
  Clock, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Smartphone, 
  Link as LinkIcon, 
  ExternalLink,
  ChevronDown,
  Ban
} from 'lucide-react';
import { SocialMessage } from '@/types/threat';

interface ThreatsPageProps {
  messages: SocialMessage[];
  onOpenTakedown: (message: SocialMessage) => void;
  onUpdateStatus: (messageId: string, status: SocialMessage['status']) => void;
  onSelectMessageDetail: (message: SocialMessage) => void;
}

export function ThreatsPage({
  messages,
  onOpenTakedown,
  onUpdateStatus,
  onSelectMessageDetail
}: ThreatsPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'investigating' | 'quarantined' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filtered = messages.filter(m => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (severityFilter !== 'all' && m.analysis.severity !== severityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.sender.username.toLowerCase().includes(q) ||
        m.sender.displayName.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = messages.filter(m => m.analysis.severity === 'critical').length;
  const highCount = messages.filter(m => m.analysis.severity === 'high').length;
  const quarantinedCount = messages.filter(m => m.status === 'quarantined').length;
  const resolvedCount = messages.filter(m => m.status === 'resolved').length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Active Threats</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time feed of detected impersonation, rogue apps, and scam campaigns across all channels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold font-mono">
            {criticalCount} Critical
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold font-mono">
            {highCount} High Risk
          </span>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-slate-500">Total Flagged</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{messages.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all social handles</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-red-600 font-semibold">Critical Threats</div>
          <div className="text-2xl font-black text-red-600 mt-1">{criticalCount}</div>
          <div className="text-[11px] text-red-500 font-medium mt-1">Requires immediate takedown</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-slate-500">Quarantined</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{quarantinedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Auto-blocked from team</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-emerald-600 font-semibold">Resolved / Safe</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{resolvedCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Verified legitimate</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'new', 'investigating', 'quarantined', 'resolved'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                statusFilter === tab
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab === 'all' ? 'All Threats' : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="clean">Clean</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sender, handle, keywords..."
              className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Threats List Cards */}
      <div className="space-y-3">
        {filtered.map((msg) => (
          <div
            key={msg.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4 min-w-0">
              <img
                src={msg.sender.avatarUrl}
                alt={msg.sender.displayName}
                className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-sm truncate">
                    {msg.sender.displayName}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    @{msg.sender.username}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase font-bold">
                    {msg.platform.replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${
                    msg.analysis.severity === 'critical'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : msg.analysis.severity === 'high'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {msg.analysis.severity} ({msg.analysis.riskScore}/100)
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {msg.content}
                </p>

                {/* Threat Tags */}
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  {msg.analysis.fakeMobileAppDetected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                      <Smartphone className="w-3 h-3" /> Rogue Mobile APK
                    </span>
                  )}
                  {msg.analysis.impersonationScore >= 50 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                      Impersonator ({msg.analysis.impersonationScore}%)
                    </span>
                  )}
                  {msg.analysis.maliciousPayloadDetected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                      <LinkIcon className="w-3 h-3" /> Phishing Link
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {msg.status !== 'quarantined' && (
                <button
                  onClick={() => onUpdateStatus(msg.id, 'quarantined')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Quarantine
                </button>
              )}

              <button
                onClick={() => onOpenTakedown(msg)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition flex items-center gap-1 active:scale-95"
              >
                Take Action <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
