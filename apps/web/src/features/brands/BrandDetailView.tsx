'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Globe, 
  Share2, 
  Smartphone, 
  Phone, 
  CreditCard, 
  UserCheck, 
  CheckCircle2,
  Trash2,
  ExternalLink,
  Clock,
  AlertCircle,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  X,
  FileCode2,
  Lock,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getBrand, 
  addBrandAsset, 
  initiateDnsChallenge, 
  verifyDnsRecord, 
  verifyAssetManual, 
  deleteBrandAsset,
  Brand, 
  BrandAsset,
  DnsChallengeInstructions
} from '@/lib/api';

interface BrandDetailViewProps {
  brandId: string;
}

export function BrandDetailView({ brandId }: BrandDetailViewProps) {
  const queryClient = useQueryClient();
  const [newAssetType, setNewAssetType] = useState('domain');
  const [newCanonicalVal, setNewCanonicalVal] = useState('');
  const [newCertFingerprint, setNewCertFingerprint] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // DNS Verification Modal state
  const [selectedDomainAsset, setSelectedDomainAsset] = useState<BrandAsset | null>(null);
  const [dnsInstructions, setDnsInstructions] = useState<DnsChallengeInstructions | null>(null);
  const [isChallengeLoading, setIsChallengeLoading] = useState(false);
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [dnsVerificationError, setDnsVerificationError] = useState<string | null>(null);
  const [dnsVerificationSuccess, setDnsVerificationSuccess] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Manual Verification Modal state
  const [manualVerifyAsset, setManualVerifyAsset] = useState<BrandAsset | null>(null);
  const [manualReason, setManualReason] = useState('');
  const [isManualVerifying, setIsManualVerifying] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const { data: brand, isLoading } = useQuery({
    queryKey: ['brand', brandId],
    queryFn: () => getBrand(brandId),
  });

  const addAssetMutation = useMutation({
    mutationFn: async () => {
      if (!newCanonicalVal.trim()) return null;
      const metadata = newCertFingerprint.trim() 
        ? { cert_fingerprint: newCertFingerprint.trim().toUpperCase() } 
        : {};
      return await addBrandAsset(brandId, newAssetType, newCanonicalVal.trim(), metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand', brandId] });
      setNewCanonicalVal('');
      setNewCertFingerprint('');
      setShowAddForm(false);
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      await deleteBrandAsset(brandId, assetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand', brandId] });
    },
  });

  const handleOpenDnsChallenge = async (asset: BrandAsset) => {
    setSelectedDomainAsset(asset);
    setDnsVerificationError(null);
    setDnsVerificationSuccess(null);
    setIsChallengeLoading(true);

    try {
      const instructions = await initiateDnsChallenge(brandId, asset.id);
      setDnsInstructions(instructions);
      queryClient.invalidateQueries({ queryKey: ['brand', brandId] });
    } catch (err: any) {
      setDnsVerificationError(err.message || 'Failed to initiate DNS challenge.');
    } finally {
      setIsChallengeLoading(false);
    }
  };

  const handleVerifyDnsNow = async () => {
    if (!selectedDomainAsset) return;
    setIsVerifyingDns(true);
    setDnsVerificationError(null);
    setDnsVerificationSuccess(null);

    try {
      const updatedAsset = await verifyDnsRecord(brandId, selectedDomainAsset.id);
      setSelectedDomainAsset(updatedAsset);
      setDnsVerificationSuccess('Domain ownership verified successfully! Live status updated to Verified.');
      queryClient.invalidateQueries({ queryKey: ['brand', brandId] });
    } catch (err: any) {
      setDnsVerificationError(err.message || 'DNS verification failed. TXT record not found or DNS propagation still in progress.');
    } finally {
      setIsVerifyingDns(false);
    }
  };

  const handleManualAttestation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualVerifyAsset || !manualReason.trim()) return;
    setIsManualVerifying(true);
    setManualError(null);

    try {
      await verifyAssetManual(brandId, manualVerifyAsset.id, manualReason.trim());
      queryClient.invalidateQueries({ queryKey: ['brand', brandId] });
      setManualVerifyAsset(null);
      setManualReason('');
    } catch (err: any) {
      setManualError(err.message || 'Failed to submit manual verification attestation.');
    } finally {
      setIsManualVerifying(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading Brand DNA details...</div>;
  }

  if (!brand) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-400 text-sm">Brand not found or tenant session expired.</p>
        <Link href="/brands" className="text-cyan-400 text-xs font-semibold hover:underline">
          &larr; Back to Brand Registry
        </Link>
      </div>
    );
  }

  const domains = brand.assets?.filter(a => a.asset_type === 'domain' || a.asset_type === 'web_domain') || [];
  const handles = brand.assets?.filter(a => a.asset_type === 'handle') || [];
  const apps = brand.assets?.filter(a => a.asset_type === 'mobile_app' || a.asset_type === 'mobile_app_pkg') || [];
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
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
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Brand Asset</span>
          </button>
        </div>
      </div>

      {/* Add Asset Form */}
      {showAddForm && (
        <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-4 animate-fade-in">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Register Ground-Truth Reference Asset
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Asset Category</label>
              <select
                value={newAssetType}
                onChange={(e) => setNewAssetType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                <option value="domain">Official Domain (DNS Verifiable)</option>
                <option value="mobile_app_pkg">Mobile App (Package Name + Cert)</option>
                <option value="handle">Social Handle (platform:handle)</option>
                <option value="phone">Official Support Phone</option>
                <option value="upi_id">Official Payment UPI ID</option>
                <option value="executive">Protected Executive Identity</option>
              </select>
            </div>

            <div className={newAssetType === 'mobile_app_pkg' ? 'md:col-span-1' : 'md:col-span-2'}>
              <label className="block text-[11px] text-slate-400 mb-1">
                {newAssetType === 'domain' ? 'Domain Name (without https://)' :
                 newAssetType === 'mobile_app_pkg' ? 'App Package Identifier' :
                 'Canonical Identifier / Value'}
              </label>
              <input
                type="text"
                placeholder={
                  newAssetType === 'domain' ? 'e.g. apexfintech.com' :
                  newAssetType === 'mobile_app_pkg' ? 'e.g. com.apex.banking' :
                  'e.g. x_twitter:apex_official or support@apex.com'
                }
                value={newCanonicalVal}
                onChange={(e) => setNewCanonicalVal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {newAssetType === 'mobile_app_pkg' && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Signing Certificate SHA-256 (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 14:28:AB:39:... or 64 hex characters"
                  value={newCertFingerprint}
                  onChange={(e) => setNewCertFingerprint(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => addAssetMutation.mutate()}
              disabled={addAssetMutation.isPending || !newCanonicalVal.trim()}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 rounded-lg text-xs font-bold shadow cursor-pointer transition flex items-center gap-1.5"
            >
              {addAssetMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{addAssetMutation.isPending ? 'Registering...' : 'Save Asset'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Official Domains (With Live DNS Verification) */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Official Domains ({domains.length})</h3>
            </div>
            <span className="text-[11px] text-slate-400">DNS Ownership Verification</span>
          </div>

          <div className="space-y-3">
            {domains.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No domains registered. Add a domain to verify ownership.</p>
            ) : (
              domains.map((asset) => {
                const isVerified = asset.verification_status === 'verified';
                const isPending = asset.verification_status === 'pending_challenge';

                return (
                  <div key={asset.id} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-cyan-300 font-semibold">{asset.canonical_value}</span>
                      
                      {/* Truthful Verification Badge */}
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Verified (DNS)
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3 h-3 animate-pulse" /> Pending DNS Probe
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          <AlertCircle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenDnsChallenge(asset)}
                          className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isVerified ? 'View DNS Token' : isPending ? 'Check DNS Record' : 'Verify via DNS TXT'}</span>
                        </button>

                        {!isVerified && (
                          <button
                            onClick={() => { setManualVerifyAsset(asset); setManualReason(''); }}
                            className="text-slate-400 hover:text-slate-200 text-[10px] hover:underline cursor-pointer"
                          >
                            Manual Attestation
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => deleteAssetMutation.mutate(asset.id)}
                        title="Delete asset"
                        className="text-slate-500 hover:text-rose-400 transition cursor-pointer p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 2: Official Mobile Apps & APK Certs */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Official Mobile Apps ({apps.length})</h3>
            </div>
            <span className="text-[11px] text-slate-400">Package &amp; Signing Fingerprint</span>
          </div>

          <div className="space-y-3">
            {apps.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No mobile app packages enrolled. Add app package ID to enable radar forensics.</p>
            ) : (
              apps.map((asset) => {
                const cert = asset.metadata?.cert_fingerprint || asset.sha256;
                return (
                  <div key={asset.id} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-emerald-300 font-semibold">{asset.canonical_value}</div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <Lock className="w-3 h-3" /> Ground-Truth Anchor
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 bg-black/30 p-2 rounded border border-white/5 truncate">
                      <span className="text-slate-500">Cert SHA-256: </span>
                      {cert ? <span className="text-slate-300">{cert}</span> : <span className="text-amber-500/80 italic">No cert hash configured</span>}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => deleteAssetMutation.mutate(asset.id)}
                        title="Delete asset"
                        className="text-slate-500 hover:text-rose-400 transition cursor-pointer p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 3: Social Handles */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold text-white">Monitored Social Handles ({handles.length})</h3>
            </div>
            <span className="text-[11px] text-slate-400">Impersonation Baseline</span>
          </div>

          <div className="space-y-2">
            {handles.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No social handles configured.</p>
            ) : (
              handles.map((asset) => (
                <div key={asset.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-mono text-pink-300 font-medium">{asset.canonical_value}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-pink-500/10 text-pink-300 border border-pink-500/20">
                      Registered
                    </span>
                    <button
                      onClick={() => deleteAssetMutation.mutate(asset.id)}
                      className="text-slate-500 hover:text-rose-400 transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 4: Payments & Support */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Payment &amp; Support Channels ({upiIds.length + phones.length})</h3>
            </div>
            <span className="text-[11px] text-slate-400">Financial Scam Defense</span>
          </div>

          <div className="space-y-2">
            {upiIds.length === 0 && phones.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No payment or support channels registered.</p>
            ) : (
              <>
                {upiIds.map((asset) => (
                  <div key={asset.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-mono text-amber-300 font-medium">UPI: {asset.canonical_value}</span>
                    <button
                      onClick={() => deleteAssetMutation.mutate(asset.id)}
                      className="text-slate-500 hover:text-rose-400 transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {phones.map((asset) => (
                  <div key={asset.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-mono text-sky-300 font-medium">Support: {asset.canonical_value}</span>
                    <button
                      onClick={() => deleteAssetMutation.mutate(asset.id)}
                      className="text-slate-500 hover:text-rose-400 transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* DNS TXT Verification Modal */}
      {selectedDomainAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#0d1522] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <Globe className="h-5 w-5 text-cyan-400" />
                <div>
                  <h2 className="text-sm font-semibold text-white">DNS TXT Domain Ownership Verification</h2>
                  <p className="text-[11px] text-slate-400">Domain: {selectedDomainAsset.canonical_value}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedDomainAsset(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {isChallengeLoading ? (
                <div className="py-12 flex items-center justify-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Generating cryptographic challenge token...</span>
                </div>
              ) : (
                <>
                  {dnsVerificationSuccess && (
                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{dnsVerificationSuccess}</span>
                    </div>
                  )}

                  {dnsVerificationError && (
                    <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">DNS Verification Failed</p>
                        <p className="text-[11px] text-rose-300/80 mt-0.5">{dnsVerificationError}</p>
                      </div>
                    </div>
                  )}

                  {dnsInstructions && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        To prove authoritative ownership of <strong className="text-white font-mono">{selectedDomainAsset.canonical_value}</strong>, please add the following DNS TXT record in your DNS provider (e.g., Cloudflare, Route53, Namecheap):
                      </p>

                      <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Record Name / Host:</span>
                            <button
                              onClick={() => copyToClipboard(dnsInstructions.record_name || '', 'name')}
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px]"
                            >
                              {copiedField === 'name' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'name' ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <div className="font-mono text-xs bg-slate-950 p-2.5 rounded border border-white/10 text-cyan-300 select-all">
                            {dnsInstructions.record_name}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Record Value (Token):</span>
                            <button
                              onClick={() => copyToClipboard(dnsInstructions.record_value || '', 'val')}
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px]"
                            >
                              {copiedField === 'val' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'val' ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <div className="font-mono text-xs bg-slate-950 p-2.5 rounded border border-white/10 text-emerald-300 select-all break-all">
                            {dnsInstructions.record_value}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                          <span>Type: <strong className="text-white">TXT</strong></span>
                          <span>TTL: <strong className="text-white">300 (or Automatic)</strong></span>
                        </div>
                      </div>

                      <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5 text-[11px] text-slate-400 space-y-1">
                        <div className="font-semibold text-slate-300">Terminal verification command:</div>
                        <div className="font-mono text-[10px] text-slate-400 bg-slate-950 p-1.5 rounded">
                          dig TXT {dnsInstructions.record_name} +short
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[11px] text-slate-500">
                      DNS propagation typically takes 1–5 minutes.
                    </span>

                    <button
                      onClick={handleVerifyDnsNow}
                      disabled={isVerifyingDns}
                      className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                    >
                      {isVerifyingDns ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Probing Live DNS...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Verify DNS Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Attestation Modal */}
      {manualVerifyAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0d1522] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-white/[0.02]">
              <h2 className="text-sm font-semibold text-white">Analyst Manual Attestation</h2>
              <button 
                type="button" 
                onClick={() => setManualVerifyAsset(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualAttestation} className="p-6 space-y-4">
              <p className="text-xs text-slate-300">
                Provide an audit-logged justification for manually verifying <strong className="text-white font-mono">{manualVerifyAsset.canonical_value}</strong>.
              </p>

              {manualError && (
                <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-xs text-rose-300">
                  {manualError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Verification Evidence / Attestation Reason:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Verified domain registrant via WHOIS and corporate procurement invoice."
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualVerifyAsset(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isManualVerifying || !manualReason.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {isManualVerifying ? 'Attesting...' : 'Confirm Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
