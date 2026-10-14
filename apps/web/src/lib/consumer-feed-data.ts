import {
  BrandSecurityProfile,
  SecurityFeedPost,
  SecurityStory,
  AlertCategory,
  AlertBadgeType,
  OfficialSocialChannel,
  OfficialWebsiteAsset,
} from '@/types/consumer-feed';

// -------------------------------------------------------------
// Pre-seeded Authoritative Verified Brands on ASTRA Platform
// -------------------------------------------------------------
export const SEED_BRANDS: BrandSecurityProfile[] = [
  {
    id: 'brand-nilapay',
    name: 'NilaPay',
    domain: 'nilapay.in',
    legalEntity: 'NilaPay Financial Technologies Pvt. Ltd.',
    industry: 'FinTech & Payments',
    logoUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&auto=format&fit=crop&q=80',
    summary: 'Next-generation UPI payments gateway, wallet & banking infrastructure across India.',
    confidenceScore: 99,
    verifiedAt: '2026-10-10T08:00:00Z',
    isCustomBrand: false,
    officialWebsites: [
      { label: 'Primary Portal', url: 'https://nilapay.in', isPrimary: true, sslVerified: true },
      { label: 'Web App', url: 'https://nilapay.app', isPrimary: false, sslVerified: true },
      { label: 'Support Desk', url: 'https://support.nilapay.in', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@nilapay.official', url: 'https://instagram.com/nilapay.official', isVerified: true },
      { platform: 'x_twitter', handle: '@nilapay_official', url: 'https://twitter.com/nilapay_official', isVerified: true },
      { platform: 'linkedin', handle: 'nilapay-fintech', url: 'https://linkedin.com/company/nilapay-fintech', isVerified: true },
      { platform: 'telegram', handle: '@nilapay_support_bot', url: 'https://t.me/nilapay_support_bot', isVerified: true },
      { platform: 'play_store', handle: 'in.nilapay.app', url: 'https://play.google.com/store/apps/details?id=in.nilapay.app', isVerified: true },
    ],
    supportEmail: 'support@nilapay.in',
    securityEmail: 'security-response@nilapay.in',
    supportPhone: '+91-1800-420-0042',
    threatKeywords: ['kyc', 'wallet', 'refund', 'freeze', 'otp'],
    highRiskTyposquats: ['nilapay-kyc-verify.top', 'nilapay-support.com', 'nilapay-wallet.online'],
    knownImposters: [
      {
        platform: 'Instagram',
        fakeHandle: '@nilapay.support.helpdesk',
        fakeUrl: 'https://nilapay-kyc-verify.top/rekyc',
        reason: 'Impersonating support executive, claiming KYC expiry within 24h to solicit bank PINs.',
        threatLevel: 'critical',
        status: 'takedown_requested',
      },
      {
        platform: 'Telegram',
        fakeHandle: '@nilapay_instant_refund',
        reason: 'Fake automated bot requesting UPI MPIN to issue merchant refunds.',
        threatLevel: 'high',
        status: 'flagged',
      },
    ],
  },
  {
    id: 'brand-stripe',
    name: 'Stripe',
    domain: 'stripe.com',
    legalEntity: 'Stripe, Inc.',
    industry: 'Financial Infrastructure',
    logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
    summary: 'Global financial infrastructure platform powering online payments, payouts, and billing.',
    confidenceScore: 100,
    verifiedAt: '2026-09-15T10:00:00Z',
    isCustomBrand: false,
    officialWebsites: [
      { label: 'Primary Domain', url: 'https://stripe.com', isPrimary: true, sslVerified: true },
      { label: 'Documentation', url: 'https://docs.stripe.com', isPrimary: false, sslVerified: true },
      { label: 'Dashboard', url: 'https://dashboard.stripe.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@stripe', url: 'https://instagram.com/stripe', isVerified: true },
      { platform: 'x_twitter', handle: '@stripe', url: 'https://twitter.com/stripe', isVerified: true },
      { platform: 'linkedin', handle: 'stripe', url: 'https://linkedin.com/company/stripe', isVerified: true },
      { platform: 'youtube', handle: '@StripeGlobal', url: 'https://youtube.com/@StripeGlobal', isVerified: true },
    ],
    supportEmail: 'support@stripe.com',
    securityEmail: 'security@stripe.com',
    threatKeywords: ['invoice', 'payout', 'api_key', 'restricted', 'chargeback'],
    highRiskTyposquats: ['stripe-merchant-verify.net', 'stripe-payouts.xyz', 'dashboard-stripe-auth.top'],
    knownImposters: [
      {
        platform: 'Email / Phishing',
        fakeHandle: 'billing@stripe-merchant-verify.net',
        fakeUrl: 'https://stripe-merchant-verify.net/login',
        reason: 'Spoofed payment failure alert prompting merchants to enter live secret API keys.',
        threatLevel: 'critical',
        status: 'takedown_requested',
      },
    ],
  },
  {
    id: 'brand-apple',
    name: 'Apple',
    domain: 'apple.com',
    legalEntity: 'Apple Inc.',
    industry: 'Consumer Electronics & Software',
    logoUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=128&auto=format&fit=crop&q=80',
    summary: 'Personal computing, smartphones, consumer cloud services, and digital payments.',
    confidenceScore: 100,
    verifiedAt: '2026-09-01T12:00:00Z',
    isCustomBrand: false,
    officialWebsites: [
      { label: 'Official Portal', url: 'https://apple.com', isPrimary: true, sslVerified: true },
      { label: 'Apple ID Security', url: 'https://appleid.apple.com', isPrimary: false, sslVerified: true },
      { label: 'iCloud Services', url: 'https://icloud.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@apple', url: 'https://instagram.com/apple', isVerified: true },
      { platform: 'x_twitter', handle: '@AppleSupport', url: 'https://twitter.com/AppleSupport', isVerified: true },
      { platform: 'youtube', handle: '@Apple', url: 'https://youtube.com/@Apple', isVerified: true },
    ],
    securityEmail: 'product-security@apple.com',
    threatKeywords: ['icloud', 'findmy', 'appleid', 'locked', 'storage'],
    highRiskTyposquats: ['appleid-icloud-login.top', 'findmy-iphone-locate.me'],
    knownImposters: [
      {
        platform: 'SMS / Smishing',
        fakeHandle: 'Apple Security Desk (+1-800-FAKE)',
        fakeUrl: 'https://appleid-icloud-login.top/verify',
        reason: 'Fake "Lost Device Located" SMS aiming to harvest 2FA passcodes and Apple ID credentials.',
        threatLevel: 'critical',
        status: 'takedown_requested',
      },
    ],
  },
  {
    id: 'brand-coinbase',
    name: 'Coinbase',
    domain: 'coinbase.com',
    legalEntity: 'Coinbase Global, Inc.',
    industry: 'Crypto & Digital Assets',
    logoUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=128&auto=format&fit=crop&q=80',
    summary: 'Regulated cryptocurrency exchange and decentralized Web3 wallet infrastructure.',
    confidenceScore: 98,
    verifiedAt: '2026-10-01T09:30:00Z',
    isCustomBrand: false,
    officialWebsites: [
      { label: 'Primary Platform', url: 'https://coinbase.com', isPrimary: true, sslVerified: true },
      { label: 'Coinbase Wallet', url: 'https://wallet.coinbase.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@coinbase', url: 'https://instagram.com/coinbase', isVerified: true },
      { platform: 'x_twitter', handle: '@coinbasesupport', url: 'https://twitter.com/coinbasesupport', isVerified: true },
      { platform: 'linkedin', handle: 'coinbase', url: 'https://linkedin.com/company/coinbase', isVerified: true },
    ],
    securityEmail: 'security@coinbase.com',
    threatKeywords: ['airdrop', 'seed phrase', 'kyc recheck', 'wallet connect'],
    highRiskTyposquats: ['coinbase-wallet-claim.xyz', 'coinbase-airdrop-rewards.top'],
    knownImposters: [
      {
        platform: 'Twitter / X',
        fakeHandle: '@coinbase_help_claim',
        fakeUrl: 'https://coinbase-wallet-claim.xyz',
        reason: 'Fake verified blue badge account replying to distressed users urging them to sync 12-word seed phrases.',
        threatLevel: 'critical',
        status: 'suspended',
      },
    ],
  },
  {
    id: 'brand-openai',
    name: 'OpenAI',
    domain: 'openai.com',
    legalEntity: 'OpenAI OpCo, LLC',
    industry: 'Artificial Intelligence',
    logoUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=128&auto=format&fit=crop&q=80',
    summary: 'Pioneering artificial intelligence research and creator of ChatGPT and frontier AI models.',
    confidenceScore: 99,
    verifiedAt: '2026-09-20T14:00:00Z',
    isCustomBrand: false,
    officialWebsites: [
      { label: 'Official Portal', url: 'https://openai.com', isPrimary: true, sslVerified: true },
      { label: 'ChatGPT Web App', url: 'https://chatgpt.com', isPrimary: false, sslVerified: true },
      { label: 'Developer API', url: 'https://platform.openai.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@openai', url: 'https://instagram.com/openai', isVerified: true },
      { platform: 'x_twitter', handle: '@OpenAI', url: 'https://twitter.com/OpenAI', isVerified: true },
      { platform: 'linkedin', handle: 'openai', url: 'https://linkedin.com/company/openai', isVerified: true },
      { platform: 'youtube', handle: '@OpenAI', url: 'https://youtube.com/@OpenAI', isVerified: true },
    ],
    securityEmail: 'security@openai.com',
    threatKeywords: ['gpt-5 download', 'chatgpt pro free', 'token generator'],
    highRiskTyposquats: ['chatgpt-desktop-installer.top', 'openai-pro-free.xyz'],
    knownImposters: [
      {
        platform: 'Google Search Ads',
        fakeHandle: 'ChatGPT Desktop Setup',
        fakeUrl: 'https://chatgpt-desktop-installer.top/setup.exe',
        reason: 'Rogue Windows executable distributed via sponsored ad infesting victim machines with RedLine Stealer.',
        threatLevel: 'critical',
        status: 'takedown_requested',
      },
    ],
  },
  {
    id: 'brand-netflix',
    name: 'Netflix',
    domain: 'netflix.com',
    legalEntity: 'Netflix, Inc.',
    industry: 'Media & Streaming',
    logoUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=128&auto=format&fit=crop&q=80',
    summary: 'Streaming entertainment service with TV series, documentaries, and feature films.',
    confidenceScore: 100,
    verifiedAt: '2026-09-10T11:00:00Z',
    isCustomBrand: false,
    officialWebsites: [
      { label: 'Streaming App', url: 'https://netflix.com', isPrimary: true, sslVerified: true },
      { label: 'Help Center', url: 'https://help.netflix.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@netflix', url: 'https://instagram.com/netflix', isVerified: true },
      { platform: 'x_twitter', handle: '@netflix', url: 'https://twitter.com/netflix', isVerified: true },
      { platform: 'facebook', handle: 'Netflix', url: 'https://facebook.com/netflix', isVerified: true },
    ],
    securityEmail: 'security@netflix.com',
    threatKeywords: ['suspended', 'payment overdue', 'update payment method'],
    highRiskTyposquats: ['netflix-payment-update.net', 'netflix-verify-profile.xyz'],
    knownImposters: [
      {
        platform: 'SMS / Text Message',
        fakeHandle: 'NETFLIX-ALERT (+44-7...)',
        fakeUrl: 'https://netflix-payment-update.net/billing',
        reason: 'Mass phishing campaign claiming account suspension unless billing info is resubmitted.',
        threatLevel: 'high',
        status: 'takedown_requested',
      },
    ],
  },
];

// -------------------------------------------------------------
// Realistic Pre-seeded Security Feed Posts (Instagram-style)
// -------------------------------------------------------------
export const SEED_POSTS: SecurityFeedPost[] = [
  {
    id: 'post-nilapay-01',
    brandId: 'brand-nilapay',
    brandName: 'NilaPay',
    brandDomain: 'nilapay.in',
    brandLogo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '25 minutes ago',
    category: 'scam_alert',
    badgeType: 'critical',
    badgeText: 'URGENT SCAM RADAR ⚠️',
    title: 'Deceptive "KYC Expiring" Instagram DMs & Rogue Domain Takedown',
    content:
      'We have detected coordinated phishing actors contacting our users via Instagram and WhatsApp claiming their NilaPay KYC has expired and that accounts will be frozen within 24 hours. They provide links to "nilapay-kyc-verify.top". NilaPay NEVER asks for PINs, OTPs, or passwords over social media.',
    officialWebsites: [
      { label: 'Official Portal', url: 'https://nilapay.in', isPrimary: true, sslVerified: true },
      { label: 'Official Helpdesk', url: 'https://support.nilapay.in', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@nilapay.official', url: 'https://instagram.com/nilapay.official', isVerified: true },
      { platform: 'x_twitter', handle: '@nilapay_official', url: 'https://twitter.com/nilapay_official', isVerified: true },
      { platform: 'telegram', handle: '@nilapay_support_bot', url: 'https://t.me/nilapay_support_bot', isVerified: true },
    ],
    threatWatchout: {
      tactic: 'Manufactured Urgency (24h Account Freeze Threat) + Fake Support Persona',
      fakeHandles: ['@nilapay.support.helpdesk', '@nilapay_customer_care_247'],
      fakeDomains: ['nilapay-kyc-verify.top', 'nilapay-wallet.online'],
      riskScore: 97,
      advice: 'Never share UPI MPIN or one-time verification passwords. Official support will only communicate from @nilapay.in.',
    },
    visualTheme: 'rose',
    visualGraphicHeadline: 'BEWARE OF FAKE KYC SUPPORT PROFILES',
    visualGraphicSubhead: 'Real: @nilapay.official  ❌ Fake: @nilapay.support.helpdesk',
    visualStats: [
      { label: 'Flagged Imposters', value: '14 Accounts' },
      { label: 'Blocked Domains', value: '3 Active' },
      { label: 'Threat Status', value: 'Takedown In Progress' },
    ],
    helpfulCount: 542,
    isHelpful: true,
    commentsCount: 38,
    comments: [
      {
        id: 'c1',
        author: 'Arjun Verma',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&auto=format&fit=crop&q=80',
        timeAgo: '15m ago',
        text: 'I received an Instagram DM this morning from @nilapay.support.helpdesk! Thank goodness I checked here first before clicking.',
        isVerifiedConsumer: true,
      },
      {
        id: 'c2',
        author: 'Sneha Patel',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&auto=format&fit=crop&q=80',
        timeAgo: '8m ago',
        text: 'Good catch team. The real handle has the blue verified badge.',
        isVerifiedConsumer: true,
      },
    ],
    isSaved: true,
    isFollowingBrand: true,
  },
  {
    id: 'post-nilapay-02',
    brandId: 'brand-nilapay',
    brandName: 'NilaPay',
    brandDomain: 'nilapay.in',
    brandLogo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '2 hours ago',
    category: 'official_directory',
    badgeType: 'verified',
    badgeText: 'OFFICIAL BRAND DIRECTORY 🛡️',
    title: 'Perimeter Ground Truth: Official Domains & Verified Social Channels',
    content:
      'To safeguard our community against counterfeit platforms, here is NilaPay’s authoritative digital registry. Any domain or social handle not listed in this cryptographic ground truth is NOT affiliated with NilaPay.',
    officialWebsites: [
      { label: 'Primary Web', url: 'https://nilapay.in', isPrimary: true, sslVerified: true },
      { label: 'Web App', url: 'https://nilapay.app', isPrimary: false, sslVerified: true },
      { label: 'Support Center', url: 'https://support.nilapay.in', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@nilapay.official', url: 'https://instagram.com/nilapay.official', isVerified: true },
      { platform: 'x_twitter', handle: '@nilapay_official', url: 'https://twitter.com/nilapay_official', isVerified: true },
      { platform: 'linkedin', handle: 'nilapay-fintech', url: 'https://linkedin.com/company/nilapay-fintech', isVerified: true },
      { platform: 'play_store', handle: 'in.nilapay.app', url: 'https://play.google.com/store/apps/details?id=in.nilapay.app', isVerified: true },
    ],
    visualTheme: 'emerald',
    visualGraphicHeadline: 'NILAPAY VERIFIED DIGITAL PERIMETER',
    visualGraphicSubhead: 'Authoritative Ground Truth Cryptographically Signed by ASTRA',
    visualStats: [
      { label: 'Official Domains', value: '3 Active' },
      { label: 'EV TLS Certificate', value: 'Valid SHA-256' },
      { label: 'Brand Registry Status', value: '100% Verified' },
    ],
    helpfulCount: 894,
    isHelpful: false,
    commentsCount: 19,
    comments: [
      {
        id: 'c3',
        author: 'Rohan Mehra',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=64&auto=format&fit=crop&q=80',
        timeAgo: '1h ago',
        text: 'Bookmarked! Great to have all official links in one clean directory.',
        isVerifiedConsumer: true,
      },
    ],
    isSaved: false,
    isFollowingBrand: true,
  },
  {
    id: 'post-stripe-01',
    brandId: 'brand-stripe',
    brandName: 'Stripe',
    brandDomain: 'stripe.com',
    brandLogo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '4 hours ago',
    category: 'scam_alert',
    badgeType: 'warning',
    badgeText: 'SECURITY ADVISORY 🛡️',
    title: 'Phishing Campaign Spoofing Stripe Merchant Billing & API Re-verification',
    content:
      'We are monitoring an ongoing credential harvesting campaign sending fake "Action Required: Update Payout Method" emails that lead to lookalike domains such as "stripe-merchant-verify.net". Stripe will never ask you to email secret keys (sk_live_...) or paste credentials into unverified domains.',
    officialWebsites: [
      { label: 'Primary Domain', url: 'https://stripe.com', isPrimary: true, sslVerified: true },
      { label: 'Official Dashboard', url: 'https://dashboard.stripe.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@stripe', url: 'https://instagram.com/stripe', isVerified: true },
      { platform: 'x_twitter', handle: '@stripe', url: 'https://twitter.com/stripe', isVerified: true },
    ],
    threatWatchout: {
      tactic: 'Spoofed Transaction Notification + Reverse Proxy Login Portal',
      fakeDomains: ['stripe-merchant-verify.net', 'stripe-payouts.xyz'],
      riskScore: 92,
      advice: 'Always verify you are on https://dashboard.stripe.com before entering billing credentials.',
    },
    visualTheme: 'indigo',
    visualGraphicHeadline: 'MERCHANT PHISHING ATTACK DETECTED',
    visualGraphicSubhead: 'Protect Your Live Secret Keys (sk_live_*)',
    visualStats: [
      { label: 'Attack Vector', value: 'Email Spoofing' },
      { label: 'Phishing Takedown', value: 'Dispatched to Registrar' },
      { label: '2FA Recommendation', value: 'Hardware Security Key' },
    ],
    helpfulCount: 1240,
    isHelpful: true,
    commentsCount: 44,
    comments: [
      {
        id: 'c4',
        author: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=64&auto=format&fit=crop&q=80',
        timeAgo: '3h ago',
        text: 'Received one yesterday claiming our payouts were held. Domain was stripe-payouts.xyz. Reported!',
        isVerifiedConsumer: true,
      },
    ],
    isSaved: true,
    isFollowingBrand: false,
  },
  {
    id: 'post-apple-01',
    brandId: 'brand-apple',
    brandName: 'Apple',
    brandDomain: 'apple.com',
    brandLogo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '6 hours ago',
    category: 'scam_alert',
    badgeType: 'critical',
    badgeText: 'CRITICAL ALERT 🚨',
    title: 'Surge in Smishing (SMS Phishing) Impersonating "Find My" & Apple Support',
    content:
      'Criminal groups are broadcasting SMS messages claiming: "Apple Security: Your lost iPhone was detected online. View location now at appleid-icloud-login.top". This is a credential theft portal designed to bypass Activation Lock. Apple NEVER sends links via SMS to view device locations.',
    officialWebsites: [
      { label: 'Official Apple Portal', url: 'https://apple.com', isPrimary: true, sslVerified: true },
      { label: 'Apple ID Security Hub', url: 'https://appleid.apple.com', isPrimary: false, sslVerified: true },
      { label: 'Official iCloud Web', url: 'https://icloud.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'x_twitter', handle: '@AppleSupport', url: 'https://twitter.com/AppleSupport', isVerified: true },
      { platform: 'instagram', handle: '@apple', url: 'https://instagram.com/apple', isVerified: true },
    ],
    threatWatchout: {
      tactic: 'Fake Find My Location Ping Designed to Steal Apple ID Passwords',
      fakeDomains: ['appleid-icloud-login.top', 'findmy-iphone-locate.me'],
      riskScore: 98,
      advice: 'Only locate devices via the native Find My app or on icloud.com/find directly.',
    },
    visualTheme: 'rose',
    visualGraphicHeadline: 'FAKE "FIND MY IPHONE" SMS PHISHING',
    visualGraphicSubhead: 'Apple Never Sends SMS Links to Track Lost Devices',
    visualStats: [
      { label: 'Smishing Severity', value: 'Critical' },
      { label: 'Activation Lock', value: 'Never enter passcodes from SMS' },
      { label: 'Official URL', value: 'icloud.com only' },
    ],
    helpfulCount: 2310,
    isHelpful: true,
    commentsCount: 92,
    comments: [
      {
        id: 'c5',
        author: 'David Chen',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&auto=format&fit=crop&q=80',
        timeAgo: '4h ago',
        text: 'My phone was stolen 2 weeks ago and I got this exact SMS yesterday. Very sneaky.',
        isVerifiedConsumer: true,
      },
    ],
    isSaved: true,
    isFollowingBrand: true,
  },
  {
    id: 'post-openai-01',
    brandId: 'brand-openai',
    brandName: 'OpenAI',
    brandDomain: 'openai.com',
    brandLogo: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '9 hours ago',
    category: 'rogue_app',
    badgeType: 'warning',
    badgeText: 'MALWARE WARNING ⚠️',
    title: 'Counterfeit "ChatGPT 5 Desktop" Installers Circulating in Search Ads',
    content:
      'Malicious actors are running search advertisements for "ChatGPT Desktop Pro Free Download". Downloading "chatgpt-desktop-installer.top" drops infostealer malware that extracts browser cookies and stored crypto wallets. The only official ChatGPT desktop applications are available directly via openai.com.',
    officialWebsites: [
      { label: 'OpenAI Portal', url: 'https://openai.com', isPrimary: true, sslVerified: true },
      { label: 'ChatGPT Web', url: 'https://chatgpt.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'x_twitter', handle: '@OpenAI', url: 'https://twitter.com/OpenAI', isVerified: true },
      { platform: 'instagram', handle: '@openai', url: 'https://instagram.com/openai', isVerified: true },
    ],
    threatWatchout: {
      tactic: 'Malvertising + Trojanzed AI Desktop Wrapper (RedLine InfoStealer)',
      fakeDomains: ['chatgpt-desktop-installer.top', 'openai-pro-free.xyz'],
      riskScore: 95,
      advice: 'Download ChatGPT official apps only from chatgpt.com or the official Apple App Store / Google Play Store.',
    },
    visualTheme: 'amber',
    visualGraphicHeadline: 'TROJANIZED CHATGPT INSTALLERS IN SEARCH ADS',
    visualGraphicSubhead: 'Official Web: chatgpt.com · Never download third-party setups',
    visualStats: [
      { label: 'Payload Type', value: 'RedLine Stealer' },
      { label: 'Malware Status', value: 'Signatures Updated' },
      { label: 'Official Apps', value: 'chatgpt.com/download' },
    ],
    helpfulCount: 1670,
    isHelpful: false,
    commentsCount: 51,
    comments: [
      {
        id: 'c6',
        author: 'Maya Lin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&auto=format&fit=crop&q=80',
        timeAgo: '5h ago',
        text: 'A colleague almost ran that fake exe yesterday! Shared this warning with our engineering channel.',
        isVerifiedConsumer: true,
      },
    ],
    isSaved: false,
    isFollowingBrand: false,
  },
  {
    id: 'post-coinbase-01',
    brandId: 'brand-coinbase',
    brandName: 'Coinbase',
    brandDomain: 'coinbase.com',
    brandLogo: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '14 hours ago',
    category: 'scam_alert',
    badgeType: 'critical',
    badgeText: 'SECURITY BULLETIN 🛡️',
    title: 'Imposter Support Accounts on X (Twitter) & False Airdrop Claims',
    content:
      'Imposters with paid blue checkmarks are replying to customer tweets pretending to be "Coinbase Customer Resolutions". They send links asking users to connect wallets and input their 12-word seed phrase. Coinbase employees will NEVER ask for your seed phrase or private keys under any circumstance.',
    officialWebsites: [
      { label: 'Coinbase Exchange', url: 'https://coinbase.com', isPrimary: true, sslVerified: true },
      { label: 'Self-Custody Wallet', url: 'https://wallet.coinbase.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'x_twitter', handle: '@coinbasesupport', url: 'https://twitter.com/coinbasesupport', isVerified: true },
      { platform: 'instagram', handle: '@coinbase', url: 'https://instagram.com/coinbase', isVerified: true },
      { platform: 'linkedin', handle: 'coinbase', url: 'https://linkedin.com/company/coinbase', isVerified: true },
    ],
    threatWatchout: {
      tactic: 'Social Engineering via Twitter Replies Soliciting Web3 Seed Phrases',
      fakeHandles: ['@coinbase_help_claim', '@coinbase_resolution_desk'],
      riskScore: 99,
      advice: 'Never share your 12-word recovery phrase with anyone, ever. There is no legitimate support reason to do so.',
    },
    visualTheme: 'indigo',
    visualGraphicHeadline: 'ZERO-TRUST SEED PHRASE ADVISORY',
    visualGraphicSubhead: 'Coinbase Will NEVER Ask For Your 12-Word Secret Phrase',
    visualStats: [
      { label: 'Verification Protocol', value: 'Zero-Knowledge' },
      { label: 'Imposter Accounts Flagged', value: '29 Handles' },
      { label: 'Golden Rule', value: 'Seed Phrase = Ownership' },
    ],
    helpfulCount: 1980,
    isHelpful: true,
    commentsCount: 63,
    comments: [],
    isSaved: true,
    isFollowingBrand: true,
  },
  {
    id: 'post-netflix-01',
    brandId: 'brand-netflix',
    brandName: 'Netflix',
    brandDomain: 'netflix.com',
    brandLogo: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '1 day ago',
    category: 'scam_alert',
    badgeType: 'warning',
    badgeText: 'SUBSCRIPTION PHISHING ALERT ⚠️',
    title: 'Worldwide "Payment Failed — Account Suspended" SMS Scam Campaign',
    content:
      'Millions of consumers are receiving text messages asserting: "Netflix: Your payment failed. To prevent membership termination, please update details: netflix-payment-update.net". These links lead to clone pages capturing credit card numbers and OTPs. We never request credit card info via SMS.',
    officialWebsites: [
      { label: 'Official Streaming', url: 'https://netflix.com', isPrimary: true, sslVerified: true },
      { label: 'Help & Account', url: 'https://help.netflix.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@netflix', url: 'https://instagram.com/netflix', isVerified: true },
      { platform: 'x_twitter', handle: '@netflix', url: 'https://twitter.com/netflix', isVerified: true },
    ],
    threatWatchout: {
      tactic: 'Urgent Subscription Cancellation Threats to Steal Payment Card Credentials',
      fakeDomains: ['netflix-payment-update.net', 'netflix-verify-profile.xyz'],
      riskScore: 94,
      advice: 'Check your account standing by visiting netflix.com directly or through the Netflix app.',
    },
    visualTheme: 'rose',
    visualGraphicHeadline: 'FAKE NETFLIX PAYMENT FAILURE SMS',
    visualGraphicSubhead: 'Manage Billing Directly on netflix.com/youraccount',
    visualStats: [
      { label: 'Scam Type', value: 'SMS Billing Phish' },
      { label: 'Safe Channel', value: 'In-App Account Settings' },
      { label: 'Takedown Notice', value: 'Dispatched to Registrar' },
    ],
    helpfulCount: 3120,
    isHelpful: false,
    commentsCount: 110,
    comments: [],
    isSaved: false,
    isFollowingBrand: false,
  },
];

// -------------------------------------------------------------
// Stories / Safety Highlights (Instagram-style Stories bar)
// -------------------------------------------------------------
export const SEED_STORIES: SecurityStory[] = [
  {
    id: 'story-nilapay',
    brandId: 'brand-nilapay',
    brandName: 'NilaPay',
    brandLogo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&auto=format&fit=crop&q=80',
    hasUnread: true,
    alertType: 'urgent_scam',
    previewBadge: '🚨 Fake KYC',
    headline: 'Beware of @nilapay.support.helpdesk Instagram Scam',
    bodyText:
      'We noticed fraudulent accounts messaging users requesting KYC re-verification. NilaPay will never request UPI PIN or passwords over Instagram or Telegram.',
    officialDomain: 'nilapay.in',
    officialHandle: '@nilapay.official',
    warningNote: 'Fake domain "nilapay-kyc-verify.top" is currently under takedown.',
    timeAgo: '25m ago',
  },
  {
    id: 'story-apple',
    brandId: 'brand-apple',
    brandName: 'Apple',
    brandLogo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=128&auto=format&fit=crop&q=80',
    hasUnread: true,
    alertType: 'urgent_scam',
    previewBadge: '⚡ Smishing',
    headline: 'Fake iCloud "Device Located" SMS Wave',
    bodyText:
      'Scammers are broadcasting fake Find My messages. Never click links in SMS claiming your device has been found. Only use icloud.com/find.',
    officialDomain: 'apple.com',
    officialHandle: '@AppleSupport',
    warningNote: 'Never input Apple ID passwords on non-apple.com URLs.',
    timeAgo: '6h ago',
  },
  {
    id: 'story-stripe',
    brandId: 'brand-stripe',
    brandName: 'Stripe',
    brandLogo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
    hasUnread: false,
    alertType: 'security_patch',
    previewBadge: '🛡️ API Alert',
    headline: 'Stripe Security Advisory: API Key Phishing',
    bodyText:
      'Check all payment webhook URLs. Legitimate merchant communications will always route through dashboard.stripe.com.',
    officialDomain: 'stripe.com',
    officialHandle: '@stripe',
    timeAgo: '4h ago',
  },
  {
    id: 'story-openai',
    brandId: 'brand-openai',
    brandName: 'OpenAI',
    brandLogo: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=128&auto=format&fit=crop&q=80',
    hasUnread: true,
    alertType: 'urgent_scam',
    previewBadge: '⚠️ Rogue App',
    headline: 'Fake ChatGPT Desktop Installers in Ads',
    bodyText:
      'Do not download ChatGPT installers from third-party sites or search ads. The official web app is chatgpt.com.',
    officialDomain: 'openai.com',
    officialHandle: '@OpenAI',
    warningNote: 'Flagged domain "chatgpt-desktop-installer.top" contains RedLine malware.',
    timeAgo: '9h ago',
  },
  {
    id: 'story-coinbase',
    brandId: 'brand-coinbase',
    brandName: 'Coinbase',
    brandLogo: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=128&auto=format&fit=crop&q=80',
    hasUnread: false,
    alertType: 'new_official',
    previewBadge: '🔒 Zero-Trust',
    headline: 'Zero-Trust Protocol: Never Share Seed Phrases',
    bodyText:
      'Support agents will never DM you to offer wallet validation or demand 12-word seed phrases. Report any fake handles.',
    officialDomain: 'coinbase.com',
    officialHandle: '@coinbasesupport',
    timeAgo: '14h ago',
  },
];

// -------------------------------------------------------------
// Dynamic Brand Feed Generator
// Converts any onboarded brand into rich Instagram-style safety posts!
// -------------------------------------------------------------
export function createFeedPostsForOnboardedBrand(brand: BrandSecurityProfile): SecurityFeedPost[] {
  const posts: SecurityFeedPost[] = [];

  // Post 1: Authoritative Brand Directory & Verified Social Channels
  posts.push({
    id: `post-${brand.id}-directory`,
    brandId: brand.id,
    brandName: brand.name,
    brandDomain: brand.domain,
    brandLogo: brand.logoUrl || `https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`,
    isBrandVerified: true,
    timestamp: 'Just now · Live from Onboarding',
    category: 'official_directory',
    badgeType: 'verified',
    badgeText: 'NEW VERIFIED BRAND DIRECTORY ✅',
    title: `${brand.name} Registered Official Perimeter & Social Channels`,
    content: `${brand.name} has officially configured their ground-truth digital footprint on ASTRA Sentinel. Consumers should only interact with the confirmed website domains and verified social handles listed below. Any other profile is unverified.`,
    officialWebsites: brand.officialWebsites,
    officialSocials: brand.officialSocials,
    visualTheme: 'emerald',
    visualGraphicHeadline: `${brand.name.toUpperCase()} OFFICIAL PERIMETER`,
    visualGraphicSubhead: `Authoritative Ground Truth: ${brand.domain}`,
    visualStats: [
      { label: 'Primary Domain', value: brand.domain },
      { label: 'Security Score', value: `${brand.confidenceScore}% Trust` },
      { label: 'Verified Channels', value: `${brand.officialSocials.length} Official Handles` },
    ],
    helpfulCount: 42,
    isHelpful: false,
    commentsCount: 3,
    comments: [
      {
        id: `c-init-${brand.id}`,
        author: 'ASTRA Sentinel Guard',
        timeAgo: 'Just now',
        text: `Automated DNS & Perimeter checks completed. ${brand.domain} is now protected against imposter registrations.`,
        isVerifiedConsumer: true,
      },
    ],
    isSaved: false,
    isFollowingBrand: true,
  });

  // Post 2: Active Scam Defense & Watchout based on threat keywords & typosquats
  if (brand.highRiskTyposquats && brand.highRiskTyposquats.length > 0) {
    posts.push({
      id: `post-${brand.id}-warning`,
      brandId: brand.id,
      brandName: brand.name,
      brandDomain: brand.domain,
      brandLogo: brand.logoUrl || `https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`,
      isBrandVerified: true,
      timestamp: '5 minutes ago',
      category: 'scam_alert',
      badgeType: 'critical',
      badgeText: 'PROACTIVE THREAT RADAR ⚠️',
      title: `Imposter Watch: Guard Against Lookalikes Targeting ${brand.name}`,
      content: `Our threat radars have identified potential deceptive lookalikes attempting typosquatting or brand impersonation. Consumers are urged to double-check spelling and verify links against our official directory before entering credentials.`,
      officialWebsites: brand.officialWebsites,
      officialSocials: brand.officialSocials,
      threatWatchout: {
        tactic: `Typosquatting & Unverified Impersonation targeting ${brand.threatKeywords?.slice(0, 3).join(', ') || 'user logins'}`,
        fakeDomains: brand.highRiskTyposquats,
        riskScore: 89,
        advice: `Only log in via https://${brand.domain}. Report any suspicious links to ${brand.securityEmail || 'support@' + brand.domain}.`,
      },
      visualTheme: 'rose',
      visualGraphicHeadline: `AVOID UNVERIFIED LOOKALIKES FOR ${brand.name.toUpperCase()}`,
      visualGraphicSubhead: `Real: ${brand.domain} · Lookalikes under takedown radar`,
      visualStats: [
        { label: 'Monitored Keywords', value: `${brand.threatKeywords?.length || 5} Keywords` },
        { label: 'Risk Rating', value: 'High' },
        { label: 'Perimeter Defense', value: 'Active Sentinel' },
      ],
      helpfulCount: 18,
      isHelpful: false,
      commentsCount: 1,
      comments: [],
      isSaved: false,
      isFollowingBrand: true,
    });
  }

  return posts;
}

// -------------------------------------------------------------
// Local Storage Synchronization & Feed Aggregator
// -------------------------------------------------------------
const ONBOARDED_BRANDS_KEY = 'astra_all_onboarded_brands';
const CONSUMER_SAVED_POSTS_KEY = 'astra_consumer_saved_posts';
const CONSUMER_FOLLOWED_BRANDS_KEY = 'astra_consumer_followed_brands';
const CONSUMER_LIKED_POSTS_KEY = 'astra_consumer_liked_posts';
const CONSUMER_COMMENTS_KEY = 'astra_consumer_user_comments';

export function getStoredOnboardedBrands(): BrandSecurityProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ONBOARDED_BRANDS_KEY);
    const list: BrandSecurityProfile[] = raw ? JSON.parse(raw) : [];

    // Also check single configured brand if not yet present in list
    const singleRaw = localStorage.getItem('astra_configured_brand') || localStorage.getItem('astra_current_brand_dna');
    if (singleRaw) {
      const parsed = JSON.parse(singleRaw);
      const domain = parsed.domain || 'example.com';
      const exists = list.some((b) => b.domain === domain || b.name.toLowerCase() === (parsed.name || '').toLowerCase());
      if (!exists && parsed.name) {
        const converted: BrandSecurityProfile = {
          id: `brand-custom-${Date.now()}`,
          name: parsed.name,
          domain: domain,
          legalEntity: parsed.legalEntity || `${parsed.name} Inc.`,
          industry: parsed.industry || 'Technology & Services',
          logoUrl: parsed.logoUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
          summary: parsed.summary || 'Authoritative brand verified via ASTRA Onboarding.',
          confidenceScore: 98,
          verifiedAt: new Date().toISOString(),
          isCustomBrand: true,
          officialWebsites: [
            { label: 'Primary Website', url: `https://${domain}`, isPrimary: true, sslVerified: true },
          ],
          officialSocials: parsed.socials
            ? Object.entries(parsed.socials)
                .filter(([_, val]) => typeof val === 'string' && val.trim())
                .map(([platform, handle]) => ({
                  platform: platform as any,
                  handle: String(handle),
                  url: `https://${platform}.com/${String(handle).replace('@', '')}`,
                  isVerified: true,
                }))
            : [
                { platform: 'instagram', handle: `@${domain.split('.')[0]}.official`, url: `https://instagram.com`, isVerified: true },
                { platform: 'x_twitter', handle: `@${domain.split('.')[0]}_official`, url: `https://twitter.com`, isVerified: true },
              ],
          securityEmail: parsed.securityEmail || `security@${domain}`,
          supportEmail: parsed.supportEmail || `support@${domain}`,
          threatKeywords: parsed.threatKeywords || ['login', 'verify', 'account'],
          highRiskTyposquats: parsed.highRiskTyposquats || [`${domain.split('.')[0]}-verify.top`, `login-${domain}`],
        };
        list.unshift(converted);
      }
    }
    return list;
  } catch (e) {
    console.warn('Error reading stored brands:', e);
    return [];
  }
}

export function saveOnboardedBrand(brand: BrandSecurityProfile) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredOnboardedBrands();
    const filtered = existing.filter((b) => b.domain !== brand.domain && b.id !== brand.id);
    filtered.unshift(brand);
    localStorage.setItem(ONBOARDED_BRANDS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Error saving brand to storage:', e);
  }
}

export function getAllBrands(): BrandSecurityProfile[] {
  const custom = getStoredOnboardedBrands();
  // Merge custom first, then seed brands avoiding duplicate domains
  const existingDomains = new Set(custom.map((b) => b.domain.toLowerCase()));
  const seedFiltered = SEED_BRANDS.filter((b) => !existingDomains.has(b.domain.toLowerCase()));
  return [...custom, ...seedFiltered];
}

export function getAllStories(brands: BrandSecurityProfile[]): SecurityStory[] {
  // Start with seed stories
  const stories: SecurityStory[] = [...SEED_STORIES];

  // If there are custom onboarded brands, prepend a story for them!
  const customBrands = brands.filter((b) => b.isCustomBrand);
  customBrands.forEach((cb) => {
    stories.unshift({
      id: `story-${cb.id}`,
      brandId: cb.id,
      brandName: cb.name,
      brandLogo: cb.logoUrl,
      hasUnread: true,
      alertType: 'new_official',
      previewBadge: '🛡️ Verified',
      headline: `${cb.name}: Official Channels Verified`,
      bodyText: `Authoritative security perimeter established for ${cb.name}. Official web is ${cb.domain}.`,
      officialDomain: cb.domain,
      officialHandle: cb.officialSocials[0]?.handle || `@${cb.name.toLowerCase()}`,
      warningNote: `Lookalikes flagged on ASTRA Sentinel radar.`,
      timeAgo: 'Recently',
    });
  });

  return stories;
}

export function getAllFeedPosts(): SecurityFeedPost[] {
  const customBrands = getStoredOnboardedBrands();
  const customPosts: SecurityFeedPost[] = [];

  customBrands.forEach((b) => {
    const generated = createFeedPostsForOnboardedBrand(b);
    customPosts.push(...generated);
  });

  // Load user saved / liked / followed states from localStorage
  const likedSet = getStoredLikedPosts();
  const savedSet = getStoredSavedPosts();
  const followedSet = getStoredFollowedBrands();
  const customComments = getStoredUserComments();

  const allPosts = [...customPosts, ...SEED_POSTS];

  return allPosts.map((post) => {
    const isLiked = likedSet.has(post.id);
    const isSaved = savedSet.has(post.id);
    const isFollowing = followedSet.has(post.brandId) || post.isFollowingBrand;
    const additionalComments = customComments[post.id] || [];

    return {
      ...post,
      isHelpful: isLiked,
      helpfulCount: isLiked ? post.helpfulCount + 1 : post.helpfulCount,
      isSaved,
      isFollowingBrand: isFollowing,
      comments: [...post.comments, ...additionalComments],
      commentsCount: post.comments.length + additionalComments.length,
    };
  });
}

// -------------------------------------------------------------
// Interactive Social Handlers (Like, Save, Follow, Comment)
// -------------------------------------------------------------
export function getStoredLikedPosts(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(CONSUMER_LIKED_POSTS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function toggleStoredLikePost(postId: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getStoredLikedPosts();
  let newState: boolean;
  if (current.has(postId)) {
    current.delete(postId);
    newState = false;
  } else {
    current.add(postId);
    newState = true;
  }
  localStorage.setItem(CONSUMER_LIKED_POSTS_KEY, JSON.stringify(Array.from(current)));
  return newState;
}

export function getStoredSavedPosts(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(CONSUMER_SAVED_POSTS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function toggleStoredSavePost(postId: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getStoredSavedPosts();
  let newState: boolean;
  if (current.has(postId)) {
    current.delete(postId);
    newState = false;
  } else {
    current.add(postId);
    newState = true;
  }
  localStorage.setItem(CONSUMER_SAVED_POSTS_KEY, JSON.stringify(Array.from(current)));
  return newState;
}

export function getStoredFollowedBrands(): Set<string> {
  if (typeof window === 'undefined') return new Set(['brand-nilapay', 'brand-apple', 'brand-coinbase']);
  try {
    const raw = localStorage.getItem(CONSUMER_FOLLOWED_BRANDS_KEY);
    return new Set(raw ? JSON.parse(raw) : ['brand-nilapay', 'brand-apple', 'brand-coinbase']);
  } catch {
    return new Set(['brand-nilapay', 'brand-apple']);
  }
}

export function toggleStoredFollowBrand(brandId: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getStoredFollowedBrands();
  let newState: boolean;
  if (current.has(brandId)) {
    current.delete(brandId);
    newState = false;
  } else {
    current.add(brandId);
    newState = true;
  }
  localStorage.setItem(CONSUMER_FOLLOWED_BRANDS_KEY, JSON.stringify(Array.from(current)));
  return newState;
}

export function getStoredUserComments(): Record<string, any[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CONSUMER_COMMENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function addStoredComment(postId: string, commentText: string, authorName = 'Consumer Sentinel'): any {
  if (typeof window === 'undefined') return null;
  const current = getStoredUserComments();
  const list = current[postId] || [];
  const newComment = {
    id: `comm_${Date.now()}`,
    author: authorName,
    timeAgo: 'Just now',
    text: commentText,
    isVerifiedConsumer: true,
  };
  list.unshift(newComment);
  current[postId] = list;
  localStorage.setItem(CONSUMER_COMMENTS_KEY, JSON.stringify(current));
  return newComment;
}

// -------------------------------------------------------------
// Simulator: Auto-Generate Fresh Live Safety Alert
// -------------------------------------------------------------
export function generateLiveSafetyAlert(brand: BrandSecurityProfile, alertType: 'phishing' | 'fake_account' | 'malicious_app'): SecurityFeedPost {
  const timestamp = 'Just now · Automated Sentinel Broadcast';
  const id = `live-${brand.id}-${Date.now()}`;

  if (alertType === 'fake_account') {
    return {
      id,
      brandId: brand.id,
      brandName: brand.name,
      brandDomain: brand.domain,
      brandLogo: brand.logoUrl,
      isBrandVerified: true,
      timestamp,
      category: 'scam_alert',
      badgeType: 'critical',
      badgeText: 'LIVE IMPOSTER TAKEDOWN 🚨',
      title: `Active Imposter Handle Impersonating ${brand.name} Flagged on Instagram`,
      content: `ASTRA Social Crawler detected an unverified account "@${brand.domain.split('.')[0]}.official.helpdesk" contacting followers with urgent billing solicitations. We have initiated automated takedown proceedings. Please refer exclusively to the official social handles verified below.`,
      officialWebsites: brand.officialWebsites,
      officialSocials: brand.officialSocials,
      threatWatchout: {
        tactic: 'Direct Message Impersonation offering fake resolutions / demanding fees',
        fakeHandles: [`@${brand.domain.split('.')[0]}.official.helpdesk`],
        riskScore: 96,
        advice: `Block and report immediately. Official handles for ${brand.name} will NEVER initiate unsolicited DMs for credentials.`,
      },
      visualTheme: 'rose',
      visualGraphicHeadline: `ACTIVE IMPOSTER FLAGGED FOR ${brand.name.toUpperCase()}`,
      visualGraphicSubhead: `Real: ${brand.officialSocials[0]?.handle || '@' + brand.name.toLowerCase()} · Fake: @${brand.domain.split('.')[0]}.official.helpdesk`,
      visualStats: [
        { label: 'Detection Engine', value: 'ASTRA Social Radar' },
        { label: 'Action', value: 'Takedown Packet Queued' },
        { label: 'Risk to Users', value: 'Credential Theft' },
      ],
      helpfulCount: 65,
      isHelpful: false,
      commentsCount: 2,
      comments: [
        {
          id: `live-c-${Date.now()}`,
          author: 'Automated Threat Ingestion',
          timeAgo: 'Just now',
          text: 'Evidence hash signed and dispatched to platform abuse desk.',
          isVerifiedConsumer: true,
        },
      ],
      isSaved: false,
      isFollowingBrand: true,
    };
  }

  // Default: Phishing URL Alert
  return {
    id,
    brandId: brand.id,
    brandName: brand.name,
    brandDomain: brand.domain,
    brandLogo: brand.logoUrl,
    isBrandVerified: true,
    timestamp,
    category: 'scam_alert',
    badgeType: 'critical',
    badgeText: 'MALICIOUS DOMAIN ALERT ⚠️',
    title: `Credential Harvester Detected Spoofing ${brand.domain}`,
    content: `A rogue domain "login-${brand.domain.split('.')[0]}-auth.top" was registered 12 hours ago with an unverified TLS cert, mirroring ${brand.name}'s login interface. ASTRA DNS sinkhole notice has been submitted.`,
    officialWebsites: brand.officialWebsites,
    officialSocials: brand.officialSocials,
    threatWatchout: {
      tactic: 'DNS Spoofing & Lookalike Typosquatting',
      fakeDomains: [`login-${brand.domain.split('.')[0]}-auth.top`],
      riskScore: 98,
      advice: `Never enter your password on any domain other than https://${brand.domain}.`,
    },
    visualTheme: 'rose',
    visualGraphicHeadline: `NEW PHISHING DOMAIN BLOCKED FOR ${brand.name.toUpperCase()}`,
    visualGraphicSubhead: `Real: https://${brand.domain} ❌ Fake: login-${brand.domain.split('.')[0]}-auth.top`,
    visualStats: [
      { label: 'Certificate Age', value: '12 Hours Old' },
      { label: 'Domain Action', value: 'Blacklist Propagated' },
      { label: 'Safe Perimeter', value: brand.domain },
    ],
    helpfulCount: 88,
    isHelpful: false,
    commentsCount: 0,
    comments: [],
    isSaved: false,
    isFollowingBrand: true,
  };
}
