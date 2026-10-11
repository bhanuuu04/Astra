'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  KeyRound, 
  Loader2, 
  Lock, 
  LogIn, 
  Mail, 
  ShieldCheck, 
  User, 
  UserPlus, 
  X,
  AlertCircle
} from 'lucide-react';
import { login, register, logout, type AuthResponse } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (authData: AuthResponse) => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'register' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!fullName.trim() || !orgName.trim() || !email.trim() || !password) {
          throw new Error('Please fill out all required fields.');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }
        const resp = await register({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          organization_name: orgName.trim(),
        });
        onSuccess(resp);
        onClose();
      } else {
        if (!email.trim() || !password) {
          throw new Error('Please enter your email and password.');
        }
        const resp = await login({
          email: email.trim(),
          password,
        });
        onSuccess(resp);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#0d1522] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {mode === 'register' ? 'Provision Organization' : 'Analyst Authentication'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {mode === 'register' ? 'Self-service enterprise onboarding' : 'Access your secured workspace'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-white/[0.08] bg-black/20 p-1">
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition flex items-center justify-center gap-2 ${
              mode === 'register'
                ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-5 mb-0 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex FinTech Solutions"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Mercer"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password {mode === 'register' && <span className="text-slate-500 text-[10px]">(min. 8 characters)</span>}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : mode === 'register' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Provision & Enter Workspace</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="px-6 py-3.5 bg-white/[0.02] border-t border-white/[0.06] text-center">
          <p className="text-[11px] text-slate-500">
            {mode === 'register' ? 'Already have an organization?' : 'Need a separate tenant?'}
            <button
              type="button"
              onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(null); }}
              className="ml-1.5 text-cyan-400 hover:underline font-medium"
            >
              {mode === 'register' ? 'Sign In instead' : 'Create Organization'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
