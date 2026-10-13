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
import { QueryErrorState } from '@/components/ui/QueryErrorState';

const brandEnrollmentSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  legalEntity: z.string().optional(),
  primaryDomain: z.string().trim().regex(
    /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i,
    'Enter a valid domain without https:// (e.g. brand.com)',
  ),
  twitterHandle: z.string().optional(),
  instagramHandle: z.string().optional(),
  appPackageId: z.string().optional(),
  certFingerprint: z.string().optional(),
  supportPhone: z.string().optional(),
  upiId: z.string().optional(),
});

type BrandEnrollmentFormValues = z.infer<typeof brandEnrollmentSchema>;

export function BrandRegistryView() {
  const queryClient = useQueryClient();
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const { data: brands = [], isLoading, isError, error, refetch } = useQuery({
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
      appPackageId: '',
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
      if (values.appPackageId) {
        assets.push({
          asset_type: 'mobile_app_pkg',
          canonical_value: values.appPackageId.trim(),
          metadata: values.certFingerprint?.trim() ? { cert_fingerprint: values.certFingerprint.trim().toUpperCase() } : {},
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
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e3e2e0]">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0f7b6c] tracking-wider uppercase mb-1">
            <span>Brand reference assets</span>
            <span>•</span>
            <span className="text-[#9b9a97]">Continuous Identity Protection</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#37352f] tracking-tight">
            Brand DNA Registry
          </h1>
          <p className="text-sm text-[#787774] mt-1 max-w-2xl leading-relaxed">
            Manage your official domains, authorized social handles, and protected digital assets. ASTRA monitors these identity baselines for spoofing, homoglyph attacks, and fake profiles.
          </p>
        </div>

        <div>
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0f7b6c] hover:bg-[#0b5e52] text-white rounded-[6px] text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enroll Brand DNA</span>
          </button>
        </div>
      </div>

      {/* Brand Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-[#9b9a97] text-xs">
            Loading enrolled brands...
          </div>
        ) : isError ? (
          <div className="col-span-full"><QueryErrorState title="Brand records could not be loaded" message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} /></div>
        ) : brands.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-[8px] border border-[#e3e2e0] shadow-2xs">
            <p className="text-xs font-semibold text-[#37352f] mb-1">No brand DNA enrolled yet.</p>
            <p className="text-xs text-[#9b9a97]">Add your first brand using Enroll Brand DNA to start organizing protected reference assets.</p>
          </div>
        ) : (
          brands.map((brand) => (
            <div
              key={brand.id}
              className="p-5 rounded-[8px] bg-white border border-[#e3e2e0] shadow-2xs hover:border-[#9b9a97] transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[6px] bg-[#37352f] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                      {brand.name[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#37352f]">{brand.name}</h3>
                      <span className="text-[11px] text-[#9b9a97] font-mono">
                        ID: {brand.id.substring(0, 8)}...
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase bg-[#f7f6f3] text-[#0f7b6c] border border-[#e3e2e0]">
                    {brand.status}
                  </span>
                </div>

                <div className="p-3 rounded-[6px] bg-[#f7f6f3] border border-[#e3e2e0] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#787774] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#0f7b6c]" /> Official Domains:
                    </span>
                    <span className="font-semibold text-[#37352f]">
                      {brand.assets?.filter(a => a.asset_type === 'domain').length ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#787774] flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-[#0f7b6c]" /> Social Handles:
                    </span>
                    <span className="font-semibold text-[#37352f]">
                      {brand.assets?.filter(a => a.asset_type === 'handle' || a.asset_type === 'social_handle').length ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#787774] flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#0f7b6c]" /> Official Apps:
                    </span>
                    <span className="font-semibold text-[#37352f]">
                      {brand.assets?.filter(a => a.asset_type === 'mobile_app' || a.asset_type === 'mobile_app_pkg').length ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#787774] flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#0f7b6c]" /> Payment &amp; UPI:
                    </span>
                    <span className="font-semibold text-[#37352f]">
                      {brand.assets?.filter(a => a.asset_type === 'upi_id').length ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3.5 mt-3.5 border-t border-[#e3e2e0] flex items-center justify-between">
                <span className="text-xs text-[#9b9a97]">
                  {brand.assets?.length ?? 0} Total Assets Enrolled
                </span>
                <Link
                  href={`/brands/${brand.id}`}
                  className="text-xs font-semibold text-[#0f7b6c] hover:underline flex items-center gap-1"
                >
                  <span>Manage DNA</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Brand DNA Multi-step Enrollment Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#37352f]/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e3e2e0] rounded-[8px] max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e3e2e0]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0f7b6c]" />
                <h3 className="text-sm font-bold text-[#37352f]">Enroll Brand DNA Assets</h3>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-[#9b9a97] hover:text-[#37352f] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#37352f] mb-1">
                  Brand Name *
                </label>
                <input
                  {...register('name')}
                  placeholder="e.g. Acme Corporation"
                  className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] placeholder:text-[#9b9a97] focus:outline-none focus:border-[#0f7b6c] focus:bg-white transition"
                />
                {errors.name && (
                  <span className="text-[11px] text-rose-500 mt-1 block">{errors.name.message}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#37352f] mb-1">
                  Primary Domain *
                </label>
                <input
                  {...register('primaryDomain')}
                  placeholder="e.g. acme.com"
                  className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] placeholder:text-[#9b9a97] focus:outline-none focus:border-[#0f7b6c] focus:bg-white transition"
                />
                {errors.primaryDomain && (
                  <span className="text-[11px] text-rose-500 mt-1 block">{errors.primaryDomain.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#37352f] mb-1">
                    Official X Handle
                  </label>
                  <input
                    {...register('twitterHandle')}
                    placeholder="e.g. @acme_hq"
                    className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] placeholder:text-[#9b9a97] focus:outline-none focus:border-[#0f7b6c] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#37352f] mb-1">
                    Instagram Handle
                  </label>
                  <input
                    {...register('instagramHandle')}
                    placeholder="e.g. @acme.official"
                    className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] placeholder:text-[#9b9a97] focus:outline-none focus:border-[#0f7b6c] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#37352f] mb-1">
                    Mobile App Package ID
                  </label>
                  <input
                    {...register('appPackageId')}
                    placeholder="e.g. com.acme.app"
                    className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] placeholder:text-[#9b9a97] focus:outline-none focus:border-[#0f7b6c] focus:bg-white font-mono transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#37352f] mb-1">
                    Signing Cert SHA-256
                  </label>
                  <input
                    {...register('certFingerprint')}
                    placeholder="e.g. 14:28:AB:39:... or hex"
                    className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] placeholder:text-[#9b9a97] focus:outline-none focus:border-[#0f7b6c] focus:bg-white font-mono text-[11px] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#37352f] mb-1">
                    Support Phone
                  </label>
                  <input
                    {...register('supportPhone')}
                    placeholder="e.g. +1-800-555-0199"
                    className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] placeholder:text-[#9b9a97] focus:outline-none focus:border-[#0f7b6c] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#37352f] mb-1">
                    Official Payment / UPI ID
                  </label>
                  <input
                    {...register('upiId')}
                    placeholder="e.g. acme@bank"
                    className="w-full bg-[#f7f6f3] border border-[#e3e2e0] rounded-[6px] px-3 py-2 text-xs text-[#37352f] placeholder:text-[#9b9a97] focus:outline-none focus:border-[#0f7b6c] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                {enrollMutation.isError && (
                  <div role="alert" className="mb-4 rounded-[6px] border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                    Brand could not be saved. {enrollMutation.error instanceof Error ? enrollMutation.error.message : 'Check your connection and try again.'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-3.5 py-2 bg-[#f7f6f3] hover:bg-white border border-[#e3e2e0] text-[#787774] hover:text-[#37352f] rounded-[6px] text-xs font-medium cursor-pointer transition shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollMutation.isPending}
                  className="px-4 py-2 bg-[#0f7b6c] hover:bg-[#0b5e52] disabled:opacity-50 text-white rounded-[6px] text-xs font-medium shadow-2xs cursor-pointer transition"
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

