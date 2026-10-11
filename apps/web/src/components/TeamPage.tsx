'use client';

import React from 'react';
import { 
  Users, 
  UserCheck, 
  Shield, 
  Mail, 
  Plus, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export function TeamPage() {
  const teamMembers = [
    {
      name: 'Elena Rostova',
      email: 'elena@astra.security',
      role: 'Head of Brand Protection',
      accessLevel: 'Admin / Full Authority',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      lastActive: '5 mins ago'
    },
    {
      name: 'Alex Mercer',
      email: 'alex@astra.security',
      role: 'Chief Information Security Officer',
      accessLevel: 'Security Admin',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      lastActive: '2 hours ago'
    },
    {
      name: 'Sarah Jenkins',
      email: 'sarah.j@astra.security',
      role: 'Lead Threat Analyst',
      accessLevel: 'Triage & Takedown Analyst',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      lastActive: 'Just now'
    },
    {
      name: 'Marcus Vance',
      email: 'marcus.v@astra.security',
      role: 'Legal & Intellectual Property Counsel',
      accessLevel: 'Legal Officer / DMCA Signer',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      lastActive: 'Yesterday'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Team & Access Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage SOC security analysts, legal takedown signers, and role-based permissions
          </p>
        </div>

        <button
          onClick={() => {}}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Invite Team Member
        </button>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <h2 className="text-base font-bold text-slate-900">Security Operations Team</h2>

        <div className="divide-y divide-slate-100">
          {teamMembers.map((member, i) => (
            <div key={i} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{member.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{member.email}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">{member.role}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-medium">
                  {member.accessLevel}
                </span>

                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {member.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
