'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  Plus, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Globe, 
  Share2, 
  Smartphone, 
  CreditCard, 
  Phone, 
  UserCheck,
  X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { listBrands, createBrand, Brand } from '@/lib/api';

const brandEnrollmentSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  legalEntity: z.string().optional(),
  primaryDomain: z.string().trim().regex(
    /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i,
    'Enter a valid domain without https:// (e.g. brand.com)',
  ),
  twitterHandle: z.string().optional(),
  instagramHandle: z.string().optional(),
  linkedinHandle: z.string().optional(),
  facebookHandle: z.string().optional(),
  youtubeHandle: z.string().optional(),
  logoUrl: z.string().url('Enter a valid logo URL').optional().or(z.literal('')),
  supportEmail: z.string().email('Enter a valid contact email').optional().or(z.literal('')),
  appPackageId: z.string().optional(),
  appName: z.string().optional(),
  appPlatform: z.string().optional(),
  appStoreUrl: z.string().url('Enter a valid app store URL').optional().or(z.literal('')),
  certFingerprint: z.string().optional(),
  supportPhone: z.string().optional(),
  upiId: z.string().optional(),
});

type BrandEnrollmentFormValues = z.infer<typeof brandEnrollmentSchema>;

export function BrandRegistryView() {
  const queryClient = useQueryClient();
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const { data: brands = [], isLoading, isError, error } = useQuery({
    queryKey: ['brands'],
    queryFn: () => listBrands(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandEnrollmentFormValues>({
    resolver: zodResolver(brandEnrollmentSchema),
    defaultValues: {
      name: '',
      primaryDomain: '',
      twitterHandle: '',
      instagramHandle: '',
      linkedinHandle: '',
      facebookHandle: '',
      youtubeHandle: '',
      logoUrl: '',
      supportEmail: '',
      appPackageId: '',
      appName: '',
      appPlatform: 'Android',
      appStoreUrl: '',
      certFingerprint: '',
      supportPhone: '',
      upiId: '',
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (values: BrandEnrollmentFormValues) => {
      const assets: Array<{ asset_type: string; canonical_value: string; metadata?: Record<string, any> }> = [
        { asset_type: 'domain', canonical_value: values.primaryDomain },
      ];
      if (values.twitterHandle) {
        assets.push({ asset_type: 'handle', canonical_value: `x_twitter:${values.twitterHandle}` });
      }
      if (values.instagramHandle) {
        assets.push({ asset_type: 'handle', canonical_value: `instagram:${values.instagramHandle}` });
      }
      for (const [platform, value] of [['linkedin', values.linkedinHandle], ['facebook', values.facebookHandle], ['youtube', values.youtubeHandle]] as const) {
        if (value?.trim()) assets.push({ asset_type: 'handle', canonical_value: `${platform}:${value.trim().replace(/^@/, '')}` });
      }
      if (values.logoUrl?.trim()) assets.push({ asset_type: 'logo', canonical_value: values.logoUrl.trim(), metadata: { source: 'official_brand_reference' } });
      if (values.supportEmail?.trim()) assets.push({ asset_type: 'contact_email', canonical_value: values.supportEmail.trim().toLowerCase(), metadata: { purpose: 'official_support' } });
      if (values.appPackageId) {
        assets.push({
          asset_type: 'mobile_app_pkg',
          canonical_value: values.appPackageId.trim(),
          metadata: {
            ...(values.certFingerprint?.trim() ? { cert_fingerprint: values.certFingerprint.trim().toUpperCase() } : {}),
            ...(values.appName?.trim() ? { app_name: values.appName.trim() } : {}),
            ...(values.appPlatform?.trim() ? { platform: values.appPlatform.trim() } : {}),
            ...(values.appStoreUrl?.trim() ? { store_url: values.appStoreUrl.trim() } : {}),
          },
        });
      }
      if (values.supportPhone) {
        assets.push({ asset_type: 'phone', canonical_value: values.supportPhone });
      }
      if (values.upiId) {
        assets.push({ asset_type: 'upi_id', canonical_value: values.upiId });
      }

      return await createBrand(values.name, assets);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setIsEnrollModalOpen(false);
      reset();
    },
  });

  const onSubmit = (values: BrandEnrollmentFormValues) => {
    enrollMutation.mutate(values);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1">
            <span>Brand reference assets</span>
            <span>•</span>
            <span className="text-slate-400">Ownership not yet verified</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Brand DNA Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Add official domains and identifiers as analyst-provided references. ASTRA does not verify ownership during enrollment.
          </p>
        </div>

        <div>
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Brand DNA</span>
          </button>
        </div>
      </div>

      {/* Brand Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">
            Loading enrolled brands...
          </div>
          ) : isError ? (
            <div role="alert" className="col-span-full rounded-xl border border-rose-900/70 bg-rose-950/30 p-5 text-sm text-rose-200">
              Could not load brand records. {error instanceof Error ? error.message : 'Check the API connection and try again.'}
            </div>
        ) : brands.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-900/50 rounded-xl border border-slate-800">
            <p className="text-sm text-slate-400 mb-2">No brand DNA enrolled yet.</p>
            <p className="text-xs text-slate-400">Add your first brand using Enroll Brand DNA to start organizing reference assets.</p>
          </div>
        ) : (
          brands.map((brand) => (
            <div
              key={brand.id}
              className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const logo = brand.assets?.find((asset) => asset.asset_type === 'logo')?.canonical_value;
                      return logo ? <img src={logo} alt={`${brand.name} logo`} className="h-10 w-10 rounded-xl border border-slate-700 object-contain bg-white p-1" /> : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">{brand.name[0]}</div>
                      );
                    })()}
                    <div>
                      <h3 className="text-base font-bold text-white">{brand.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">
                        ID: {brand.id.substring(0, 8)}...
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {brand.status}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-400" /> Official Domains:
                    </span>
                    <span className="font-semibold text-slate-200">
                      {brand.assets?.filter(a => a.asset_type === 'domain').length ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Brand profile (logo / contacts):</span>
                    <span className="font-semibold text-slate-200">{brand.assets?.filter(a => a.asset_type === 'logo' || a.asset_type === 'contact_email' || a.asset_type === 'phone').length ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-pink-400" /> Social Handles:
                    </span>
                    <span className="font-semibold text-slate-200">
                      {brand.assets?.filter(a => a.asset_type === 'handle').length ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Official Apps:
                    </span>
                    <span className="font-semibold text-slate-200">
                      {brand.assets?.filter(a => a.asset_type === 'mobile_app' || a.asset_type === 'mobile_app_pkg').length ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" /> Payment &amp; UPI:
                    </span>
                    <span className="font-semibold text-slate-200">
                      {brand.assets?.filter(a => a.asset_type === 'upi_id').length ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {brand.assets?.length ?? 0} Total Assets Enrolled
                </span>
                <Link
                  href={`/brands/${brand.id}`}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <span>Manage DNA</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Brand DNA Multi-step Enrollment Modal (G6) */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Enroll Brand DNA Assets</h3>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Brand Name *
                </label>
                <input
                  {...register('name')}
                  placeholder="e.g. NilaPay"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {errors.name && (
                  <span className="text-[11px] text-rose-400">{errors.name.message}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official Website / Primary Domain *
                </label>
                <input
                  {...register('primaryDomain')}
                  placeholder="e.g. nilapay.in"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {errors.primaryDomain && (
                  <span className="text-[11px] text-rose-400">{errors.primaryDomain.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official X Handle
                  </label>
                  <input
                    {...register('twitterHandle')}
                    placeholder="e.g. nilapay_official"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Instagram Handle
                  </label>
                  <input
                    {...register('instagramHandle')}
                    placeholder="e.g. nilapay.official"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Official Logo URL</label>
                  <input {...register('logoUrl')} placeholder="https://brand.com/logo.png" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200" />
                  {errors.logoUrl && <span className="text-[11px] text-rose-400">{errors.logoUrl.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Official Support Email</label>
                  <input {...register('supportEmail')} placeholder="support@brand.com" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200" />
                  {errors.supportEmail && <span className="text-[11px] text-rose-400">{errors.supportEmail.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['linkedinHandle', 'facebookHandle', 'youtubeHandle'] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{field.replace('Handle', '')} Handle</label>
                    <input {...register(field)} placeholder="@official" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile App Package ID
                  </label>
                  <input
                    {...register('appPackageId')}
                    placeholder="e.g. com.nilapay.app"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Signing Cert SHA-256
                  </label>
                  <input
                    {...register('certFingerprint')}
                    placeholder="e.g. 14:28:AB:39:... or hex"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-semibold text-slate-300 mb-1">App Display Name</label><input {...register('appName')} placeholder="NilaPay" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200" /></div>
                <div><label className="block text-xs font-semibold text-slate-300 mb-1">Platform</label><select {...register('appPlatform')} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"><option>Android</option><option>iOS</option><option>Both</option></select></div>
                <div><label className="block text-xs font-semibold text-slate-300 mb-1">Store Listing URL</label><input {...register('appStoreUrl')} placeholder="https://play.google.com/..." className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Support Phone
                  </label>
                  <input
                    {...register('supportPhone')}
                    placeholder="e.g. +91-1800-420-0042"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official UPI ID
                  </label>
                  <input
                    {...register('upiId')}
                    placeholder="e.g. nilapay@axisbank"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                {enrollMutation.isError && (
                  <div role="alert" className="mb-4 rounded-lg border border-rose-900/70 bg-rose-950/30 p-3 text-sm text-rose-200">
                    Brand could not be saved. {enrollMutation.error instanceof Error ? enrollMutation.error.message : 'Check your connection and try again.'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow cursor-pointer"
                >
                  {enrollMutation.isPending ? 'Saving...' : 'Save brand reference'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
