'use client';

import React from 'react';

interface SocialLogoProps {
  platform: string;
  className?: string;
  size?: number;
}

export function SocialLogo({ platform, className = '', size = 20 }: SocialLogoProps) {
  const norm = platform.toLowerCase().replace('x_twitter', 'twitter').replace('x', 'twitter');

  switch (norm) {
    case 'instagram':
      return (
        <div
          className={`flex items-center justify-center rounded-[8px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-xs text-white shrink-0 ${className}`}
          style={{ width: size + 16, height: size + 16 }}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        </div>
      );

    case 'twitter':
      return (
        <div
          className={`flex items-center justify-center rounded-[8px] bg-black shadow-xs text-white shrink-0 ${className}`}
          style={{ width: size + 16, height: size + 16 }}
        >
          <svg width={size - 2} height={size - 2} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      );

    case 'facebook':
      return (
        <div
          className={`flex items-center justify-center rounded-[8px] bg-[#1877F2] shadow-xs text-white shrink-0 ${className}`}
          style={{ width: size + 16, height: size + 16 }}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-1.874 0-2.529.833-2.529 2.404v1.58h4.093l-.582 3.667h-3.511v7.98c5.492-.865 9.689-5.617 9.689-11.365C23.003 5.518 17.485 0 10.669 0 3.853 0-1.665 5.518-1.665 12.326c0 5.748 4.197 10.5 9.689 11.365h1.077z" />
          </svg>
        </div>
      );

    case 'linkedin':
      return (
        <div
          className={`flex items-center justify-center rounded-[8px] bg-[#0A66C2] shadow-xs text-white shrink-0 ${className}`}
          style={{ width: size + 16, height: size + 16 }}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.63 1.63 0 1 0 0-3.26 1.63 1.63 0 0 0 0 3.26m1.4 9.74V10.13H5.06v8.37h2.8z" />
          </svg>
        </div>
      );

    case 'youtube':
      return (
        <div
          className={`flex items-center justify-center rounded-[8px] bg-[#FF0000] shadow-xs text-white shrink-0 ${className}`}
          style={{ width: size + 16, height: size + 16 }}
        >
          <svg width={size + 2} height={size - 2} viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
      );

    case 'google':
    case 'google_play':
      return (
        <div
          className={`flex items-center justify-center rounded-[8px] bg-[#00865F] shadow-xs text-white shrink-0 ${className}`}
          style={{ width: size + 16, height: size + 16 }}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.609 1.814L13.792 12 3.61 22.186a2.38 2.38 0 0 1-.61-.986V2.8a2.38 2.38 0 0 1 .609-.986zm11.3 9.07l2.578-2.578L5.27 1.343a2.33 2.33 0 0 0-1.127-.247l10.766 9.788zm0 2.232l-10.766 9.788c.365.04.743-.045 1.127-.247l12.217-6.963-2.578-2.578zm1.116-1.116l3.418 1.95a2.298 2.298 0 0 0 2.259 0 2.264 2.264 0 0 0 1.13-1.95 2.264 2.264 0 0 0-1.13-1.95 2.298 2.298 0 0 0-2.259 0l-3.418 1.95z" />
          </svg>
        </div>
      );

    default:
      return (
        <div
          className={`flex items-center justify-center rounded-[8px] bg-[#37352f] shadow-xs text-white font-bold text-xs shrink-0 ${className}`}
          style={{ width: size + 16, height: size + 16 }}
        >
          {platform.slice(0, 2).toUpperCase()}
        </div>
      );
  }
}

export function Instagram({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Twitter({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Linkedin({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.63 1.63 0 1 0 0-3.26 1.63 1.63 0 0 0 0 3.26m1.4 9.74V10.13H5.06v8.37h2.8z" />
    </svg>
  );
}

export function Youtube({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
