'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Network, 
  Bell, 
  Layers, 
  ShieldAlert, 
  Play, 
  RotateCcw, 
  RefreshCw,
  CreditCard, 
  Globe, 
  Smartphone, 
  X, 
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Hash,
  CornerDownLeft,
  Sparkles
} from 'lucide-react';
import { runAnalysisJob, resetDemo } from '@/lib/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'actions' | 'campaigns' | 'indicators'>('all');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleAction = async (actionFn: () => Promise<any>, successMsg: string) => {
    try {
      setActionFeedback('Executing...');
      await actionFn();
      setActionFeedback(successMsg);
      setTimeout(() => {
        setActionFeedback(null);
        onClose();
      }, 1500);
    } catch {
      setActionFeedback('Action failed');
      setTimeout(() => setActionFeedback(null), 2000);
    }
  };

  const commands = [
    // Navigation
    {
      id: 'nav-overview',
      category: 'navigation',
      title: 'Go to Overview Deck',
      subtitle: 'SOC investigation overview and threat surface metrics',
      icon: Layers,
      action: () => { router.push('/overview'); onClose(); }
    },
    {
      id: 'nav-campaigns',
      category: 'campaigns',
      title: 'Open Campaign Graph',
      subtitle: 'Interactive pivot correlation graph and edge inspection',
      icon: Network,
      badge: 'Active',
      action: () => { router.push('/campaigns'); onClose(); }
    },
    {
      id: 'nav-sightings',
      category: 'navigation',
      title: 'Sightings Telemetry Queue',
      subtitle: 'Multi-surface raw evidence feeds from Instagram, APK, and Telegram',
      icon: Bell,
      badge: '5 Items',
      action: () => { router.push('/sightings'); onClose(); }
    },
    {
      id: 'nav-brands',
      category: 'navigation',
      title: 'Brand DNA Registry',
      subtitle: 'Official assets, package names, domains, and payment rails for enrolled brands',
      icon: ShieldCheck,
      action: () => { router.push('/brands'); onClose(); }
    },
    {
      id: 'nav-tour',
      category: 'navigation',
      title: 'Commercial Product Tour',
      subtitle: 'Executive overview, architecture pillars, and capabilities summary',
      icon: Sparkles,
      badge: 'Tour',
      action: () => { router.push('/landing'); onClose(); }
    },
    // Rapid Analyst Actions
    {
      id: 'act-run-detectors',
      category: 'actions',
      title: 'Run Brand DNA Detector Pipeline',
      subtitle: 'Execute homoglyph, phishing, and APK decompilation detectors',
      icon: Play,
      badge: 'Pipeline',
      action: () => handleAction(() => runAnalysisJob(), 'Detector pipeline completed!')
    },
    {
      id: 'act-sync-telemetry',
      category: 'actions',
      title: 'Sync Live Findings & Sightings',
      subtitle: 'Poll latest database sightings and threat signals',
      icon: RefreshCw,
      badge: 'Sync',
      action: () => handleAction(() => queryClient.invalidateQueries(), 'Telemetry cache refreshed!')
    },
    // Pivot Indicators
    {
      id: 'ind-upi',
      category: 'indicators',
      title: 'Pivot: fraudster@okhdfcbank',
      subtitle: 'Flagged fraudulent UPI handle linked across Instagram and Telegram',
      icon: CreditCard,
      badge: 'UPI Handle',
      action: () => { router.push('/campaigns'); onClose(); }
    },
    {
      id: 'ind-domain',
      category: 'indicators',
      title: 'Pivot: astra-mobile-update.top',
      subtitle: 'Lookalike credential harvesting domain hosting APK payloads',
      icon: Globe,
      badge: 'Phishing Domain',
      action: () => { router.push('/campaigns'); onClose(); }
    },
    {
      id: 'ind-apk',
      category: 'indicators',
      title: 'Pivot: com.astra.security.patch.updater',
      subtitle: 'Trojanized APK package attempting SMS/TOTP interception',
      icon: Smartphone,
      badge: 'Rogue APK',
      action: () => { router.push('/campaigns'); onClose(); }
    },
  ];

  const filtered = commands.filter((c) => {
    const matchesCategory = activeCategory === 'all' || c.category === activeCategory;
    const matchesQuery = 
      query.trim() === '' ||
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Full keyboard navigation: ArrowUp, ArrowDown, Enter, Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length === 0 ? 0 : (prev + 1) % filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length === 0 ? 0 : (prev - 1 + filtered.length) % filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white border border-[#e3e2e0] rounded-[8px] shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[#e3e2e0] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#0f7b6c] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or indicator, use ↑↓ to navigate, ↵ to select..."
            autoFocus
            className="flex-1 bg-transparent border-none text-sm text-[#37352f] placeholder-[#9b9a97] focus:outline-none"
          />
          {actionFeedback && (
            <span className="text-xs px-2.5 py-1 rounded-[4px] bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/30 font-medium">
              {actionFeedback}
            </span>
          )}
          <button 
            onClick={onClose} 
            className="p-1 rounded-[4px] text-[#787774] hover:text-[#37352f] hover:bg-[#f7f6f3] cursor-pointer"
            aria-label="Close command palette"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-4 py-2 border-b border-[#e3e2e0] bg-[#f7f6f3] flex items-center gap-1.5 overflow-x-auto">
          {(['all', 'actions', 'campaigns', 'indicators'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-[6px] text-xs font-medium capitalize transition cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/30 font-semibold'
                  : 'text-[#787774] hover:text-[#37352f] hover:bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Command Items List with Active Selection Highlight */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#787774]">
              No matching commands or indicators found for &quot;{query}&quot;.
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full p-3 rounded-[6px] transition flex items-center justify-between text-left cursor-pointer ${
                    isSelected
                      ? 'bg-[#f7f6f3] shadow-[inset_3px_0_0_#0f7b6c] text-[#37352f]'
                      : 'hover:bg-[#f7f6f3]/60 text-[#37352f] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0 transition ${
                      isSelected
                        ? 'bg-[#0f7b6c] text-white shadow-xs'
                        : 'bg-[#f7f6f3] border border-[#e3e2e0] text-[#787774]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold truncate ${
                          isSelected ? 'text-[#0f7b6c]' : 'text-[#37352f]'
                        }`}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-[4px] bg-[#f7f6f3] text-[#787774] border border-[#e3e2e0]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#787774] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  {isSelected ? (
                    <div className="flex items-center gap-1 text-xs text-[#0f7b6c] font-mono shrink-0 ml-3">
                      <span>Execute</span>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-[#9b9a97] shrink-0 ml-3" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2 border-t border-[#e3e2e0] bg-[#f7f6f3] flex items-center justify-between text-xs text-[#787774] font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded-[3px] bg-white border border-[#e3e2e0] text-[#37352f]">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded-[3px] bg-white border border-[#e3e2e0] text-[#37352f]">↵</kbd> Select</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded-[3px] bg-white border border-[#e3e2e0] text-[#37352f]">ESC</kbd> Close</span>
          </div>
          <span className="text-[#0f7b6c] font-semibold font-sans hidden sm:inline">ASTRA Command Deck</span>
        </div>
      </div>
    </div>
  );
}
