'use client';

import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink,
  Mail,
  Server,
  ShieldCheck,
  Plus
} from 'lucide-react';

interface DomainsPageProps {
  onOpenTakedown: (threat: any) => void;
}

export function DomainsPage({ onOpenTakedown }: DomainsPageProps) {
  const [search, setSearch] = useState('');

  const monitoredDomains = [
    {
      domain: 'acme-security.com',
      technique: 'Hyphen Addition',
      similarity: '96%',
      status: 'Active Phishing Site',
      statusColor: 'bg-red-50 text-red-600 border-red-200',
      hasMxRecords: true,
      mxWarning: 'Active MX Record configured! Can send email as your brand.',
      ip: '185.193.125.10',
      registrar: 'NameSilo LLC',
      registeredOn: 'Sep 08, 2026',
      sslIssuer: "Let's Encrypt"
    },
    {
      domain: 'acme-login.net',
      technique: 'TLD Swap + Keyword Spoof',
      similarity: '91%',
      status: 'Credential Harvester',
      statusColor: 'bg-red-50 text-red-600 border-red-200',
      hasMxRecords: false,
      ip: '194.38.20.5',
      registrar: 'Hostinger Operations',
      registeredOn: 'Aug 24, 2026',
      sslIssuer: "Cloudflare Inc"
    },
    {
      domain: 'acmè.com',
      technique: 'IDN Homoglyph (Punycode: xn--acm-7la.com)',
      similarity: '98%',
      status: 'Parked / Under Observation',
      statusColor: 'bg-amber-50 text-amber-600 border-amber-200',
      hasMxRecords: false,
      ip: '104.21.55.2',
      registrar: 'GoDaddy.com LLC',
      registeredOn: 'Jul 15, 2026',
      sslIssuer: 'None'
    },
    {
      domain: 'acme-support.top',
      technique: 'High-Abuse TLD (.top)',
      similarity: '94%',
      status: 'Active Phishing Site',
      statusColor: 'bg-red-50 text-red-600 border-red-200',
      hasMxRecords: true,
      mxWarning: 'Active MX Record detected (Spam mail server).',
      ip: '45.154.255.8',
      registrar: 'Alibaba Cloud',
      registeredOn: 'Sep 10, 2026',
      sslIssuer: "Let's Encrypt"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Domain Typosquatting Radar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous DNS monitoring for lookalike domains, punycode attacks, and fraudulent mail servers
          </p>
        </div>

        <button
          onClick={() => {}}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Custom Domain Watchlist
        </button>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-slate-500">Lookalike Domains Found</div>
          <div className="text-2xl font-black text-slate-900 mt-1">18</div>
          <div className="text-[11px] text-slate-400 mt-1">Monitored 24/7</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-red-600 font-semibold">Active MX Records</div>
          <div className="text-2xl font-black text-red-600 mt-1">4</div>
          <div className="text-[11px] text-red-500 font-medium mt-1">Risk of spear-phishing emails</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-slate-500">Punycode / Homoglyphs</div>
          <div className="text-2xl font-black text-slate-900 mt-1">3</div>
          <div className="text-[11px] text-slate-400 mt-1">IDN lookalikes registered</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-emerald-600 font-semibold">Registrar Takedowns</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">11</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Domains suspended</div>
        </div>
      </div>

      {/* Domains Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Lookalike Domains Radar</h2>
        </div>

        <div className="space-y-4">
          {monitoredDomains.map((d, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{d.domain}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${d.statusColor}`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Technique: <strong className="text-slate-700">{d.technique}</strong> • {d.similarity} Brand Similarity
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenTakedown({ title: d.domain, platform: 'Domain Registrar' })}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs transition flex items-center gap-1"
                  >
                    File Registrar Takedown <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {d.hasMxRecords && d.mxWarning && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2 font-medium">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>{d.mxWarning}</span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-500 pt-1">
                <div>Registrar: <strong className="text-slate-800">{d.registrar}</strong></div>
                <div>Server IP: <strong className="text-slate-800">{d.ip}</strong></div>
                <div>Registered: <strong className="text-slate-800">{d.registeredOn}</strong></div>
                <div>SSL: <strong className="text-slate-800">{d.sslIssuer}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
