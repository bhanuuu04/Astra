'use client';

import React from 'react';

interface BrandIconProps {
  brandName: string;
  size?: number;
  className?: string;
}

export function BrandIcon({ brandName, size = 28, className = '' }: BrandIconProps) {
  const norm = brandName.toLowerCase();

  if (norm.includes('apple')) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-black text-white shrink-0 shadow-sm ${className}`}
        style={{ width: size + 16, height: size + 16 }}
      >
        <svg width={size} height={size} viewBox="0 0 170 170" fill="currentColor">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.7-7.92-12-14.52-5.44-8.38-9.84-18.06-13.18-29.05-3.34-10.99-5.01-21.75-5.01-32.28 0-14.86 3.63-27.13 10.89-36.81 7.26-9.68 16.5-14.61 27.72-14.79 4.36 0 9.24 1.15 14.63 3.44 5.39 2.29 9.3 3.49 11.73 3.6 2.08-.23 6.04-1.46 11.88-3.71 5.84-2.25 10.79-3.26 14.84-3.04 10.99.64 19.86 4.6 26.6 11.88-9.59 5.8-14.31 13.91-14.15 24.33.16 8.5 3.41 15.68 9.75 21.53 6.34 5.85 13.88 9.08 22.62 9.68-2.02 6.07-4.46 12.28-7.33 18.63zM119.22 33.15c0-7.39 2.65-14.47 7.94-21.25 5.3-6.78 11.89-11.19 19.78-13.23.23 1.16.35 2.26.35 3.31 0 7.39-2.73 14.53-8.19 21.43-5.46 6.9-12.06 11.23-19.81 12.98-.07-1.05-.07-2.13-.07-3.24z" />
        </svg>
      </div>
    );
  }

  if (norm.includes('nike')) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-black text-white shrink-0 shadow-sm ${className}`}
        style={{ width: size + 16, height: size + 16 }}
      >
        <svg width={size + 4} height={size - 4} viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.707 5.293c-.452-.361-1.077-.47-1.637-.282L3.896 10.428a1.5 1.5 0 0 0-.96 1.815c.214.776.906 1.332 1.71 1.373l6.578.337-5.918 2.96a1.5 1.5 0 0 0-.649 1.996c.307.616.945 1.004 1.638.995l14.793-.195a1.5 1.5 0 0 0 1.48-1.52L22.95 6.78c-.023-.623-.5-1.126-1.243-1.487zM4.646 11.63l14.61-4.87-13.06 6.53-1.55-.1.0-.1.0-.1.0-1.46z" />
        </svg>
      </div>
    );
  }

  if (norm.includes('instagram') || norm.includes('meta')) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shrink-0 shadow-sm ${className}`}
        style={{ width: size + 16, height: size + 16 }}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      </div>
    );
  }

  if (norm.includes('spotify')) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-[#1DB954] text-black shrink-0 shadow-sm ${className}`}
        style={{ width: size + 16, height: size + 16 }}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.495 17.307c-.216.353-.675.467-1.028.251-2.817-1.722-6.362-2.112-10.539-1.157-.402.092-.803-.16-.895-.562-.092-.403.159-.804.562-.896 4.571-1.045 8.492-.596 11.649 1.336.353.216.467.674.251 1.028zm1.468-3.262c-.272.443-.852.585-1.295.313-3.224-1.982-8.14-2.557-11.954-1.399-.499.152-1.028-.135-1.18-.634-.152-.499.135-1.028.634-1.18 4.364-1.324 9.782-.683 13.482 1.595.443.272.585.852.313 1.295zm.126-3.41c-3.864-2.295-10.245-2.508-13.931-1.388-.592.179-1.22-.162-1.399-.754-.18-.592.162-1.22.754-1.399 4.237-1.286 11.28-1.037 15.733 1.605.534.317.708 1.011.391 1.545-.316.534-1.011.708-1.545.391z" />
        </svg>
      </div>
    );
  }

  if (norm.includes('tesla')) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-[#E82127] text-white shrink-0 shadow-sm ${className}`}
        style={{ width: size + 16, height: size + 16 }}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.378l2.973 3.013c4.127.324 7.57 2.052 9.027 4.54-.743-1.635-3.83-2.905-8.5-3.08l-.5 4.15h-2l-.5-4.15c-4.67.175-7.757 1.445-8.5 3.08 1.457-2.488 4.9-4.216 9.027-4.54L12 2.378zm0 8.622l2.36 1.84c3.48.27 5.74 1.15 6.64 2.36-.6-1.08-3.02-1.85-6.64-1.95L12 17.5l-2.36-4.25c-3.62.1-6.04.87-6.64 1.95.9-1.21 3.16-2.09 6.64-2.36L12 11z" />
        </svg>
      </div>
    );
  }

  if (norm.includes('netflix')) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-black text-[#E50914] shrink-0 shadow-sm ${className}`}
        style={{ width: size + 16, height: size + 16 }}
      >
        <span className="font-black text-xl tracking-tighter" style={{ fontFamily: 'system-ui, sans-serif' }}>
          N
        </span>
      </div>
    );
  }

  if (norm.includes('stripe')) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-[#635BFF] text-white shrink-0 shadow-sm ${className}`}
        style={{ width: size + 16, height: size + 16 }}
      >
        <span className="font-extrabold text-base tracking-tighter">S</span>
      </div>
    );
  }

  if (norm.includes('openai')) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-[#10A37F] text-white shrink-0 shadow-sm ${className}`}
        style={{ width: size + 16, height: size + 16 }}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.79a4.469 4.469 0 0 1 2.366-1.986v5.679a.784.784 0 0 0 .392.68l5.823 3.37-2.02 1.168a.08.08 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 8.79zm15.719 3.997l-5.83-3.37 2.02-1.167a.08.08 0 0 1 .071 0l4.83 2.79a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.415-.68zm2.01-4.52l-.142-.085-4.779-2.782a.776.776 0 0 0-.785 0L8.52 8.769V6.437a.08.08 0 0 1 .033-.061L13.393 3.59a4.5 4.5 0 0 1 6.666 4.677zm-9.522 4.195l2.61-1.507 2.61 1.507v3.014l-2.61 1.508-2.61-1.508z" />
        </svg>
      </div>
    );
  }

  if (norm.includes('amazon')) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-[#232F3E] text-[#FF9900] shrink-0 shadow-sm ${className}`}
        style={{ width: size + 16, height: size + 16 }}
      >
        <span className="font-black text-base tracking-tight text-white">a<span className="text-[#FF9900]">✓</span></span>
      </div>
    );
  }

  // Fallback for custom onboarded brands
  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0071e3] to-[#409cff] text-white font-bold shrink-0 shadow-sm ${className}`}
      style={{ width: size + 16, height: size + 16, fontSize: size * 0.55 }}
    >
      {brandName.charAt(0).toUpperCase()}
    </div>
  );
}

export function InstagramIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function TwitterIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function LinkedinIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.97 0-1.75-.79-1.75-1.76s.78-1.75 1.75-1.75 1.75.78 1.75 1.75-.78 1.76-1.75 1.76m1.4 9.74v-8.37H5.06v8.37z" />
    </svg>
  );
}

export function YoutubeIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

