'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  FileText, 
  Copy, 
  Check, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { ResponsePacketModal } from './responses/ResponsePacketModal';
import { ResponsePacket, generateResponsePacket } from '@/lib/api';

interface TakedownsPageProps {
  onOpenNewTakedown?: () => void;
}

export function TakedownsPage({ onOpenNewTakedown }: TakedownsPageProps) {
  const [filter, setFilter] = useState('all');
  const [activePacket, setActivePacket] = useState<ResponsePacket | null>(null);

  const takedownsList = [
    {
      id: 'TK-8492',
      target: '@acme.supportt (Instagram)',
      targetType: 'Profile Impersonation',
      destination: 'Meta Brand Rights Operations',
      policy: 'Meta Impersonation & Trademark Policy',
      submittedAt: 'Today, 10:14 AM',
      eta: '1-3 hours',
      status: 'In Review',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
      caseNumber: '#META-992140'
    },
    {
      id: 'TK-8491',
      target: 'Acme Wallet Pro (com.acme.fake.apk)',
      targetType: 'Rogue Mobile APK',
      destination: 'Google Play Protect & Abuse',
      policy: 'Malware & Impersonating Developer Policy',
      submittedAt: 'Yesterday, 4:20 PM',
      eta: 'Resolved',
      status: 'App Removed',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      caseNumber: '#GPLAY-44820'
    },
    {
      id: 'TK-8490',
      target: 'https://acme-offer.com',
      targetType: 'Phishing Landing Domain',
      destination: 'NameCheap Abuse Operations',
      policy: 'Phishing Hosting Suspension',
      submittedAt: 'Yesterday, 2:10 PM',
      eta: 'Resolved',
      status: 'Domain Suspended',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      caseNumber: '#NC-884102'
    },
    {
      id: 'TK-8489',
      target: '@AcmeAirdrop_OfficialBot (Telegram)',
      targetType: 'Scam Bot / Wallet Drainer',
      destination: 'Telegram @notoscam & Legal Desk',
      policy: 'Telegram Fraud & Abuse Terms',
      submittedAt: '2 days ago',
      eta: 'Under Review',
      status: 'Scam Flag Applied',
      statusColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      caseNumber: '#TG-1192'
    }
  ];

  const handleOpenPacket = (tk: any) => {
    setActivePacket({
      action_id: `action-${tk.id.toLowerCase()}`,
      campaign_id: `camp-${tk.id.toLowerCase()}`,
      campaign_title: `${tk.targetType}: ${tk.target}`,
      status: tk.status.toLowerCase().includes('resolved') ? 'simulated' : 'draft',
      created_at: new Date().toISOString(),
      drafts: [
        {
          recipient_type: 'meta',
          recipient_name: tk.destination,
          subject: `[TAKEDOWN REQUEST] Case ${tk.caseNumber} - ${tk.target}`,
          body_text: `ATTN: Abuse & Safety Operations\n\nWe formally submit evidence and notice of infringement for case ${tk.caseNumber}.\nTarget: ${tk.target}\nCategory: ${tk.targetType}\nPolicy Standard: ${tk.policy}\n\nEvidence hashes attached in manifest. Request immediate review and suspension pursuant to registered enterprise rights.`,
          contact_email: 'ip@operations.net',
          portal_url: 'https://security-portal.internal/cases/' + tk.caseNumber,
          policy_reference: tk.policy,
        },
        {
          recipient_type: 'google_play',
          recipient_name: 'Google Play & Android Protection Abuse Desk',
          subject: `[ABUSE NOTICE] Counterfeit Application Distribution - Case ${tk.caseNumber}`,
          body_text: `ATTN: Malware & Developer Impersonation Team\n\nTarget Asset: ${tk.target}\nAction: Malicious binary distribution / brand confusion.\nReview SLA: 24h expedited under Enterprise Brand Registry.`,
          contact_email: 'abuse@google.com',
          portal_url: 'https://support.google.com/contact/takedown',
          policy_reference: 'Google Play Malware & Impersonating Developer Policy',
        },
        {
          recipient_type: 'customer_advisory',
          recipient_name: 'Customer Safety & Trust Broadcast',
          subject: `SECURITY NOTICE: Advisory Regarding Impersonation (${tk.target})`,
          body_text: `Customer Warning:\nAn unauthorized entity (${tk.target}) was detected attempting to engage users. Please verify all interactions through official channels.`,
          contact_email: 'security-advisories@brand.org',
          portal_url: null,
          policy_reference: 'Enterprise Customer Trust & Disclosure Standard',
        }
      ],
      manifest: [
        {
          id: `ev-${tk.id}-1`,
          name: `Forensic-Capture-${tk.caseNumber.replace('#', '')}.png`,
          media_type: 'image/png',
          sha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
          captured_at: new Date().toISOString(),
          source_reference: tk.target,
          included: true,
        },
        {
          id: `ev-${tk.id}-2`,
          name: `Telemetry-Headers.json`,
          media_type: 'application/json',
          sha256: '9a5c89f5bc3e2b204928bcf627441517cf931d8e05e550c609c1fa6e9f2913b4',
          captured_at: new Date().toISOString(),
          source_reference: 'Astra Risk Intelligence Ingest Node',
          included: true,
        }
      ]
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Takedown Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track and expedite DMCA legal notices, platform abuse reports, and registrar takedowns
          </p>
        </div>

        <button
          onClick={() => {
            if (onOpenNewTakedown) {
              onOpenNewTakedown();
            } else {
              handleOpenPacket(takedownsList[0]);
            }
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          File New Takedown Dossier
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-slate-500">Total Takedowns Filed</div>
          <div className="text-2xl font-black text-slate-900 mt-1">142</div>
          <div className="text-[11px] text-slate-400 mt-1">Across 18 platforms</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-amber-700 font-semibold">In Active Review</div>
          <div className="text-2xl font-black text-amber-600 mt-1">8</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Avg 2.4 hrs response</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-emerald-600 font-semibold">Takedown Success Rate</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">96.4%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">137 confirmed removals</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-medium text-slate-500">Mean Time to Removal</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">3.8 hrs</div>
          <div className="text-[11px] text-indigo-500 font-medium mt-1">Automated evidence dossiers</div>
        </div>
      </div>

      {/* Takedowns Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <h2 className="text-base font-bold text-slate-900 mb-4">Active & Recent Takedown Requests</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-medium">Case & Target</th>
                <th className="pb-3 font-medium">Target Type</th>
                <th className="pb-3 font-medium">Destination Desk</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Submitted</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {takedownsList.map((tk) => (
                <tr key={tk.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 pr-3">
                    <div className="font-bold text-slate-900 font-mono">{tk.caseNumber}</div>
                    <div className="text-slate-600 font-medium mt-0.5">{tk.target}</div>
                  </td>

                  <td className="py-3.5 pr-3 text-slate-700 font-medium">
                    {tk.targetType}
                  </td>

                  <td className="py-3.5 pr-3 text-slate-500 font-mono text-[11px]">
                    <div>{tk.destination}</div>
                    <div className="text-slate-400 text-[10px]">{tk.policy}</div>
                  </td>

                  <td className="py-3.5 pr-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${tk.statusColor}`}>
                      {tk.status}
                    </span>
                  </td>

                  <td className="py-3.5 pr-3 text-slate-500 whitespace-nowrap text-[11px]">
                    {tk.submittedAt}
                  </td>

                  <td className="py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleOpenPacket(tk)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                    >
                      View Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Packet Modal */}
      {activePacket && (
        <ResponsePacketModal
          packet={activePacket}
          onClose={() => setActivePacket(null)}
          onActionSimulated={() => {}}
        />
      )}
    </div>
  );
}
