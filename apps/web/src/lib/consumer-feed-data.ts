import {
  BrandSecurityProfile,
  SecurityFeedPost,
  SecurityStory,
} from '@/types/consumer-feed';

// -------------------------------------------------------------
// Pre-seeded Authoritative Verified Popular Global Brands
// -------------------------------------------------------------
export const SEED_BRANDS: BrandSecurityProfile[] = [
  {
    id: 'brand-apple',
    name: 'Apple',
    domain: 'apple.com',
    legalEntity: 'Apple Inc.',
    industry: 'Consumer Technology & Ecosystem',
    logoUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=128&auto=format&fit=crop&q=80',
    summary: 'Hardware, operating systems, cloud privacy perimeter, and digital identity defense.',
    confidenceScore: 100,
    verifiedAt: '2026-09-01T12:00:00Z',
    isCustomBrand: false,
    officialWebsites: [
      { label: 'Official Apple Portal', url: 'https://apple.com', isPrimary: true, sslVerified: true },
      { label: 'Apple ID Security Hub', url: 'https://appleid.apple.com', isPrimary: false, sslVerified: true },
      { label: 'iCloud Services', url: 'https://icloud.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@apple', url: 'https://instagram.com/apple', isVerified: true },
      { platform: 'x_twitter', handle: '@AppleSupport', url: 'https://twitter.com/AppleSupport', isVerified: true },
      { platform: 'youtube', handle: '@Apple', url: 'https://youtube.com/@Apple', isVerified: true },
    ],
    securityEmail: 'product-security@apple.com',
    threatKeywords: ['icloud', 'findmy', 'appleid', 'locked', 'activation lock'],
    highRiskTyposquats: ['appleid-icloud-login.top', 'findmy-iphone-locate.me', 'apple-security-support.xyz'],
    knownImposters: [
      {
        platform: 'SMS / Smishing',
        fakeHandle: 'Apple Security (+1-800-FAKE)',
        fakeUrl: 'https://appleid-icloud-login.top/verify',
        reason: 'Fake "Lost Device Located" SMS targeting stolen device owners to steal Apple ID passwords and bypass Activation Lock.',
        threatLevel: 'critical',
        status: 'takedown_requested',
      },
    ],
  },
  {
    id: 'brand-nike',
    name: 'Nike',
    domain: 'nike.com',
    legalEntity: 'Nike, Inc.',
    industry: 'Athletic Footwear & Apparel',
    logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=128&auto=format&fit=crop&q=80',
    summary: 'Global sports footwear, apparel, SNKRS releases, and digital fitness ecosystem.',
    confidenceScore: 100,
    verifiedAt: '2026-09-12T08:00:00Z',
    isCustomBrand: false,
    officialWebsites: [
      { label: 'Official Nike Store', url: 'https://nike.com', isPrimary: true, sslVerified: true },
      { label: 'SNKRS Release Portal', url: 'https://snkrs.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@nike', url: 'https://instagram.com/nike', isVerified: true },
      { platform: 'x_twitter', handle: '@nikestore', url: 'https://twitter.com/nikestore', isVerified: true },
      { platform: 'youtube', handle: '@nike', url: 'https://youtube.com/@nike', isVerified: true },
    ],
    securityEmail: 'security@nike.com',
    threatKeywords: ['snkrs drop', '90% off sale', 'warehouse clearance', 'free shoes'],
    highRiskTyposquats: ['nike-vip-sale.shop', 'snkrs-outlet-official.top', 'nike-clearance-store.online'],
    knownImposters: [
      {
        platform: 'Instagram Ads',
        fakeHandle: '@nike_vip_warehouse_sale',
        fakeUrl: 'https://nike-vip-sale.shop/checkout',
        reason: 'Sponsored Instagram ads offering 90% discount on Travis Scott Jordans; harvested 800+ credit cards.',
        threatLevel: 'critical',
        status: 'takedown_requested',
      },
    ],
  },
  {
    id: 'brand-instagram',
    name: 'Instagram',
    domain: 'instagram.com',
    legalEntity: 'Meta Platforms, Inc.',
    industry: 'Social Media & Creator Economy',
    logoUrl: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=128&auto=format&fit=crop&q=80',
    summary: 'Visual media platform, direct messaging, creators and digital brand storefronts.',
    confidenceScore: 100,
    verifiedAt: '2026-08-20T10:00:00Z',
    isCustomBrand: false,
    officialWebsites: [
      { label: 'Instagram Web Portal', url: 'https://instagram.com', isPrimary: true, sslVerified: true },
      { label: 'Help & Safety Center', url: 'https://help.instagram.com', isPrimary: false, sslVerified: true },
      { label: 'Meta Corporate', url: 'https://about.meta.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@instagram', url: 'https://instagram.com/instagram', isVerified: true },
      { platform: 'x_twitter', handle: '@meta', url: 'https://twitter.com/meta', isVerified: true },
      { platform: 'linkedin', handle: 'meta', url: 'https://linkedin.com/company/meta', isVerified: true },
    ],
    securityEmail: 'security@meta.com',
    threatKeywords: ['copyright appeal', 'verified badge free', 'account deletion 24h'],
    highRiskTyposquats: ['meta-help-center.top', 'instagram-badge-verify.xyz', 'instagram-appeal-desk.net'],
    knownImposters: [
      {
        platform: 'Direct Messages (DMs)',
        fakeHandle: '@meta.creator.appeals',
        fakeUrl: 'https://meta-help-center.top/form',
        reason: 'Automated DMs threatening 24h account deletion due to counterfeit claims; steals login 2FA backup codes.',
        threatLevel: 'critical',
        status: 'takedown_requested',
      },
    ],
  },
  {
    id: 'brand-spotify',
    name: 'Spotify',
    domain: 'spotify.com',
    legalEntity: 'Spotify Technology S.A.',
    industry: 'Audio Streaming & Podcasts',
    logoUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=128&auto=format&fit=crop&q=80',
    summary: 'Global music streaming, podcast distribution, and audio creator platform.',
    confidenceScore: 99,
    verifiedAt: '2026-09-05T14:00:00Z',
    isCustomBrand: false,
    officialWebsites: [
      { label: 'Web Player & Portal', url: 'https://spotify.com', isPrimary: true, sslVerified: true },
      { label: 'Support & Community', url: 'https://support.spotify.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@spotify', url: 'https://instagram.com/spotify', isVerified: true },
      { platform: 'x_twitter', handle: '@SpotifyCares', url: 'https://twitter.com/SpotifyCares', isVerified: true },
      { platform: 'youtube', handle: '@Spotify', url: 'https://youtube.com/@Spotify', isVerified: true },
    ],
    securityEmail: 'security@spotify.com',
    threatKeywords: ['mod apk', 'free premium lifetime', 'unlimited skips crack'],
    highRiskTyposquats: ['spotify-premium-free.top', 'spotify-mod-apk.xyz'],
    knownImposters: [
      {
        platform: 'Telegram / Mod APKs',
        fakeHandle: 'Spotify Modded Releases',
        fakeUrl: 'https://spotify-premium-free.top/download.apk',
        reason: 'Trojanzed APK containing SMS billing malware and crypto clipboard hijackers.',
        threatLevel: 'critical',
        status: 'takedown_requested',
      },
    ],
  },
  {
    id: 'brand-tesla',
    name: 'Tesla',
    domain: 'tesla.com',
    legalEntity: 'Tesla, Inc.',
    industry: 'Electric Vehicles & Clean Energy',
    logoUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=128&auto=format&fit=crop&q=80',
    summary: 'Electric mobility, autonomous driving software, solar energy, and battery storage.',
    confidenceScore: 100,
    verifiedAt: '2026-09-18T16:00:00Z',
    isCustomBrand: false,
    officialWebsites: [
      { label: 'Official Tesla Portal', url: 'https://tesla.com', isPrimary: true, sslVerified: true },
      { label: 'Investor Relations', url: 'https://ir.tesla.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'x_twitter', handle: '@tesla', url: 'https://twitter.com/tesla', isVerified: true },
      { platform: 'instagram', handle: '@teslamotors', url: 'https://instagram.com/teslamotors', isVerified: true },
      { platform: 'youtube', handle: '@Tesla', url: 'https://youtube.com/@Tesla', isVerified: true },
    ],
    securityEmail: 'productsecurity@tesla.com',
    threatKeywords: ['crypto giveaway', 'elon musk 2x', 'claim cyberquad free'],
    highRiskTyposquats: ['tesla-event-claim.top', 'elon-musk-rewards.xyz', 'tesla-coin-ico.org'],
    knownImposters: [
      {
        platform: 'YouTube Live Streams',
        fakeHandle: 'Tesla Keynote Stream [Official]',
        fakeUrl: 'https://tesla-event-claim.top/btc',
        reason: 'Deepfake live streams claiming Elon Musk is doubling Bitcoin/ETH deposits; drains victim wallets.',
        threatLevel: 'critical',
        status: 'suspended',
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
    highRiskTyposquats: ['netflix-payment-update.net', 'netflix-verify-profile.xyz', 'netflix-reactivate-login.net'],
    knownImposters: [
      {
        platform: 'SMS / Text Message',
        fakeHandle: 'NETFLIX-ALERT (+44-7...)',
        fakeUrl: 'https://netflix-reactivate-login.net/billing',
        reason: 'Mass phishing campaign claiming account suspension unless billing info is resubmitted.',
        threatLevel: 'high',
        status: 'takedown_requested',
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
      { label: 'Official Dashboard', url: 'https://dashboard.stripe.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@stripe', url: 'https://instagram.com/stripe', isVerified: true },
      { platform: 'x_twitter', handle: '@stripe', url: 'https://twitter.com/stripe', isVerified: true },
      { platform: 'linkedin', handle: 'stripe', url: 'https://linkedin.com/company/stripe', isVerified: true },
    ],
    securityEmail: 'security@stripe.com',
    threatKeywords: ['invoice', 'payout', 'api_key', 'restricted', 'chargeback'],
    highRiskTyposquats: ['stripe-merchant-verify.net', 'stripe-payouts.xyz', 'dashboard-stripe-auth.top'],
    knownImposters: [
      {
        platform: 'Email / Phishing',
        fakeHandle: 'billing@stripe-merchant-verify.net',
        fakeUrl: 'https://stripe-merchant-verify.net/login',
        reason: 'Spoofed payment failure alert prompting merchants to enter live secret API keys (sk_live_...).',
        threatLevel: 'critical',
        status: 'takedown_requested',
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
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@openai', url: 'https://instagram.com/openai', isVerified: true },
      { platform: 'x_twitter', handle: '@OpenAI', url: 'https://twitter.com/OpenAI', isVerified: true },
      { platform: 'linkedin', handle: 'openai', url: 'https://linkedin.com/company/openai', isVerified: true },
    ],
    securityEmail: 'security@openai.com',
    threatKeywords: ['gpt-5 download', 'chatgpt pro free', 'token generator'],
    highRiskTyposquats: ['chatgpt-desktop-installer.top', 'openai-pro-free.xyz'],
    knownImposters: [
      {
        platform: 'Search Ads',
        fakeHandle: 'ChatGPT Desktop Setup',
        fakeUrl: 'https://chatgpt-desktop-installer.top/setup.exe',
        reason: 'Rogue Windows executable distributed via sponsored ad infesting victim machines with RedLine Stealer.',
        threatLevel: 'critical',
        status: 'takedown_requested',
      },
    ],
  },
  {
    id: 'brand-amazon',
    name: 'Amazon',
    domain: 'amazon.com',
    legalEntity: 'Amazon.com, Inc.',
    industry: 'E-Commerce, Cloud & Logistics',
    logoUrl: 'https://images.unsplash.com/photo-1523474253246-63e34233167a?w=128&auto=format&fit=crop&q=80',
    summary: 'Global retail marketplace, Amazon Web Services, Prime Video, and logistics network.',
    confidenceScore: 100,
    verifiedAt: '2026-09-08T09:00:00Z',
    isCustomBrand: false,
    officialWebsites: [
      { label: 'Primary Marketplace', url: 'https://amazon.com', isPrimary: true, sslVerified: true },
      { label: 'AWS Cloud Services', url: 'https://aws.amazon.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@amazon', url: 'https://instagram.com/amazon', isVerified: true },
      { platform: 'x_twitter', handle: '@amazon', url: 'https://twitter.com/amazon', isVerified: true },
    ],
    securityEmail: 'stop-spoofing@amazon.com',
    threatKeywords: ['delivery failed', 'reschedule parcel', 'order confirm otp'],
    highRiskTyposquats: ['amazon-parcel-track.top', 'amazon-order-verify.xyz'],
    knownImposters: [
      {
        platform: 'SMS / Smishing',
        fakeHandle: 'Amazon Delivery Desk',
        fakeUrl: 'https://amazon-parcel-track.top/redeliver',
        reason: 'Smishing SMS stating parcel could not be delivered, asking for credit card payment of $1.50 redelivery fee.',
        threatLevel: 'high',
        status: 'takedown_requested',
      },
    ],
  },
];

// -------------------------------------------------------------
// Popular Brand Security Feed Posts (Apple HIG & News Style)
// -------------------------------------------------------------
export const SEED_POSTS: SecurityFeedPost[] = [
  {
    id: 'post-apple-01',
    brandId: 'brand-apple',
    brandName: 'Apple',
    brandDomain: 'apple.com',
    brandLogo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '18 minutes ago',
    category: 'scam_alert',
    badgeType: 'critical',
    badgeText: 'CRITICAL SECURITY RADAR ⚠️',
    title: 'Deceptive "Lost iPhone Located" SMS Smishing Campaign',
    content:
      'We are monitoring mass SMS smishing campaigns sent to consumers whose devices were recently lost or stolen. The messages state: "Apple Security: Your lost iPhone was detected online. View location now at appleid-icloud-login.top". This is an unauthorized phishing portal designed to harvest Apple ID credentials and remove Activation Lock. Apple NEVER sends links via SMS to view device locations.',
    officialWebsites: [
      { label: 'Official Apple Portal', url: 'https://apple.com', isPrimary: true, sslVerified: true },
      { label: 'Apple ID Security', url: 'https://appleid.apple.com', isPrimary: false, sslVerified: true },
      { label: 'iCloud Find My', url: 'https://icloud.com/find', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'x_twitter', handle: '@AppleSupport', url: 'https://twitter.com/AppleSupport', isVerified: true },
      { platform: 'instagram', handle: '@apple', url: 'https://instagram.com/apple', isVerified: true },
      { platform: 'youtube', handle: '@Apple', url: 'https://youtube.com/@Apple', isVerified: true },
    ],
    threatWatchout: {
      tactic: 'Fake Find My Location SMS Designed to Steal Apple ID & Disable Activation Lock',
      fakeDomains: ['appleid-icloud-login.top', 'findmy-iphone-locate.me'],
      riskScore: 99,
      advice: 'Never input your Apple ID password or passcodes from an SMS link. Check device status only in the native Find My app or on icloud.com/find.',
    },
    visualTheme: 'rose',
    visualGraphicHeadline: 'FAKE "FIND MY IPHONE" SMS PHISHING',
    visualGraphicSubhead: 'Real: icloud.com/find  ❌ Fake: appleid-icloud-login.top',
    visualStats: [
      { label: 'Threat Severity', value: 'High Risk' },
      { label: 'Active Domains', value: '2 Sinkholed' },
      { label: 'Protection', value: 'Activation Lock Active' },
    ],
    helpfulCount: 3420,
    isHelpful: true,
    commentsCount: 142,
    comments: [
      {
        id: 'c-app-1',
        author: 'Liam Evans',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&auto=format&fit=crop&q=80',
        timeAgo: '12m ago',
        text: 'I got this exact SMS yesterday after losing my phone at the airport. Looked so convincing! Thanks for posting.',
        isVerifiedConsumer: true,
      },
      {
        id: 'c-app-2',
        author: 'Sarah Jenkins',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&auto=format&fit=crop&q=80',
        timeAgo: '5m ago',
        text: 'Always check the domain. If it’s not ending in apple.com, it’s 100% fake.',
        isVerifiedConsumer: true,
      },
    ],
    isSaved: true,
    isFollowingBrand: true,
  },
  {
    id: 'post-nike-01',
    brandId: 'brand-nike',
    brandName: 'Nike',
    brandDomain: 'nike.com',
    brandLogo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '1 hour ago',
    category: 'scam_alert',
    badgeType: 'critical',
    badgeText: 'COUNTERFEIT ALERT 🚨',
    title: 'Surge in Fake "90% Off Warehouse Clearance" Social Media Ads',
    content:
      'Our brand defense radar flagged hundreds of fraudulent sponsored posts across Instagram and TikTok advertising "Nike Annual Warehouse Liquidation: All Sneakers $19.99". The destination domain "nike-vip-sale.shop" is a cloned storefront designed to harvest credit cards and bank data. Nike footwear is sold only through nike.com, the Nike App, and the SNKRS platform.',
    officialWebsites: [
      { label: 'Official Nike Store', url: 'https://nike.com', isPrimary: true, sslVerified: true },
      { label: 'SNKRS Release App', url: 'https://snkrs.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@nike', url: 'https://instagram.com/nike', isVerified: true },
      { platform: 'x_twitter', handle: '@nikestore', url: 'https://twitter.com/nikestore', isVerified: true },
    ],
    threatWatchout: {
      tactic: 'Deep-discount Impersonator Ads harvesting Credit Card credentials & CVVs',
      fakeDomains: ['nike-vip-sale.shop', 'snkrs-outlet-official.top'],
      fakeHandles: ['@nike_vip_warehouse_sale'],
      riskScore: 96,
      advice: 'If sneaker prices look impossible, it is a phishing store. Official drops only occur on nike.com or the SNKRS app.',
    },
    visualTheme: 'amber',
    visualGraphicHeadline: 'FAKE "90% OFF" NIKE CLONE STORES',
    visualGraphicSubhead: 'Real: nike.com · Beware of spoofed sponsored shopping ads',
    visualStats: [
      { label: 'Counterfeits Blocked', value: '18 Storefronts' },
      { label: 'Consumer Reports', value: '412 Flagged' },
      { label: 'Official Channels', value: 'nike.com only' },
    ],
    helpfulCount: 2180,
    isHelpful: false,
    commentsCount: 68,
    comments: [
      {
        id: 'c-nike-1',
        author: 'Marcus Reed',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=64&auto=format&fit=crop&q=80',
        timeAgo: '45m ago',
        text: 'Saw this ad on Instagram yesterday selling Travis Scott Jordan 1s for $25. Obvious scam!',
        isVerifiedConsumer: true,
      },
    ],
    isSaved: false,
    isFollowingBrand: true,
  },
  {
    id: 'post-instagram-01',
    brandId: 'brand-instagram',
    brandName: 'Instagram',
    brandDomain: 'instagram.com',
    brandLogo: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '2 hours ago',
    category: 'scam_alert',
    badgeType: 'critical',
    badgeText: 'DM EXTORTION WARNING ⚠️',
    title: 'Beware of Fake "Copyright Infringement" & Account Deletion DMs',
    content:
      'Imposters pretending to be "Meta Trademark Operations" or "Instagram Copyright Team" are sending direct messages claiming your account will be deleted within 24 hours unless you click an appeal link at "meta-help-center.top". Instagram will NEVER send you a DM about copyright violations or request your password. All official copyright notices are sent via email from @support.instagram.com.',
    officialWebsites: [
      { label: 'Instagram Portal', url: 'https://instagram.com', isPrimary: true, sslVerified: true },
      { label: 'Meta Corporate', url: 'https://about.meta.com', isPrimary: false, sslVerified: true },
      { label: 'Help Center', url: 'https://help.instagram.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@instagram', url: 'https://instagram.com/instagram', isVerified: true },
      { platform: 'x_twitter', handle: '@meta', url: 'https://twitter.com/meta', isVerified: true },
    ],
    threatWatchout: {
      tactic: 'Direct Message Phishing threatening 24h account suspension to steal credentials',
      fakeHandles: ['@meta.creator.appeals', '@instagram_badges_desk'],
      fakeDomains: ['meta-help-center.top', 'instagram-appeal-desk.net'],
      riskScore: 98,
      advice: 'Never click links in DMs claiming copyright violations. Check Settings > Help > Support Requests in your app.',
    },
    visualTheme: 'rose',
    visualGraphicHeadline: 'FAKE INSTAGRAM COPYRIGHT DMs',
    visualGraphicSubhead: 'Instagram Never DMs Users About Copyright or Passwords',
    visualStats: [
      { label: 'Attack Vector', value: 'DM Social Engineering' },
      { label: 'Target', value: 'Creator & Business Accounts' },
      { label: 'Safe Channel', value: 'In-App Support Center' },
    ],
    helpfulCount: 4120,
    isHelpful: true,
    commentsCount: 189,
    comments: [
      {
        id: 'c-ig-1',
        author: 'Chloe Vance',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&auto=format&fit=crop&q=80',
        timeAgo: '1h ago',
        text: 'Our brand page received this exact DM yesterday! Reported the account immediately.',
        isVerifiedConsumer: true,
      },
    ],
    isSaved: true,
    isFollowingBrand: true,
  },
  {
    id: 'post-spotify-01',
    brandId: 'brand-spotify',
    brandName: 'Spotify',
    brandDomain: 'spotify.com',
    brandLogo: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '4 hours ago',
    category: 'rogue_app',
    badgeType: 'warning',
    badgeText: 'MALWARE INFECTION ADVISORY 🛡️',
    title: 'Rogue "Spotify Premium Free Lifetime" APKs Distributing Spyware',
    content:
      'We have uncovered modified Android packages (APKs) distributed via Telegram channels and third-party download portals claiming to provide "Free Spotify Premium Unlimited". Analysis confirms these files are bundled with trojans that intercept SMS messages, read contacts, and exfiltrate photos. Download Spotify exclusively from Google Play Store or Apple App Store.',
    officialWebsites: [
      { label: 'Spotify Official Web', url: 'https://spotify.com', isPrimary: true, sslVerified: true },
      { label: 'Support Center', url: 'https://support.spotify.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@spotify', url: 'https://instagram.com/spotify', isVerified: true },
      { platform: 'x_twitter', handle: '@SpotifyCares', url: 'https://twitter.com/SpotifyCares', isVerified: true },
    ],
    threatWatchout: {
      tactic: 'Modified APK containing SMS stealer trojans & unauthorized background payloads',
      fakeDomains: ['spotify-premium-free.top', 'spotify-mod-apk.xyz'],
      riskScore: 94,
      advice: 'Never install .apk files from unverified third-party websites or Telegram chats.',
    },
    visualTheme: 'emerald',
    visualGraphicHeadline: 'TROJANIZED SPOTIFY MODDED APKs',
    visualGraphicSubhead: 'Real: spotify.com · Download only from official App Stores',
    visualStats: [
      { label: 'Payload Type', value: 'SMS Stealer Trojan' },
      { label: 'Infection Vector', value: 'Third-party APKs' },
      { label: 'Safe Download', value: 'Google Play & App Store' },
    ],
    helpfulCount: 1850,
    isHelpful: false,
    commentsCount: 52,
    comments: [],
    isSaved: false,
    isFollowingBrand: false,
  },
  {
    id: 'post-tesla-01',
    brandId: 'brand-tesla',
    brandName: 'Tesla',
    brandDomain: 'tesla.com',
    brandLogo: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '6 hours ago',
    category: 'scam_alert',
    badgeType: 'critical',
    badgeText: 'DEEPFAKE FRAUD RADAR 🚨',
    title: 'Deepfake "Elon Musk Crypto Giveaway" Live Streams Exploiting Tesla Trademark',
    content:
      'Hackers are hijacking verified YouTube and Twitter channels to broadcast AI-generated deepfake streams of Elon Musk promising: "Send 1 BTC or ETH to our address, receive 2 back instantly". Tesla and its executives never hold cryptocurrency giveaways or ask the public to transfer digital assets.',
    officialWebsites: [
      { label: 'Official Tesla Web', url: 'https://tesla.com', isPrimary: true, sslVerified: true },
      { label: 'Investor Relations', url: 'https://ir.tesla.com', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'x_twitter', handle: '@tesla', url: 'https://twitter.com/tesla', isVerified: true },
      { platform: 'instagram', handle: '@teslamotors', url: 'https://instagram.com/teslamotors', isVerified: true },
    ],
    threatWatchout: {
      tactic: 'AI Deepfake Livestreams on hijacked accounts soliciting irreversible crypto transactions',
      fakeDomains: ['tesla-event-claim.top', 'elon-musk-rewards.xyz'],
      riskScore: 99,
      advice: 'There is no such thing as a "2X cryptocurrency giveaway". Any stream asking you to send crypto is fraudulent.',
    },
    visualTheme: 'rose',
    visualGraphicHeadline: 'DEEPFAKE TESLA CRYPTO GIVEAWAY SCAMS',
    visualGraphicSubhead: 'Tesla Never Asks Consumers to Transfer Cryptocurrency',
    visualStats: [
      { label: 'Scam Type', value: 'Deepfake Livestream' },
      { label: 'Stolen Funds Flagged', value: '$1.4M Tracked' },
      { label: 'Takedown Radar', value: 'Automated Stream Blacklist' },
    ],
    helpfulCount: 2940,
    isHelpful: true,
    commentsCount: 97,
    comments: [],
    isSaved: true,
    isFollowingBrand: false,
  },
  {
    id: 'post-netflix-01',
    brandId: 'brand-netflix',
    brandName: 'Netflix',
    brandDomain: 'netflix.com',
    brandLogo: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '8 hours ago',
    category: 'scam_alert',
    badgeType: 'warning',
    badgeText: 'BILLING PHISHING WAVE ⚠️',
    title: 'Widespread "Payment Failed — Membership Frozen" SMS Scam',
    content:
      'A global smishing wave is sending text messages asserting: "Netflix: Your payment failed. To prevent membership termination, please update details at netflix-reactivate-login.net". These links lead to clone pages capturing credit card numbers and OTPs. We never request credit card info via SMS.',
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
      fakeDomains: ['netflix-reactivate-login.net', 'netflix-payment-update.net'],
      riskScore: 95,
      advice: 'Check your account standing by visiting netflix.com directly or through the official Netflix app.',
    },
    visualTheme: 'rose',
    visualGraphicHeadline: 'FAKE NETFLIX PAYMENT FAILURE SMS',
    visualGraphicSubhead: 'Real: netflix.com/youraccount · Manage billing in-app only',
    visualStats: [
      { label: 'Scam Type', value: 'SMS Billing Phish' },
      { label: 'Safe Channel', value: 'In-App Account Settings' },
      { label: 'Takedown Notice', value: 'Dispatched to Registrar' },
    ],
    helpfulCount: 3890,
    isHelpful: false,
    commentsCount: 124,
    comments: [],
    isSaved: false,
    isFollowingBrand: false,
  },
  {
    id: 'post-stripe-01',
    brandId: 'brand-stripe',
    brandName: 'Stripe',
    brandDomain: 'stripe.com',
    brandLogo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '11 hours ago',
    category: 'scam_alert',
    badgeType: 'warning',
    badgeText: 'API SECURITY ADVISORY 🛡️',
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
    helpfulCount: 1640,
    isHelpful: true,
    commentsCount: 44,
    comments: [],
    isSaved: true,
    isFollowingBrand: false,
  },
  {
    id: 'post-openai-01',
    brandId: 'brand-openai',
    brandName: 'OpenAI',
    brandDomain: 'openai.com',
    brandLogo: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '14 hours ago',
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
    helpfulCount: 2470,
    isHelpful: false,
    commentsCount: 71,
    comments: [],
    isSaved: false,
    isFollowingBrand: false,
  },
  {
    id: 'post-amazon-01',
    brandId: 'brand-amazon',
    brandName: 'Amazon',
    brandDomain: 'amazon.com',
    brandLogo: 'https://images.unsplash.com/photo-1523474253246-63e34233167a?w=128&auto=format&fit=crop&q=80',
    isBrandVerified: true,
    timestamp: '1 day ago',
    category: 'scam_alert',
    badgeType: 'warning',
    badgeText: 'LOGISTICS SMISHING ⚠️',
    title: 'Surge in Fake "Package Held for Customs / Fee" Text Messages',
    content:
      'Consumers are receiving SMS text messages stating: "Amazon: Your parcel is on hold due to missing address info. Pay $1.25 fee to reschedule at amazon-parcel-track.top". This steals card numbers and identity details. Amazon does not ask for redelivery fees via text message.',
    officialWebsites: [
      { label: 'Amazon Primary', url: 'https://amazon.com', isPrimary: true, sslVerified: true },
      { label: 'Your Orders', url: 'https://amazon.com/your-orders', isPrimary: false, sslVerified: true },
    ],
    officialSocials: [
      { platform: 'instagram', handle: '@amazon', url: 'https://instagram.com/amazon', isVerified: true },
      { platform: 'x_twitter', handle: '@amazon', url: 'https://twitter.com/amazon', isVerified: true },
    ],
    threatWatchout: {
      tactic: 'Bogus Delivery Failure SMS soliciting credit card payments for fake redeliveries',
      fakeDomains: ['amazon-parcel-track.top', 'amazon-order-verify.xyz'],
      riskScore: 93,
      advice: 'Track all deliveries strictly within the Amazon app or by visiting amazon.com/your-orders directly.',
    },
    visualTheme: 'amber',
    visualGraphicHeadline: 'FAKE AMAZON DELIVERY FEE SMISHING',
    visualGraphicSubhead: 'Real: amazon.com/your-orders · Never pay redelivery fees via SMS',
    visualStats: [
      { label: 'Smishing Vector', value: 'SMS Delivery Hook' },
      { label: 'Takedown Sent', value: 'Hosting Provider Alerted' },
      { label: 'Safe Channel', value: 'Official Amazon App' },
    ],
    helpfulCount: 3120,
    isHelpful: false,
    commentsCount: 88,
    comments: [],
    isSaved: false,
    isFollowingBrand: false,
  },
];

// -------------------------------------------------------------
// Stories / Safety Highlights (Apple HIG Stories bar)
// -------------------------------------------------------------
export const SEED_STORIES: SecurityStory[] = [
  {
    id: 'story-apple',
    brandId: 'brand-apple',
    brandName: 'Apple',
    brandLogo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=128&auto=format&fit=crop&q=80',
    hasUnread: true,
    alertType: 'urgent_scam',
    previewBadge: '⚡ Smishing',
    headline: 'Critical: Fake iCloud "Device Located" SMS Wave',
    bodyText:
      'Scammers are broadcasting fake Find My messages. Never click links in SMS claiming your device has been found. Only use icloud.com/find.',
    officialDomain: 'apple.com',
    officialHandle: '@AppleSupport',
    warningNote: 'Never input Apple ID passwords on non-apple.com URLs.',
    timeAgo: '18m ago',
  },
  {
    id: 'story-nike',
    brandId: 'brand-nike',
    brandName: 'Nike',
    brandLogo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=128&auto=format&fit=crop&q=80',
    hasUnread: true,
    alertType: 'urgent_scam',
    previewBadge: '🚨 Fake Drops',
    headline: 'Beware of 90% Off Fake Sneaker Drops on Instagram',
    bodyText:
      'Fraudulent sponsored ads on social networks are promoting counterfeit stores claiming to sell Jordans for $19.99. Official releases only occur on nike.com and SNKRS.',
    officialDomain: 'nike.com',
    officialHandle: '@nikestore',
    warningNote: 'Domains like "nike-vip-sale.shop" are fraudulent.',
    timeAgo: '1h ago',
  },
  {
    id: 'story-instagram',
    brandId: 'brand-instagram',
    brandName: 'Instagram',
    brandLogo: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=128&auto=format&fit=crop&q=80',
    hasUnread: true,
    alertType: 'urgent_scam',
    previewBadge: '⚠️ Fake DMs',
    headline: 'Fake "Copyright Violation" DMs Threatening Deletion',
    bodyText:
      'Instagram never sends direct messages regarding copyright strikes or account deletion. Do not click links in unsolicited DMs.',
    officialDomain: 'instagram.com',
    officialHandle: '@instagram',
    warningNote: 'Report accounts like @meta.creator.appeals.',
    timeAgo: '2h ago',
  },
  {
    id: 'story-spotify',
    brandId: 'brand-spotify',
    brandName: 'Spotify',
    brandLogo: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=128&auto=format&fit=crop&q=80',
    hasUnread: false,
    alertType: 'security_patch',
    previewBadge: '🛡️ Rogue APKs',
    headline: 'Trojans in Modified "Spotify Free Premium" APKs',
    bodyText:
      'Third-party mod APKs downloaded from Telegram or forums contain SMS Trojans. Download only from the Google Play Store or Apple App Store.',
    officialDomain: 'spotify.com',
    officialHandle: '@SpotifyCares',
    timeAgo: '4h ago',
  },
  {
    id: 'story-tesla',
    brandId: 'brand-tesla',
    brandName: 'Tesla',
    brandLogo: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=128&auto=format&fit=crop&q=80',
    hasUnread: true,
    alertType: 'urgent_scam',
    previewBadge: '🚨 Deepfake',
    headline: 'Fake "Elon Musk 2X Crypto" YouTube Streams',
    bodyText:
      'Hijacked channels are streaming AI deepfakes claiming double crypto giveaways. Tesla never runs crypto giveaways.',
    officialDomain: 'tesla.com',
    officialHandle: '@tesla',
    timeAgo: '6h ago',
  },
  {
    id: 'story-netflix',
    brandId: 'brand-netflix',
    brandName: 'Netflix',
    brandLogo: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=128&auto=format&fit=crop&q=80',
    hasUnread: false,
    alertType: 'urgent_scam',
    previewBadge: '⚠️ Phishing',
    headline: 'Fake "Payment Failed" SMS Smishing Alert',
    bodyText:
      'Never update Netflix credit card details from an SMS link. Check your membership status directly on netflix.com.',
    officialDomain: 'netflix.com',
    officialHandle: '@netflix',
    timeAgo: '8h ago',
  },
  {
    id: 'story-stripe',
    brandId: 'brand-stripe',
    brandName: 'Stripe',
    brandLogo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
    hasUnread: false,
    alertType: 'security_patch',
    previewBadge: '🔒 API Key',
    headline: 'Stripe Security Advisory: API Key Phishing',
    bodyText:
      'Never share your sk_live secret API keys. Legitimate merchant communications will always route through dashboard.stripe.com.',
    officialDomain: 'stripe.com',
    officialHandle: '@stripe',
    timeAgo: '11h ago',
  },
  {
    id: 'story-openai',
    brandId: 'brand-openai',
    brandName: 'OpenAI',
    brandLogo: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=128&auto=format&fit=crop&q=80',
    hasUnread: false,
    alertType: 'urgent_scam',
    previewBadge: '⚠️ Infostealer',
    headline: 'Fake ChatGPT Desktop Installers in Search Ads',
    bodyText:
      'Do not download ChatGPT installers from search ads or third-party sites. The official web app is chatgpt.com.',
    officialDomain: 'openai.com',
    officialHandle: '@OpenAI',
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
    badgeText: 'VERIFIED BRAND DIRECTORY ✅',
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
  const existingDomains = new Set(custom.map((b) => b.domain.toLowerCase()));
  const seedFiltered = SEED_BRANDS.filter((b) => !existingDomains.has(b.domain.toLowerCase()));
  return [...custom, ...seedFiltered];
}

export function getAllStories(brands: BrandSecurityProfile[]): SecurityStory[] {
  const stories: SecurityStory[] = [...SEED_STORIES];

  // If there are custom onboarded brands, prepend a story for them
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
  if (typeof window === 'undefined') return new Set(['brand-apple', 'brand-nike', 'brand-instagram']);
  try {
    const raw = localStorage.getItem(CONSUMER_FOLLOWED_BRANDS_KEY);
    return new Set(raw ? JSON.parse(raw) : ['brand-apple', 'brand-nike', 'brand-instagram']);
  } catch {
    return new Set(['brand-apple', 'brand-nike']);
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
      content: `ASTRA Social Crawler detected an unverified account "@${brand.domain.split('.')[0]}.official.helpdesk" contacting followers with urgent solicitations. We have initiated automated takedown proceedings. Please refer exclusively to the official social handles verified below.`,
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
