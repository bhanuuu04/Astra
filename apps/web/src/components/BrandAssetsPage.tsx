'use client';

import React, { useState } from 'react';
import { 
  Layers, 
  Building2, 
  Globe, 
  Smartphone, 
  UserCheck, 
  Plus, 
  Check, 
  ExternalLink,
  Trash2,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { BrandAssetRegistry } from '@/types/threat';

interface BrandAssetsPageProps {
  brand: BrandAssetRegistry;
  onSaveBrand: (updated: BrandAssetRegistry) => void;
}

export function BrandAssetsPage({
  brand,
  onSaveBrand
}: BrandAssetsPageProps) {
  const [brandName, setBrandName] = useState(brand.brandName);
  const [legalEntity, setLegalEntity] = useState(brand.legalEntity);
  const [contactEmail, setContactEmail] = useState(brand.contactEmail);
  const [domains, setDomains] = useState(brand.officialDomains);
  const [newDomain, setNewDomain] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setDomains([...domains, newDomain.trim().toLowerCase()]);
    setNewDomain('');
  };

  const handleRemoveDomain = (dom: string) => {
    setDomains(domains.filter(d => d !== dom));
  };

  const handleSaveAll = () => {
    onSaveBrand({
      ...brand,
      brandName,
      legalEntity,
      contactEmail,
      officialDomains: domains
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Brand Assets & Identity Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define your authorized digital footprint. Astra uses this ground truth to detect lookalikes and unauthorized clones.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
        >
          {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
          {savedSuccess ? 'Saved!' : 'Save Asset Registry'}
        </button>
      </div>

      {/* Brand Identity Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          Primary Corporate Identity
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-slate-600 font-medium">Brand / Trademark Name</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white font-sans text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 font-medium">Legal Corporate Entity</label>
            <input
              type="text"
              value={legalEntity}
              onChange={(e) => setLegalEntity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white font-sans text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 font-medium">Security & Abuse Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
            />
          </div>
        </div>
      </div>

      {/* Authorized Domains */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            Authorized Official Domains
          </h2>
          <span className="text-xs text-slate-400 font-mono font-medium">{domains.length} Whitelisted</span>
        </div>

        <form onSubmit={handleAddDomain} className="flex gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="e.g. yourcompany.com"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Domain
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {domains.map((dom, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-900">{dom}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDomain(dom)}
                className="text-slate-400 hover:text-red-600 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Official Social Handles & Monitored Profiles */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Verified Brand Social Profiles
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {brand.officialHandles.map((h, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">{h.platform.replace('_', ' ')}</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">@{h.handle}</div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                Authorized
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Official Mobile Apps */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-600" />
          Official Mobile Applications
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brand.officialMobileApps.map((app, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-mono">
              <div>
                <div className="font-bold text-slate-900 text-sm">{app.name} ({app.platform.toUpperCase()})</div>
                <div className="text-emerald-700 font-semibold mt-1">Package: {app.identifier}</div>
              </div>
              <a href={app.storeUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-800 transition">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
