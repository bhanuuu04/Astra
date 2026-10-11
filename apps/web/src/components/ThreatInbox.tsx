'use client';

import React, { useState, useMemo } from 'react';
import { 
  SocialMessage, 
  SocialPlatform, 
  ThreatSeverity 
} from '@/types/threat';
import { 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Smartphone, 
  CheckCircle2, 
  AlertOctagon, 
  UserX, 
  Globe 
} from 'lucide-react';

interface ThreatInboxProps {
  messages: SocialMessage[];
  selectedMessageId: string | null;
  onSelectMessage: (message: SocialMessage) => void;
}

export function ThreatInbox({
  messages,
  selectedMessageId,
  onSelectMessage
}: ThreatInboxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // Platform filter
      if (selectedPlatform !== 'all' && msg.platform !== selectedPlatform) {
        return false;
      }

      // Severity filter
      if (selectedSeverity !== 'all' && msg.analysis.severity !== selectedSeverity) {
        return false;
      }

      // Category filter
      if (filterCategory !== 'all') {
        if (filterCategory === 'rogue_app' && !msg.analysis.fakeMobileAppDetected) {
          return false;
        }
        if (filterCategory === 'impersonator' && msg.analysis.impersonationScore < 50) {
          return false;
        }
        if (filterCategory === 'phishing' && !msg.analysis.maliciousPayloadDetected) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSender = 
          msg.sender.username.toLowerCase().includes(query) ||
          msg.sender.displayName.toLowerCase().includes(query);
        const matchesContent = msg.content.toLowerCase().includes(query);
        const matchesIndicators = msg.analysis.indicators.some(i => 
          i.title.toLowerCase().includes(query) || i.evidence.toLowerCase().includes(query)
        );
        return matchesSender || matchesContent || matchesIndicators;
      }

      return true;
    });
  }, [messages, selectedPlatform, selectedSeverity, filterCategory, searchQuery]);

  const platformBadge = (platform: SocialPlatform) => {
    switch (platform) {
      case 'x_twitter':
        return { label: 'X (Twitter)', color: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'instagram':
        return { label: 'Instagram', color: 'bg-pink-50 text-pink-700 border-pink-200' };
      case 'telegram':
        return { label: 'Telegram', color: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'linkedin':
        return { label: 'LinkedIn', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'discord':
        return { label: 'Discord', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: platform, color: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  const severityBadge = (severity: ThreatSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          label: 'CRITICAL',
          icon: AlertOctagon,
          classes: 'bg-red-50 text-red-700 border-red-300 font-bold'
        };
      case 'high':
        return {
          label: 'HIGH RISK',
          icon: AlertTriangle,
          classes: 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
        };
      case 'medium':
        return {
          label: 'MEDIUM',
          icon: AlertTriangle,
          classes: 'bg-yellow-50 text-yellow-800 border-yellow-300'
        };
      case 'low':
      case 'clean':
        return {
          label: 'CLEAN',
          icon: ShieldCheck,
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-300'
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Search and Filters Header */}
      <div className="p-4 border-b border-slate-200 space-y-3 shrink-0 bg-slate-50/70">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Threat Inbox</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-xs text-slate-700 font-mono font-semibold">
                {filteredMessages.length} Messages
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Live inbound Direct Messages across all connected channels
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sender handle, keyword, domain, or APK..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-600 shadow-xs transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Selects */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-600 shadow-xs"
          >
            <option value="all">All Platforms</option>
            <option value="x_twitter">X (Twitter)</option>
            <option value="instagram">Instagram</option>
            <option value="telegram">Telegram</option>
            <option value="linkedin">LinkedIn</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-600 shadow-xs"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Threats</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium</option>
            <option value="clean">Clean Messages</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-600 shadow-xs"
          >
            <option value="all">All Attack Vectors</option>
            <option value="rogue_app">Rogue Mobile Apps / APKs</option>
            <option value="impersonator">Brand Impersonators</option>
            <option value="phishing">Phishing URLs</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-medium text-slate-700">No messages matched your filter</p>
            <p className="text-xs">Adjust your search or filter criteria above</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isSelected = selectedMessageId === msg.id;
            const pBadge = platformBadge(msg.platform);
            const sBadge = severityBadge(msg.analysis.severity);
            const SeverityIcon = sBadge.icon;

            return (
              <div
                key={msg.id}
                onClick={() => onSelectMessage(msg)}
                className={`p-4 transition cursor-pointer relative ${
                  isSelected
                    ? 'bg-cyan-50/70 border-l-4 border-l-cyan-600 shadow-xs'
                    : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                }`}
              >
                {/* Top Row: Platform, Severity & Timestamp */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${pBadge.color} font-medium`}>
                      {pBadge.label}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${sBadge.classes}`}>
                      <SeverityIcon className="w-3 h-3" />
                      {sBadge.label} ({msg.analysis.riskScore})
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Sender Details */}
                <div className="flex items-start gap-3 mb-2">
                  <img
                    src={msg.sender.avatarUrl}
                    alt={msg.sender.displayName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {msg.sender.displayName}
                      </span>
                      {msg.sender.isFakeBadgeEmoji && (
                        <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-1 py-0.2 rounded font-mono font-bold">
                          Fake Badge Emoji
                        </span>
                      )}
                      {msg.sender.isVerifiedBadge && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-1 py-0.2 rounded font-mono font-medium">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      @{msg.sender.username}
                    </div>
                  </div>
                </div>

                {/* Message Content Snippet */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2.5">
                  {msg.content}
                </p>

                {/* Threat Tags / Detected Artifacts */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {msg.analysis.fakeMobileAppDetected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                      <Smartphone className="w-2.5 h-2.5" />
                      Rogue Mobile APK
                    </span>
                  )}
                  {msg.analysis.impersonationScore >= 50 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                      <UserX className="w-2.5 h-2.5" />
                      Impersonator ({msg.analysis.impersonationScore}%)
                    </span>
                  )}
                  {msg.analysis.maliciousPayloadDetected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                      <Globe className="w-2.5 h-2.5" />
                      Phishing URL
                    </span>
                  )}
                  {msg.status === 'quarantined' && (
                    <span className="ml-auto text-[10px] font-mono text-red-600 uppercase font-bold">
                      [QUARANTINED]
                    </span>
                  )}
                  {msg.status === 'resolved' && (
                    <span className="ml-auto text-[10px] font-mono text-emerald-700 uppercase font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Safe
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
