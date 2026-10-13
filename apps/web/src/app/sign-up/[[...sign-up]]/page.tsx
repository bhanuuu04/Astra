'use client';

import React, { useState } from 'react';
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Sparkles, Building, Mail, Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { ClerkErrorBoundary } from "@/components/auth/ClerkErrorBoundary";
import { registerUser } from "@/lib/api";

function NativeSignUpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName || !password) {
      setError('Enter your name, work email, and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await registerUser({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        organization_name: orgName.trim() || `${fullName.trim()}'s Organization`,
      });
      router.push('/guide');
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      await registerUser({
        email: `analyst_${randomSuffix}@astradefense.local`,
        password: 'DemoAnalystPassword123!',
        full_name: 'Lead DRP Analyst',
        organization_name: 'Acme Global Security',
      });
      router.push('/guide');
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] rounded-xl border border-[#e3e2e0] bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-[#37352f]">Create an account</h1>
        <p className="mt-1 text-xs text-[#787774]">
          Set up your organization perimeter and start monitoring brand threats.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#787774] mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-[#9b9a97]" />
            <input
              type="text"
              required
              placeholder="e.g. Alex Mercer"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#e3e2e0] bg-white pl-9 pr-3 text-xs text-[#37352f] placeholder-[#9b9a97] transition focus:border-[#0f7b6c] focus:outline-none focus:ring-1 focus:ring-[#0f7b6c]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#787774] mb-1">
            Organization / Brand Name
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-[#9b9a97]" />
            <input
              type="text"
              placeholder="e.g. Acme Corporation"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#e3e2e0] bg-white pl-9 pr-3 text-xs text-[#37352f] placeholder-[#9b9a97] transition focus:border-[#0f7b6c] focus:outline-none focus:ring-1 focus:ring-[#0f7b6c]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#787774] mb-1">
            Work Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-[#9b9a97]" />
            <input
              type="email"
              required
              placeholder="analyst@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#e3e2e0] bg-white pl-9 pr-3 text-xs text-[#37352f] placeholder-[#9b9a97] transition focus:border-[#0f7b6c] focus:outline-none focus:ring-1 focus:ring-[#0f7b6c]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#787774] mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-[#9b9a97]" />
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#e3e2e0] bg-white pl-9 pr-3 text-xs text-[#37352f] placeholder-[#9b9a97] transition focus:border-[#0f7b6c] focus:outline-none focus:ring-1 focus:ring-[#0f7b6c]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0f7b6c] text-xs font-medium text-white shadow-xs transition hover:bg-[#0b5e52] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Provisioning Tenant...</span>
            </>
          ) : (
            <span>Create Account &amp; Launch</span>
          )}
        </button>
      </form>

      {process.env.NODE_ENV === 'development' && <>
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e3e2e0]" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-amber-800">Development only</span>
          <div className="h-px flex-1 bg-[#e3e2e0]" />
        </div>

        <button
          type="button"
          onClick={handleDemoAccess}
          disabled={loading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 text-xs font-medium text-amber-950 transition hover:bg-amber-100 disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-800" />
          <span>Create a development demo workspace</span>
        </button>
      </>}

      <div className="mt-6 text-center text-xs text-[#787774]">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-medium text-[#0f7b6c] hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const isClerkConfigured = Boolean(
    clerkKey && 
    clerkKey !== 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k' && 
    !clerkKey.includes('...') &&
    clerkKey.startsWith('pk_')
  );

  const [portalMode, setPortalMode] = useState<'brand' | 'consumer'>('brand');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryType = urlParams.get('type') as 'brand' | 'consumer' | null;
      if (queryType === 'consumer' || queryType === 'brand') {
        setPortalMode(queryType);
        localStorage.setItem('astra_intended_account_type', queryType);
      } else {
        const stored = localStorage.getItem('astra_intended_account_type') as 'brand' | 'consumer' | null;
        if (stored) setPortalMode(stored);
      }
    }
  }, []);

  const handleTogglePortal = (mode: 'brand' | 'consumer') => {
    setPortalMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('astra_intended_account_type', mode);
    }
  };

  const redirectUrl = `/guide?type=${portalMode}`;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f7f6f3] text-[#37352f] p-4 sm:p-6 selection:bg-[#0f7b6c]/15 selection:text-[#0f7b6c] font-sans antialiased">
      {/* Top Header */}
      <div className="w-full max-w-[1240px] mx-auto flex items-center justify-between py-2 sm:py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-[5px] bg-[#37352f] text-white flex items-center justify-center font-bold text-xs shadow-xs transition group-hover:bg-[#0f7b6c]">
            A
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#37352f]">ASTRA</span>
          <span className="text-[#9b9a97] text-xs">/</span>
          <span className="text-xs text-[#787774]">Create Account</span>
        </Link>
        <Link 
          href="/" 
          className="text-xs font-medium text-[#787774] hover:text-[#37352f] flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to product</span>
        </Link>
      </div>

      {/* Main Centered Sign-Up Container */}
      <div className="w-full flex flex-col items-center justify-center py-6 sm:py-10 space-y-5">
        {/* Portal Mode Switcher */}
        <div className="w-full max-w-[420px] bg-white rounded-[10px] border border-[#e3e2e0] p-1.5 shadow-2xs flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleTogglePortal('brand')}
            className={`flex-1 py-2 px-3 rounded-[6px] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
              portalMode === 'brand'
                ? 'bg-[#0f7b6c] text-white shadow-xs'
                : 'text-[#787774] hover:text-[#37352f] hover:bg-[#f7f6f3]'
            }`}
          >
            <span>🏢 Brand Account</span>
          </button>
          <button
            type="button"
            onClick={() => handleTogglePortal('consumer')}
            className={`flex-1 py-2 px-3 rounded-[6px] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
              portalMode === 'consumer'
                ? 'bg-[#0f7b6c] text-white shadow-xs'
                : 'text-[#787774] hover:text-[#37352f] hover:bg-[#f7f6f3]'
            }`}
          >
            <span>👤 Consumer Account</span>
          </button>
        </div>

        {/* Portal Subtitle */}
        <div className="text-center max-w-[420px]">
          <p className="text-xs text-[#787774]">
            {portalMode === 'brand' ? (
              <span className="inline-flex items-center gap-1 text-[#0f7b6c] font-medium">
                🏢 Registering for <strong>Brand Defense Workspace</strong> (Enterprise &amp; Creators)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#0f7b6c] font-medium">
                👤 Registering for <strong>Consumer Safety Hub</strong> (Personal Scam Shield)
              </span>
            )}
          </p>
        </div>

        {isClerkConfigured ? (
          <ClerkErrorBoundary fallback={<NativeSignUpForm />}>
            <div className="w-full flex justify-center">
              <SignUp 
                routing="path" 
                path="/sign-up" 
                signInUrl={`/sign-in?type=${portalMode}`}
                fallbackRedirectUrl={redirectUrl} 
                forceRedirectUrl={redirectUrl} 
                appearance={{
                  elements: {
                    card: "shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#e3e2e0] rounded-[10px] bg-white w-full max-w-[420px] p-6 sm:p-8",
                    headerTitle: "text-[#37352f] font-bold text-xl tracking-tight",
                    headerSubtitle: "text-[#787774] text-xs",
                    socialButtonsBlockButton: "rounded-[6px] border border-[#e3e2e0] hover:bg-[#f7f6f3] text-[#37352f] font-medium text-xs transition h-10",
                    formButtonPrimary: "bg-[#0f7b6c] hover:bg-[#0b5e52] text-white rounded-[6px] text-xs font-medium shadow-xs transition active:scale-[0.98] h-10",
                    formFieldInput: "rounded-[6px] border border-[#e3e2e0] focus:border-[#0f7b6c] text-[#37352f] text-xs bg-white h-10 px-3",
                    footerActionLink: "text-[#0f7b6c] hover:text-[#0b5e52] font-medium text-xs"
                  }
                }}
              />
            </div>
          </ClerkErrorBoundary>
        ) : (
          <NativeSignUpForm />
        )}
      </div>

      {/* Subtle Footer */}
      <div className="w-full max-w-[1240px] mx-auto text-center py-4 text-xs text-[#9b9a97]">
        &copy; 2026 ASTRA Digital Risk Protection Inc. · Unified Authentication &amp; Identity
      </div>
    </div>
  );
}
