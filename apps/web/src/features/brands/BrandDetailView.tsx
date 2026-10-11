'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  ArrowLeft, 
  Plus, 
  ShieldCheck, 
  Globe, 
  Share2, 
  Smartphone, 
  Phone, 
  CreditCard, 
  UserCheck, 
  CheckCircle2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBrand, addBrandAsset, Brand, BrandAsset } from '@/lib/api';

interface BrandDetailViewProps {
  brandId: string;
}

export function BrandDetailView({ brandId }: BrandDetailViewProps) {
  const queryClient = useQueryClient();
  const [newAssetType, setNewAssetType] = useState('domain');
  const [newCanonicalVal, setNewCanonicalVal] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: brand, isLoading } = useQuery({
    queryKey: ['brand', brandId],
    queryFn: () => getBrand(brandId),
  });

  const addAssetMutation = useMutation({
    mutationFn: async () => {
      if (!newCanonicalVal.trim()) return null;
      return await addBrandAsset(brandId, newAssetType, newCanonicalVal.trim());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand', brandId] });
      setNewCanonicalVal('');
      setShowAddForm(false);
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading Brand DNA details...</div>;
  }

  if (!brand) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-400 text-sm">Brand not found or tenant session expired.</p>
        <Link href="/brands" className="text-indigo-400 text-xs font-semibold hover:underline">
          &larr; Back to Brand Registry
        </Link>
      </div>
    );
  }

  const domains = brand.assets?.filter(a => a.asset_type === 'domain') || [];
  const handles = brand.assets?.filter(a => a.asset_type === 'handle') || [];
  const apps = brand.assets?.filter(a => a.asset_type === 'mobile_app') || [];
  const executives = brand.assets?.filter(a => a.asset_type === 'executive') || [];
  const phones = brand.assets?.filter(a => a.asset_type === 'phone') || [];
  const upiIds = brand.assets?.filter(a => a.asset_type === 'upi_id') || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Back button & Title */}
      <div className="space-y-3">
        <Link
          href="/brands"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Brand DNA Registry</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {brand.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">{brand.name}</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {brand.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Brand UUID: {brand.id}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Brand Asset</span>
          </button>
        </div>
      </div>

      {/* Add Asset Form */}
      {showAddForm && (
        <div className="p-4 rounded-xl bg-slate-900 border border-indigo-700/50 space-y-3 animate-fade-in">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Register New Ground-Truth Asset
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Asset Category</label>
              <select
                value={newAssetType}
                onChange={(e) => setNewAssetType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="domain">Official Domain</option>
                <option value="handle">Social Handle (platform:handle)</option>
                <option value="mobile_app">Mobile App (platform:identifier)</option>
                <option value="phone">Official Phone</option>
                <option value="upi_id">Official UPI ID</option>
                <option value="executive">Protected Executive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Canonical Value</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. nilapay.in, x_twitter:nilapay_official, or nilapay@axisbank"
                  value={newCanonicalVal}
                  onChange={(e) => setNewCanonicalVal(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => addAssetMutation.mutate()}
                  disabled={addAssetMutation.isPending || !newCanonicalVal.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow cursor-pointer"
                >
                  {addAssetMutation.isPending ? 'Saving...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Domains */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Official Domains ({domains.length})</h3>
            </div>
            <span className="text-[11px] text-slate-400">DNS &amp; Registrar Anchor</span>
          </div>
          <div className="space-y-2">
            {domains.map((asset) => (
              <div key={asset.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-mono text-blue-300 font-medium">{asset.canonical_value}</span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Social Handles */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold text-white">Monitored Handles ({handles.length})</h3>
            </div>
            <span className="text-[11px] text-slate-400">Social Baseline</span>
          </div>
          <div className="space-y-2">
            {handles.map((asset) => (
              <div key={asset.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-mono text-pink-300 font-medium">{asset.canonical_value}</span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Official Mobile Apps & APK certs */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Official Mobile Apps ({apps.length})</h3>
            </div>
            <span className="text-[11px] text-slate-400">APK Cert Hash</span>
          </div>
          <div className="space-y-2">
            {apps.map((asset) => (
              <div key={asset.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-300 font-medium">{asset.canonical_value}</span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Payments & UPI IDs */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Payment &amp; UPI IDs ({upiIds.length + phones.length})</h3>
            </div>
            <span className="text-[11px] text-slate-400">Financial Invariant</span>
          </div>
          <div className="space-y-2">
            {upiIds.map((asset) => (
              <div key={asset.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-mono text-amber-300 font-medium">{asset.canonical_value}</span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Legitimate Payee
                </span>
              </div>
            ))}
            {phones.map((asset) => (
              <div key={asset.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-mono text-sky-300 font-medium">Phone: {asset.canonical_value}</span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Official Helpdesk
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
