'use client';

import React, { useState } from 'react';
import { 
  Link as LinkIcon, 
  Search, 
  ShieldAlert, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Globe, 
  Copy, 
  Check,
  Send,
  Sparkles
} from 'lucide-react';

interface ScamLinksPageProps {
  onOpenTakedown: (threat: any) => void;
}

export function ScamLinksPage({ onOpenTakedown }: ScamLinksPageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [urlScannerInput, setUrlScannerInput] = useState('https://acme-security-verify.top/login.php');
  const [scanResult, setScanResult] = useState<any>(null);

  const scamLinks = [
    {
      id: 'sl-1',
      url: 'https://acme-offer.com/claim',
      domain: 'acme-offer.com',
      campaignType: 'Phishing / Credential Harvester',
      threatVector: 'X (Twitter) Mention Botnet',
      riskScore: 98,
      status: 'Active Phishing',
      registrar: 'NameCheap (Abuse Filed)',
      ipAddress: '185.220.101.44',
      firstSeen: '4 hours ago'
    },
    {
      id: 'sl-2',
      url: 'https://bit.ly/acme-meta-appeal-case',
      domain: 'bit.ly (Masked redirect)',
      campaignType: 'Account Takeover Extortion',
      threatVector: 'Instagram Direct Message',
      riskScore: 92,
      status: 'Redirect Blocked',
      registrar: 'Bitly Trust Desk',
      ipAddress: '104.244.42.1',
      firstSeen: '7 hours ago'
    },
    {
      id: 'sl-3',
      url: 'https://acme-giveaway.net/airdrop',
      domain: 'acme-giveaway.net',
      campaignType: 'Crypto Wallet Drainer',
      threatVector: 'TikTok Comment Spam',
      riskScore: 94,
      status: 'Active Phishing',
      registrar: 'Cloudflare Proxy (Reported)',
      ipAddress: '172.67.182.11',
      firstSeen: '12 hours ago'
    },
    {
      id: 'sl-4',
      url: 'https://secure-doc-review.live/acme-invoice.pdf',
      domain: 'secure-doc-review.live',
      campaignType: 'Spear-Phishing Payload',
      threatVector: 'LinkedIn InMail',
      riskScore: 89,
      status: 'Safe Browsing Flagged',
      registrar: 'Porkbun LLC',
      ipAddress: '45.142.214.2',
      firstSeen: '18 hours ago'
    }
  ];

  const copyUrl = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleScanUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setScanResult({
      url: urlScannerInput,
      domain: 'acme-security-verify.top',
      tld: '.top (High Risk TLD)',
      verdict: 'CONFIRMED PHISHING',
      riskScore: 99,
      ip: '194.26.29.114',
      indicators: [
        'Domain mimics brand name "Acme" with unauthorized security keywords',
        'Hosted on high-abuse bulletproof hosting subnet',
        'Fake login form harvesting passwords and 2FA tokens'
      ]
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Scam Links & Phishing Radar</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time tracking of lookalike phishing domains, deceptive shorteners, and credential harvesting landing pages
        </p>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-slate-500">Scam Links Flagged</div>
          <div className="text-2xl font-black text-slate-900 mt-1">71</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">↓ 41% vs last month</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-red-600 font-semibold">Active Phishing Portals</div>
          <div className="text-2xl font-black text-red-600 mt-1">19</div>
          <div className="text-[11px] text-red-500 font-medium mt-1">Immediate takedown required</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-slate-500">Masked URL Shorteners</div>
          <div className="text-2xl font-black text-slate-900 mt-1">31</div>
          <div className="text-[11px] text-slate-400 mt-1">bit.ly, t.co, tinyurl</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-emerald-600 font-semibold">Neutralized Links</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">52</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Reported to Safe Browsing</div>
        </div>
      </div>

      {/* URL Forensic Scanner Sandbox */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            Live URL & Redirect Chain Inspector
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analyze any suspicious link found in social DMs or comments to trace unshortened destinations and phishing kits
          </p>
        </div>

        <form onSubmit={handleScanUrl} className="flex gap-2">
          <input
            type="text"
            value={urlScannerInput}
            onChange={(e) => setUrlScannerInput(e.target.value)}
            placeholder="https://suspected-phishing-link.com"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Inspect URL
          </button>
        </form>

        {scanResult && (
          <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-700">{scanResult.verdict} (Risk: {scanResult.riskScore}/100)</span>
              <span className="text-slate-500">IP: {scanResult.ip}</span>
            </div>
            <div className="text-slate-700 font-medium">TLD: {scanResult.tld}</div>
            <div className="space-y-1">
              {scanResult.indicators.map((ind: string, i: number) => (
                <div key={i} className="text-red-700 text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  <span>{ind}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Flagged Scam Links Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <h2 className="text-base font-bold text-slate-900 mb-4">Active Malicious Links & Campaigns</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-medium">URL & Domain</th>
                <th className="pb-3 font-medium">Campaign Type</th>
                <th className="pb-3 font-medium">Vector</th>
                <th className="pb-3 font-medium">Host / Registrar</th>
                <th className="pb-3 font-medium">Risk</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scamLinks.map((sl) => (
                <tr key={sl.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 pr-3 max-w-[220px]">
                    <div className="font-bold text-slate-900 font-mono truncate">{sl.domain}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1">
                      <span>{sl.url}</span>
                      <button onClick={() => copyUrl(sl.url, sl.id)} className="text-slate-400 hover:text-slate-700">
                        {copiedId === sl.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>

                  <td className="py-3.5 pr-3 text-slate-700 font-medium">
                    {sl.campaignType}
                  </td>

                  <td className="py-3.5 pr-3 text-slate-500">
                    {sl.threatVector}
                  </td>

                  <td className="py-3.5 pr-3 text-slate-500 font-mono text-[11px]">
                    {sl.registrar}
                  </td>

                  <td className="py-3.5 pr-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">
                      {sl.riskScore}/100
                    </span>
                  </td>

                  <td className="py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => onOpenTakedown(sl)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold transition"
                    >
                      Takedown URL
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
