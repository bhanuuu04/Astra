'use client';

import React from 'react';
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function SignUpPage() {
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
      <div className="w-full flex flex-col items-center justify-center py-6 sm:py-12">
        <div className="w-full flex justify-center">
          <SignUp 
            routing="path" 
            path="/sign-up" 
            signInUrl="/sign-in"
            fallbackRedirectUrl="/guide" 
            forceRedirectUrl="/guide" 
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
      </div>

      {/* Subtle Footer */}
      <div className="w-full max-w-[1240px] mx-auto text-center py-4 text-xs text-[#9b9a97]">
        &copy; 2026 ASTRA Digital Risk Protection Inc. · Unified Clerk &amp; Supabase Authentication
      </div>
    </div>
  );
}
