'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  ChevronDown, 
  Terminal,
  ShieldAlert,
  Play
} from 'lucide-react';
import { BrandAssetRegistry } from '@/types/threat';

interface NavbarProps {
  brand: BrandAssetRegistry;
  onOpenBrandRegistry: () => void;
  onOpenManualAnalyzer: () => void;
  onSearchChange?: (val: string) => void;
  notificationCount?: number;
}

export function Navbar({
  brand,
  onOpenBrandRegistry,
  onOpenManualAnalyzer,
  onSearchChange,
  notificationCount = 1
}: NavbarProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xs px-5 flex items-center justify-between gap-4 shrink-0 text-slate-100">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={handleSearch}
          placeholder="Filter sandbox sightings, APK hashes, or lookalike handles..."
          className="w-full bg-slate-950/80 hover:bg-slate-950 focus:bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-10 pr-10 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition shadow-2xs font-sans"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono font-medium pointer-events-none">
          <span>⌘K</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenManualAnalyzer}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Simulate Attack</span>
        </button>

        <button
          onClick={onOpenBrandRegistry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5 text-slate-400" />
          <span>Brand Assets</span>
        </button>
      </div>
    </header>
  );
}
