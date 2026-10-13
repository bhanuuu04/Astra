'use client';

import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/nextjs';
import { X, ShieldCheck, Building2, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (authData: any) => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = React.useState<'login' | 'register'>(initialMode);
  const [portalType, setPortalType] = useState<'brand' | 'consumer'>('brand');

  if (!isOpen) return null;

  const handleSelectPortal = (type: 'brand' | 'consumer') => {
    setPortalType(type);
    if (typeof window !== 'undefined') {
      localStorage.setItem('astra_intended_account_type', type);
    }
  };

  const redirectUrl = `/guide?type=${portalType}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[460px] bg-white border border-[#e3e2e0] rounded-2xl shadow-2xl overflow-y-auto max-h-[92vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="w-full flex items-center justify-between border-b border-[#e3e2e0] px-6 py-4 bg-[#f7f6f3]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-[#37352f] text-white font-bold text-xs shadow-xs">
              A
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#37352f]">
                {mode === 'login' ? 'Sign in to ASTRA' : 'Create an ASTRA Account'}
              </h2>
              <p className="text-[11px] text-[#787774] font-medium">
                {portalType === 'brand' ? '🏢 Brand Security Portal' : '👤 Consumer Safety Portal'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-[5px] text-[#787774] hover:text-[#37352f] hover:bg-[#e3e2e0]/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Portal Type Switcher */}
        <div className="w-full px-6 pt-4 bg-white">
          <div className="bg-[#f7f6f3] p-1 rounded-[8px] border border-[#e3e2e0] flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => handleSelectPortal('brand')}
              className={`flex-1 py-1.5 px-3 rounded-[6px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                portalType === 'brand'
                  ? 'bg-white text-[#37352f] shadow-xs'
                  : 'text-[#787774] hover:text-[#37352f]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#0f7b6c]" />
              <span>Brand Login</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPortal('consumer')}
              className={`flex-1 py-1.5 px-3 rounded-[6px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                portalType === 'consumer'
                  ? 'bg-white text-[#37352f] shadow-xs'
                  : 'text-[#787774] hover:text-[#37352f]'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#0f7b6c]" />
              <span>Consumer Login</span>
            </button>
          </div>
        </div>

        {/* Real Clerk Component Render */}
        <div className="p-4 sm:p-6 w-full flex justify-center bg-white">
          {mode === 'login' ? (
            <SignIn 
              routing="hash"
              fallbackRedirectUrl={redirectUrl}
              forceRedirectUrl={redirectUrl}
              signUpUrl="#sign-up"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0 p-0 w-full bg-transparent",
                  headerTitle: "text-[#37352f] font-bold text-lg tracking-tight",
                  headerSubtitle: "text-[#787774] text-xs",
                  socialButtonsBlockButton: "rounded-[6px] border border-[#e3e2e0] hover:bg-[#f7f6f3] text-[#37352f] font-medium text-xs transition h-10",
                  formButtonPrimary: "bg-[#0f7b6c] hover:bg-[#0b5e52] text-white rounded-[6px] text-xs font-medium shadow-xs transition active:scale-[0.98] h-10",
                  formFieldInput: "rounded-[6px] border border-[#e3e2e0] focus:border-[#0f7b6c] text-[#37352f] text-xs bg-white h-10 px-3",
                  footerActionLink: "text-[#0f7b6c] hover:text-[#0b5e52] font-medium text-xs"
                }
              }}
            />
          ) : (
            <SignUp 
              routing="hash"
              fallbackRedirectUrl={redirectUrl}
              forceRedirectUrl={redirectUrl}
              signInUrl="#sign-in"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0 p-0 w-full bg-transparent",
                  headerTitle: "text-[#37352f] font-bold text-lg tracking-tight",
                  headerSubtitle: "text-[#787774] text-xs",
                  socialButtonsBlockButton: "rounded-[6px] border border-[#e3e2e0] hover:bg-[#f7f6f3] text-[#37352f] font-medium text-xs transition h-10",
                  formButtonPrimary: "bg-[#0f7b6c] hover:bg-[#0b5e52] text-white rounded-[6px] text-xs font-medium shadow-xs transition active:scale-[0.98] h-10",
                  formFieldInput: "rounded-[6px] border border-[#e3e2e0] focus:border-[#0f7b6c] text-[#37352f] text-xs bg-white h-10 px-3",
                  footerActionLink: "text-[#0f7b6c] hover:text-[#0b5e52] font-medium text-xs"
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
