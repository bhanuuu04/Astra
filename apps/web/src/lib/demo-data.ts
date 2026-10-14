/**
 * ASTRA BYTE XL Judges Demo — Synthetic Dataset
 * All data is simulated. No real threats, brands, or operations.
 */

export const DEMO_TENANT = {
  id: 'demo-tenant-bytexl-2026',
  name: 'NexBank Financial Group',
  is_demo: true,
};

export const DEMO_USER = {
  id: 'demo-user-judge-01',
  email: 'judge@bytexl.demo',
  full_name: 'Demo Analyst',
  role: 'brand_admin',
  onboarding_completed: true,
};

// ─────────────────────────────────────────────
// BRANDS
// ─────────────────────────────────────────────
export const DEMO_BRANDS = [
  {
    id: 'demo-brand-nexbank',
    tenant_id: DEMO_TENANT.id,
    name: 'NexBank Financial',
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    assets: [
      {
        id: 'asset-nb-domain',
        brand_id: 'demo-brand-nexbank',
        asset_type: 'domain',
        canonical_value: 'nexbank.com',
        verification_status: 'verified' as const,
        verification_method: 'dns_txt',
        verified_at: new Date(Date.now() - 86400000 * 28).toISOString(),
        verified_by: 'system',
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id: 'asset-nb-twitter',
        brand_id: 'demo-brand-nexbank',
        asset_type: 'social_handle',
        canonical_value: '@NexBankOfficial',
        verification_status: 'verified' as const,
        verification_method: 'oauth',
        verified_at: new Date(Date.now() - 86400000 * 27).toISOString(),
        verified_by: 'system',
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id: 'asset-nb-ig',
        brand_id: 'demo-brand-nexbank',
        asset_type: 'social_handle',
        canonical_value: '@nexbank.official',
        verification_status: 'verified' as const,
        verification_method: 'oauth',
        verified_at: new Date(Date.now() - 86400000 * 26).toISOString(),
        verified_by: 'system',
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id: 'asset-nb-app-android',
        brand_id: 'demo-brand-nexbank',
        asset_type: 'mobile_app',
        canonical_value: 'com.nexbank.mobile',
        verification_status: 'verified' as const,
        verification_method: 'manual',
        verified_at: new Date(Date.now() - 86400000 * 25).toISOString(),
        verified_by: 'system',
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
    ],
  },
  {
    id: 'demo-brand-astra',
    tenant_id: DEMO_TENANT.id,
    name: 'Astra Security',
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
    assets: [
      {
        id: 'asset-as-domain',
        brand_id: 'demo-brand-astra',
        asset_type: 'domain',
        canonical_value: 'astra.security',
        verification_status: 'verified' as const,
        verification_method: 'dns_txt',
        verified_at: new Date(Date.now() - 86400000 * 58).toISOString(),
        verified_by: 'system',
        created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      },
      {
        id: 'asset-as-twitter',
        brand_id: 'demo-brand-astra',
        asset_type: 'social_handle',
        canonical_value: '@astrasecurity',
        verification_status: 'verified' as const,
        verification_method: 'oauth',
        verified_at: new Date(Date.now() - 86400000 * 57).toISOString(),
        verified_by: 'system',
        created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      },
    ],
  },
  {
    id: 'demo-brand-vercel',
    tenant_id: DEMO_TENANT.id,
    name: 'Vercel',
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
    assets: [
      {
        id: 'asset-vc-domain',
        brand_id: 'demo-brand-vercel',
        asset_type: 'domain',
        canonical_value: 'vercel.com',
        verification_status: 'verified' as const,
        verification_method: 'dns_txt',
        verified_at: new Date(Date.now() - 86400000 * 42).toISOString(),
        verified_by: 'system',
        created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
      },
      {
        id: 'asset-vc-twitter',
        brand_id: 'demo-brand-vercel',
        asset_type: 'social_handle',
        canonical_value: '@vercel',
        verification_status: 'verified' as const,
        verification_method: 'oauth',
        verified_at: new Date(Date.now() - 86400000 * 41).toISOString(),
        verified_by: 'system',
        created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
      },
      {
        id: 'asset-vc-ig',
        brand_id: 'demo-brand-vercel',
        asset_type: 'social_handle',
        canonical_value: '@vercel_official',
        verification_status: 'verified' as const,
        verification_method: 'oauth',
        verified_at: new Date(Date.now() - 86400000 * 40).toISOString(),
        verified_by: 'system',
        created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
      },
    ],
  },
];

// ─────────────────────────────────────────────
// SIGHTINGS / FINDINGS
// ─────────────────────────────────────────────
const now = Date.now();
const mins = (n: number) => new Date(now - n * 60000).toISOString();
const hours = (n: number) => new Date(now - n * 3600000).toISOString();
const days = (n: number) => new Date(now - n * 86400000).toISOString();

export const DEMO_SIGHTINGS = [
  {
    id: 'demo-sight-vc-001',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-vercel',
    surface: 'web_domain',
    source_kind: 'domain_monitor',
    observed_at: mins(12),
    raw_ref: 'vercellll.co',
    normalized_payload: {
      domain: 'vercellll.co',
      target_url: 'https://vercellll.co/login',
      whois_url: 'https://who.is/whois/vercellll.co',
      ips: ['104.21.32.189', '172.67.144.22'],
      threat_analysis: {
        risk_score: 0.98,
        summary: '[SYNTHETIC THREAT · DEMO] Active typosquatting domain replicating Vercel dashboard login. Harvesting developer deployment tokens and GitHub OAuth tokens.',
        indicators: [
          { title: 'Typosquat Domain (Levenshtein=3)', severity: 'critical' },
          { title: 'Credential Harvester Phishing Form', severity: 'critical' },
          { title: 'Registered via Anonymous Offshore Registrar', severity: 'high' },
        ],
        categories: ['phishing_link', 'credential_harvesting'],
        severity: 'critical',
      },
    },
    created_at: mins(12),
  },
  {
    id: 'demo-sight-vc-002',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-vercel',
    surface: 'web_domain',
    source_kind: 'domain_monitor',
    observed_at: mins(35),
    raw_ref: 'verce.lo',
    normalized_payload: {
      domain: 'verce.lo',
      target_url: 'https://verce.lo/install.sh',
      whois_url: 'https://who.is/whois/verce.lo',
      ips: ['198.54.117.200'],
      threat_analysis: {
        risk_score: 0.96,
        summary: '[SYNTHETIC THREAT · DEMO] Combo-squatting domain mimicking Vercel CLI documentation. Distributing trojanized curl bash installer that exfiltrates environment variables.',
        indicators: [
          { title: 'Combosquat Lookalike Domain', severity: 'critical' },
          { title: 'Malicious Dropper Script Detected', severity: 'critical' },
          { title: 'Targeting Developer Workstations', severity: 'high' },
        ],
        categories: ['malicious_download', 'brand_impersonation'],
        severity: 'critical',
      },
    },
    created_at: mins(35),
  },
  {
    id: 'demo-sight-vc-003',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-vercel',
    surface: 'web_domain',
    source_kind: 'domain_monitor',
    observed_at: hours(3),
    raw_ref: 'vercelsupport.co',
    normalized_payload: {
      domain: 'vercelsupport.co',
      target_url: 'https://vercelsupport.co',
      whois_url: 'https://who.is/whois/vercelsupport.co',
      ips: ['185.220.101.99'],
      threat_analysis: {
        risk_score: 0.94,
        summary: '[SYNTHETIC THREAT · DEMO] Fake support portal claiming deployment quota suspensions to harvest Vercel Access Tokens and enterprise SSO credentials.',
        indicators: [
          { title: 'Lookalike Keyword Addition: [support]', severity: 'high' },
          { title: 'Social Engineering Phishing Portal', severity: 'critical' },
          { title: 'C2 IP Cluster Correlated (ShadowBank Network)', severity: 'high' },
        ],
        categories: ['credential_harvesting', 'brand_impersonation'],
        severity: 'high',
      },
    },
    created_at: hours(3),
  },
  {
    id: 'demo-sight-vc-004',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-vercel',
    surface: 'x_twitter_profile',
    source_kind: 'social_monitor',
    observed_at: hours(5),
    raw_ref: '@vercel_support_bot',
    normalized_payload: {
      sender: {
        username: 'vercel_support_bot',
        displayName: 'Vercel Deployment Support',
        followerCount: 34,
        followingCount: 3820,
        accountCreatedAt: days(2),
        isVerifiedBadge: false,
        isFakeBadgeEmoji: true,
        bio: 'Automated Vercel Build & DNS Resolution Assistant. DM error logs to restore deployments.',
      },
      threat_analysis: {
        risk_score: 0.92,
        summary: '[SYNTHETIC THREAT · DEMO] Fake automated bot on X intercepting public tweets containing "vercel deployment error" to lure developers into phishing DMs.',
        indicators: [
          { title: 'Lookalike Username Impersonating Official Bot', severity: 'critical' },
          { title: 'Active Mention Monitoring & Reply Hijacking', severity: 'high' },
        ],
        categories: ['brand_impersonation', 'social_engineering'],
        severity: 'high',
      },
    },
    created_at: hours(5),
  },
  {
    id: 'demo-sight-001',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'instagram_profile',
    source_kind: 'social_monitor',
    observed_at: mins(8),
    raw_ref: '@nexbank.customer.support',
    normalized_payload: {
      sender: {
        username: 'nexbank.customer.support',
        displayName: 'NexBank Customer Support ✓',
        followerCount: 23,
        followingCount: 1847,
        accountCreatedAt: days(4),
        isVerifiedBadge: false,
        isFakeBadgeEmoji: true,
        bio: 'Official NexBank Support — DM for card blocking, OTP issues & fraud reports.',
        avatarUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=150&auto=format&fit=crop',
      },
      threat_analysis: {
        risk_score: 0.97,
        summary: 'Fake customer support account impersonating NexBank with spoofed verification badge. Account age 4 days, high following ratio. Credential harvesting via phishing DM link.',
        indicators: [
          { title: 'Lookalike Variation Detected [ADDED_WORD: support]', severity: 'critical' },
          { title: 'Fake Verification Badge Emoji', severity: 'critical' },
          { title: 'Suspicious Follower Ratio', severity: 'high' },
        ],
        categories: ['brand_impersonation', 'credential_harvesting'],
        severity: 'critical',
      },
    },
    created_at: mins(8),
  },
  {
    id: 'demo-sight-002',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'web_domain',
    source_kind: 'domain_monitor',
    observed_at: mins(22),
    raw_ref: 'nexbank-secure-login.com',
    normalized_payload: {
      domain: 'nexbank-secure-login.com',
      target_url: 'https://nexbank-secure-login.com',
      whois_url: 'https://who.is/whois/nexbank-secure-login.com',
      ips: ['185.220.101.47', '10.0.0.1'],
      threat_analysis: {
        risk_score: 0.99,
        summary: 'Active phishing domain cloning NexBank login portal. Registered 3 days ago via anonymous registrar. Hosting live credential harvesting form targeting NexBank mobile users.',
        indicators: [
          { title: 'Typosquat Domain (Levenshtein=2)', severity: 'critical' },
          { title: 'Live Phishing Page Detected', severity: 'critical' },
          { title: 'Anonymous Registrar', severity: 'high' },
        ],
        categories: ['phishing_link', 'credential_harvesting'],
        severity: 'critical',
      },
    },
    created_at: mins(22),
  },
  {
    id: 'demo-sight-003',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'telegram_channel',
    source_kind: 'social_monitor',
    observed_at: mins(45),
    raw_ref: 'NexBank_Official_Airdrop',
    normalized_payload: {
      sender: {
        username: 'NexBank_Official_Airdrop',
        displayName: 'NexBank Official Rewards',
        followerCount: 4821,
        followingCount: 12,
        accountCreatedAt: days(11),
        isVerifiedBadge: false,
        isFakeBadgeEmoji: false,
        bio: 'Official NexBank Community Rewards. Claim 500 NBX tokens. Limited time.',
      },
      threat_analysis: {
        risk_score: 0.93,
        summary: 'Fake Telegram channel running crypto airdrop scam using NexBank branding. Luring users to connect wallets and send ETH as "gas fee verification." 4,800+ members already defrauded.',
        indicators: [
          { title: 'Fake Brand Persona', severity: 'critical' },
          { title: 'Crypto Wallet Drainer', severity: 'critical' },
          { title: 'High Victim Count', severity: 'high' },
        ],
        categories: ['brand_impersonation', 'scam_account'],
        severity: 'critical',
      },
    },
    created_at: mins(45),
  },
  {
    id: 'demo-sight-004',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'x_twitter_profile',
    source_kind: 'social_monitor',
    observed_at: hours(2),
    raw_ref: '@NexBànk_Help',
    normalized_payload: {
      sender: {
        username: 'NexBànk_Help',
        displayName: 'NexBank Help Center',
        followerCount: 87,
        followingCount: 2103,
        accountCreatedAt: days(6),
        isVerifiedBadge: false,
        isFakeBadgeEmoji: false,
        bio: '24/7 NexBank Support. Tweet us your issue + case number for priority resolution.',
      },
      threat_analysis: {
        risk_score: 0.88,
        summary: 'Homoglyph attack on X/Twitter using accented character à (U+00E0) in place of "a". Actively responding to real NexBank customer complaints to intercept support sessions.',
        indicators: [
          { title: 'Lookalike Variation Detected [HOMOGLYPH: à→a]', severity: 'high' },
          { title: 'Active Customer Interception', severity: 'critical' },
        ],
        categories: ['brand_impersonation', 'social_engineering'],
        severity: 'high',
      },
    },
    created_at: hours(2),
  },
  {
    id: 'demo-sight-005',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'web_domain',
    source_kind: 'domain_monitor',
    observed_at: hours(3),
    raw_ref: 'nexbank-verify.com',
    normalized_payload: {
      domain: 'nexbank-verify.com',
      target_url: 'https://nexbank-verify.com',
      whois_url: 'https://who.is/whois/nexbank-verify.com',
      ips: ['104.21.45.128'],
      threat_analysis: {
        risk_score: 0.91,
        summary: 'Parked phishing domain impersonating NexBank verification flow. Presents fake KYC/account verification page to harvest PAN, Aadhaar, and banking credentials.',
        indicators: [
          { title: 'Fake KYC Portal', severity: 'critical' },
          { title: 'Typosquat Domain', severity: 'high' },
        ],
        categories: ['phishing_link', 'credential_harvesting'],
        severity: 'critical',
      },
    },
    created_at: hours(3),
  },
  {
    id: 'demo-sight-006',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'linkedin_profile',
    source_kind: 'social_monitor',
    observed_at: hours(5),
    raw_ref: 'Priya Sharma (NexBank CEO)',
    normalized_payload: {
      sender: {
        username: 'priya-sharma-nexbank-ceo',
        displayName: 'Priya Sharma | NexBank CEO ☑️',
        followerCount: 142,
        followingCount: 891,
        accountCreatedAt: days(5),
        isVerifiedBadge: false,
        isFakeBadgeEmoji: true,
        bio: 'Founder & CEO at NexBank Financial Group. Fintech leader. Forbes 30 Under 30.',
      },
      threat_analysis: {
        risk_score: 0.86,
        summary: 'Executive impersonation of NexBank CEO on LinkedIn. Profile actively soliciting investment inquiries and directing victims to fraudulent investment portal. Fake badge emoji in display name.',
        indicators: [
          { title: 'Executive Impersonation', severity: 'critical' },
          { title: 'Fake Badge Emoji (☑️)', severity: 'high' },
          { title: 'Investment Fraud Lure', severity: 'high' },
        ],
        categories: ['brand_impersonation', 'social_engineering'],
        severity: 'high',
      },
    },
    created_at: hours(5),
  },
  {
    id: 'demo-sight-007',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'third_party_apk',
    source_kind: 'app_monitor',
    observed_at: hours(7),
    raw_ref: 'NexBank Mobile Pro (Modded APK)',
    normalized_payload: {
      domain: 'apk-nexbank-pro.net',
      target_url: 'https://apk-nexbank-pro.net/NexBankMobile_v9.1_cracked.apk',
      threat_analysis: {
        risk_score: 0.98,
        summary: 'Trojanized APK clone of NexBank Mobile app distributed via third-party APK site. Contains SMS intercept module (harvests OTPs), screen overlay for credential theft, and C2 communication to 185.220.101.47.',
        indicators: [
          { title: 'SMS Intercept Module Detected', severity: 'critical' },
          { title: 'Screen Overlay Attack', severity: 'critical' },
          { title: 'C2 Server Communication', severity: 'critical' },
        ],
        categories: ['fake_mobile_app', 'credential_harvesting'],
        severity: 'critical',
      },
    },
    created_at: hours(7),
  },
  {
    id: 'demo-sight-008',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'facebook_page',
    source_kind: 'social_monitor',
    observed_at: hours(9),
    raw_ref: 'NexBank Financial Services',
    normalized_payload: {
      sender: {
        username: 'NexBankFinancialServices2024',
        displayName: 'NexBank Financial Services',
        followerCount: 3240,
        followingCount: 45,
        accountCreatedAt: days(18),
        isVerifiedBadge: false,
        isFakeBadgeEmoji: false,
        bio: 'Official NexBank Facebook page. Get support, check loan status, apply for credit cards.',
      },
      threat_analysis: {
        risk_score: 0.82,
        summary: 'Impersonation Facebook page with 3,240 followers actively misleading customers. Running fake loan approval campaigns and collecting personal documents from applicants.',
        indicators: [
          { title: 'Brand Impersonation Page', severity: 'high' },
          { title: 'Document Collection Scam', severity: 'critical' },
        ],
        categories: ['brand_impersonation', 'scam_account'],
        severity: 'high',
      },
    },
    created_at: hours(9),
  },
  {
    id: 'demo-sight-009',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'web_domain',
    source_kind: 'domain_monitor',
    observed_at: hours(12),
    raw_ref: 'nexb4nk.in',
    normalized_payload: {
      domain: 'nexb4nk.in',
      target_url: 'https://nexb4nk.in',
      whois_url: 'https://who.is/whois/nexb4nk.in',
      ips: ['167.99.45.201'],
      threat_analysis: {
        risk_score: 0.79,
        summary: 'Leet-speak substitution domain (4→a) registered under .in TLD targeting Indian NexBank customers. Hosts fake UPI payment portal soliciting banking PIN verification.',
        indicators: [
          { title: 'Leet-speak Domain Substitution', severity: 'high' },
          { title: 'Fake UPI Portal', severity: 'critical' },
        ],
        categories: ['phishing_link'],
        severity: 'high',
      },
    },
    created_at: hours(12),
  },
  {
    id: 'demo-sight-010',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'instagram_profile',
    source_kind: 'social_monitor',
    observed_at: hours(15),
    raw_ref: '@nexbank_official_india',
    normalized_payload: {
      sender: {
        username: 'nexbank_official_india',
        displayName: 'NexBank India Official',
        followerCount: 1204,
        followingCount: 320,
        accountCreatedAt: days(22),
        isVerifiedBadge: false,
        isFakeBadgeEmoji: false,
        bio: 'Official NexBank India Instagram. Apply for credit cards, home loans, & more.',
      },
      threat_analysis: {
        risk_score: 0.74,
        summary: 'Geo-specific impersonation account targeting Indian users. Redirecting followers to phishing landing pages disguised as loan application forms.',
        indicators: [
          { title: 'Geo-targeted Brand Impersonation', severity: 'high' },
          { title: 'Phishing Link in Bio', severity: 'high' },
        ],
        categories: ['brand_impersonation'],
        severity: 'high',
      },
    },
    created_at: hours(15),
  },
  {
    id: 'demo-sight-011',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-astra',
    surface: 'x_twitter_profile',
    source_kind: 'social_monitor',
    observed_at: hours(18),
    raw_ref: '@astra_security_support',
    normalized_payload: {
      sender: {
        username: 'astra_security_support',
        displayName: 'Astra Security Support',
        followerCount: 41,
        followingCount: 1200,
        accountCreatedAt: days(7),
        isVerifiedBadge: false,
        isFakeBadgeEmoji: false,
        bio: 'Official Astra Security Help Desk. DM for enterprise subscription issues.',
      },
      threat_analysis: {
        risk_score: 0.83,
        summary: 'Fake Astra Security support account on X intercepting enterprise customer complaints and redirecting to credential phishing page.',
        indicators: [
          { title: 'Lookalike Support Account', severity: 'high' },
          { title: 'Credential Phishing Redirect', severity: 'critical' },
        ],
        categories: ['brand_impersonation', 'credential_harvesting'],
        severity: 'high',
      },
    },
    created_at: hours(18),
  },
  {
    id: 'demo-sight-012',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'telegram_channel',
    source_kind: 'social_monitor',
    observed_at: hours(20),
    raw_ref: 'NexBank_Trading_Signals',
    normalized_payload: {
      sender: {
        username: 'NexBank_Trading_Signals',
        displayName: 'NexBank Premium Trading Signals',
        followerCount: 8902,
        followingCount: 5,
        accountCreatedAt: days(30),
        isVerifiedBadge: false,
        isFakeBadgeEmoji: false,
        bio: 'NexBank certified trading signals. 94% accuracy. Subscribe for premium access.',
      },
      threat_analysis: {
        risk_score: 0.76,
        summary: 'Investment scam Telegram channel using NexBank branding to sell fraudulent "certified" trading signals. Premium subscription fee collected via Telegram Stars with no refund mechanism.',
        indicators: [
          { title: 'Fake Brand Certification Claim', severity: 'high' },
          { title: 'Investment Fraud', severity: 'high' },
        ],
        categories: ['scam_account', 'brand_impersonation'],
        severity: 'high',
      },
    },
    created_at: hours(20),
  },
  {
    id: 'demo-sight-013',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'web_domain',
    source_kind: 'domain_monitor',
    observed_at: days(2),
    raw_ref: 'nexbank-io.com',
    normalized_payload: {
      domain: 'nexbank-io.com',
      target_url: 'https://nexbank-io.com',
      whois_url: 'https://who.is/whois/nexbank-io.com',
      ips: ['104.18.32.201'],
      threat_analysis: {
        risk_score: 0.68,
        summary: 'Defensive domain squatting with minimal content currently active. Pattern matches previous phishing infrastructure. Registered same day as nexbank-verify.com — coordinated actor.',
        indicators: [
          { title: 'Infrastructure Pattern Match', severity: 'medium' },
          { title: 'Coordinated Registration', severity: 'medium' },
        ],
        categories: ['phishing_link'],
        severity: 'medium',
      },
    },
    created_at: days(2),
  },
  {
    id: 'demo-sight-014',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'youtube_channel',
    source_kind: 'social_monitor',
    observed_at: days(3),
    raw_ref: 'NexBank Official YT',
    normalized_payload: {
      sender: {
        username: 'NexBankOfficial_YT',
        displayName: 'NexBank Official',
        followerCount: 15700,
        followingCount: 0,
        accountCreatedAt: days(45),
        isVerifiedBadge: false,
        isFakeBadgeEmoji: false,
        bio: 'NexBank official YouTube — financial tips, product demos & CEO interviews.',
      },
      threat_analysis: {
        risk_score: 0.61,
        summary: 'Impersonation YouTube channel with 15.7K subscribers running live-stream investment fraud. Poses as NexBank CEO conducting a "financial Q&A" while soliciting crypto transfers.',
        indicators: [
          { title: 'Live-stream Investment Scam', severity: 'high' },
          { title: 'High Subscriber Count', severity: 'medium' },
        ],
        categories: ['brand_impersonation', 'scam_account'],
        severity: 'medium',
      },
    },
    created_at: days(3),
  },
  {
    id: 'demo-sight-015',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    surface: 'third_party_apk',
    source_kind: 'app_monitor',
    observed_at: days(4),
    raw_ref: 'NexBank Lite (APK Mirror)',
    normalized_payload: {
      domain: 'apkmirror-nexbank.io',
      target_url: 'https://apkmirror-nexbank.io/nexbank-lite.apk',
      threat_analysis: {
        risk_score: 0.87,
        summary: 'Repackaged NexBank Android app hosted on fake APK Mirror site. Contains aggressive adware and data exfiltration module. SHA-256 hash mismatch with official Play Store build.',
        indicators: [
          { title: 'SHA-256 Hash Mismatch', severity: 'critical' },
          { title: 'Data Exfiltration Module', severity: 'critical' },
          { title: 'Fake Distribution Site', severity: 'high' },
        ],
        categories: ['fake_mobile_app'],
        severity: 'critical',
      },
    },
    created_at: days(4),
  },
];

// ─────────────────────────────────────────────
// CAMPAIGNS
// ─────────────────────────────────────────────
export const DEMO_CAMPAIGNS = [
  {
    id: 'demo-camp-001',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    title: 'Operation ShadowBank — Credential Phishing Network',
    status: 'active',
    risk_score: 94,
    first_seen_at: days(4),
    last_seen_at: mins(22),
    created_at: days(4),
    member_count: 8,
    members: ['demo-sight-002', 'demo-sight-005', 'demo-sight-009', 'demo-sight-001', 'demo-sight-004', 'demo-sight-007', 'demo-sight-013'],
    edges: [
      { id: 'edge-001', from_endpoint: 'demo-sight-002', to_endpoint: 'demo-sight-005', pivot_type: 'shared_infrastructure', confidence: 0.96, review_status: 'confirmed', created_at: days(2) },
      { id: 'edge-002', from_endpoint: 'demo-sight-005', to_endpoint: 'demo-sight-013', pivot_type: 'registrar_pattern', confidence: 0.88, review_status: 'confirmed', created_at: days(2) },
      { id: 'edge-003', from_endpoint: 'demo-sight-002', to_endpoint: 'demo-sight-007', pivot_type: 'shared_c2', confidence: 0.91, review_status: 'confirmed', created_at: days(1) },
    ],
    signals: [
      { id: 'sig-001', detector_key: 'phishing_domain_cluster', score: 0.97, explanation: 'Three domains share registrar fingerprint and IP block 185.220.101.x — coordinated phishing infrastructure.', created_at: days(2) },
      { id: 'sig-002', detector_key: 'c2_server_correlation', score: 0.91, explanation: 'APK and phishing domain both beacon to 185.220.101.47 — same threat actor controlling both vectors.', created_at: days(1) },
    ],
  },
  {
    id: 'demo-camp-002',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    title: 'NexBank Phishing Wave — Multi-Domain Campaign',
    status: 'active',
    risk_score: 91,
    first_seen_at: days(3),
    last_seen_at: hours(3),
    created_at: days(3),
    member_count: 6,
    members: ['demo-sight-005', 'demo-sight-002', 'demo-sight-009'],
    edges: [
      { id: 'edge-004', from_endpoint: 'demo-sight-005', to_endpoint: 'demo-sight-009', pivot_type: 'similar_content', confidence: 0.84, review_status: 'pending', created_at: days(1) },
    ],
    signals: [
      { id: 'sig-003', detector_key: 'lookalike_cluster', score: 0.93, explanation: 'All domains are Levenshtein distance ≤2 from nexbank.com and registered within 72h window.', created_at: days(1) },
    ],
  },
  {
    id: 'demo-camp-003',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    title: 'Telegram Crypto Scam Network',
    status: 'active',
    risk_score: 87,
    first_seen_at: days(11),
    last_seen_at: mins(45),
    created_at: days(11),
    member_count: 5,
    members: ['demo-sight-003', 'demo-sight-012'],
    edges: [
      { id: 'edge-005', from_endpoint: 'demo-sight-003', to_endpoint: 'demo-sight-012', pivot_type: 'same_operator', confidence: 0.79, review_status: 'pending', created_at: days(5) },
    ],
    signals: [
      { id: 'sig-004', detector_key: 'crypto_scam_pattern', score: 0.89, explanation: 'Both channels use identical wallet address and ETH gas fee verification script — same operator.', created_at: days(5) },
    ],
  },
  {
    id: 'demo-camp-004',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    title: 'Executive Impersonation Ring — LinkedIn & Instagram',
    status: 'active',
    risk_score: 83,
    first_seen_at: days(5),
    last_seen_at: hours(5),
    created_at: days(5),
    member_count: 4,
    members: ['demo-sight-006', 'demo-sight-001', 'demo-sight-010'],
    edges: [
      { id: 'edge-006', from_endpoint: 'demo-sight-006', to_endpoint: 'demo-sight-001', pivot_type: 'coordinated_timing', confidence: 0.72, review_status: 'pending', created_at: days(3) },
    ],
    signals: [
      { id: 'sig-005', detector_key: 'impersonation_cluster', score: 0.85, explanation: 'Multiple accounts created within 48h using similar naming patterns targeting NexBank brand.', created_at: days(3) },
    ],
  },
  {
    id: 'demo-camp-005',
    tenant_id: DEMO_TENANT.id,
    brand_id: 'demo-brand-nexbank',
    title: 'Rogue APK Distribution Ring',
    status: 'active',
    risk_score: 78,
    first_seen_at: days(7),
    last_seen_at: hours(7),
    created_at: days(7),
    member_count: 3,
    members: ['demo-sight-007', 'demo-sight-015'],
    edges: [
      { id: 'edge-007', from_endpoint: 'demo-sight-007', to_endpoint: 'demo-sight-015', pivot_type: 'shared_code_signature', confidence: 0.88, review_status: 'confirmed', created_at: days(4) },
    ],
    signals: [
      { id: 'sig-006', detector_key: 'apk_code_similarity', score: 0.91, explanation: 'Both APKs share identical overlay attack module and C2 endpoint — repackaged by same actor.', created_at: days(4) },
    ],
  },
];

// ─────────────────────────────────────────────
// ROGUE APPS
// ─────────────────────────────────────────────
export const DEMO_ROGUE_APPS = [
  {
    id: 'demo-app-001',
    appName: 'NexBank Mobile Pro v9.1 (Cracked)',
    packageName: 'com.nexbank.mobile.pro.cracked',
    sourcePlatform: 'third_party_apk' as const,
    detectedInSightingId: 'demo-sight-007',
    discoveredAt: hours(7),
    downloadUrl: 'https://apk-nexbank-pro.net/NexBankMobile_v9.1_cracked.apk',
    sha256: '9f83e204c3210b4105aef89d1b702ec45819024f2b1c8a147e83492750e26d83',
    riskScore: 98,
    status: 'active_threat' as const,
    targetBrand: 'NexBank Financial',
    impersonationDetails: 'Trojanized NexBank Android APK with SMS intercept module (harvests OTPs), screen overlay for credential theft, and C2 beacon to 185.220.101.47.',
  },
  {
    id: 'demo-app-002',
    appName: 'NexBank Lite — Fast Banking',
    packageName: 'com.nexbank.lite.unofficial',
    sourcePlatform: 'third_party_apk' as const,
    detectedInSightingId: 'demo-sight-015',
    discoveredAt: days(4),
    downloadUrl: 'https://apkmirror-nexbank.io/nexbank-lite.apk',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    riskScore: 87,
    status: 'takedown_submitted' as const,
    targetBrand: 'NexBank Financial',
    impersonationDetails: 'Repackaged app with aggressive adware, data exfiltration to remote endpoint. SHA-256 mismatch with official Play Store version.',
  },
  {
    id: 'demo-app-003',
    appName: 'Astra Security Authenticator (Modded)',
    packageName: 'com.astra.authenticator.cloned',
    sourcePlatform: 'telegram_dm' as const,
    discoveredAt: days(8),
    downloadUrl: 'https://t.me/AstraTokenAirdrop/apk',
    sha256: '3a7bd3e2360a3d29eea436fcfb7e44c735d117fcb0d099354830471981e28a5f',
    riskScore: 89,
    status: 'active_threat' as const,
    targetBrand: 'Astra Security',
    impersonationDetails: 'Modified Astra 2FA app that exfiltrates TOTP seeds to malicious C2 server while appearing to function normally.',
  },
];

// ─────────────────────────────────────────────
// RESPONSE CASES
// ─────────────────────────────────────────────
export const DEMO_RESPONSE_CASES = [
  {
    action_id: 'demo-resp-001',
    campaign_id: 'demo-camp-001',
    campaign_title: 'Operation ShadowBank — Credential Phishing Network',
    status: 'in_progress',
    created_at: hours(2),
    drafts: [
      {
        recipient_type: 'platform',
        recipient_name: 'Cloudflare Abuse Team',
        subject: 'Abuse Report: Active Phishing Domain nexbank-secure-login.com',
        body_text: 'We are reporting the domain nexbank-secure-login.com which is actively being used to host a credential phishing page impersonating NexBank Financial. We have SHA-256 verified evidence of the phishing form, WHOIS data showing anonymous registration 3 days ago, and live screenshots of the active page.',
        contact_email: 'abuse@cloudflare.com',
        portal_url: 'https://www.cloudflare.com/abuse/form/',
        policy_reference: 'Cloudflare Abuse Policy §3.2 — Phishing & Fraud',
      },
      {
        recipient_type: 'registrar',
        recipient_name: 'Namecheap Abuse',
        subject: 'Domain Abuse Complaint: nexbank-secure-login.com Phishing Infrastructure',
        body_text: 'Formal complaint regarding nexbank-secure-login.com registered through your platform. Domain is actively serving phishing content targeting financial institution customers.',
        contact_email: 'abuse@namecheap.com',
        portal_url: 'https://www.namecheap.com/support/knowledgebase/article.aspx/9196',
        policy_reference: 'Namecheap Terms §10 — Fraudulent Use',
      },
    ],
    manifest: [
      { id: 'ev-001', name: 'phishing_page_screenshot.png', media_type: 'image/png', sha256: 'a1b2c3d4...', captured_at: hours(3), source_reference: 'nexbank-secure-login.com', included: true },
      { id: 'ev-002', name: 'whois_record.json', media_type: 'application/json', sha256: 'e4f5g6h7...', captured_at: hours(3), source_reference: 'WHOIS API', included: true },
      { id: 'ev-003', name: 'network_trace.pcap', media_type: 'application/octet-stream', sha256: 'h8i9j0k1...', captured_at: hours(2), source_reference: 'Traffic Analysis', included: true },
    ],
  },
  {
    action_id: 'demo-resp-002',
    campaign_id: 'demo-camp-003',
    campaign_title: 'Telegram Crypto Scam Network',
    status: 'evidence_compiled',
    created_at: hours(6),
    drafts: [
      {
        recipient_type: 'platform',
        recipient_name: 'Telegram Abuse',
        subject: 'Report: Fake NexBank Channel Running Crypto Airdrop Scam',
        body_text: 'We are reporting channels NexBank_Official_Airdrop and NexBank_Trading_Signals on Telegram which are impersonating NexBank Financial to conduct cryptocurrency fraud affecting 4,800+ users.',
        contact_email: 'abuse@telegram.org',
        portal_url: 'https://telegram.org/faq#q-how-do-i-report-spam',
        policy_reference: 'Telegram Terms §8 — No Fraud',
      },
    ],
    manifest: [
      { id: 'ev-004', name: 'telegram_channel_archive.html', media_type: 'text/html', sha256: 'l2m3n4o5...', captured_at: days(1), source_reference: 'Telegram Channel', included: true },
      { id: 'ev-005', name: 'victim_reports_compiled.pdf', media_type: 'application/pdf', sha256: 'p6q7r8s9...', captured_at: hours(8), source_reference: 'Victim Analysis', included: true },
    ],
  },
  {
    action_id: 'demo-resp-003',
    campaign_id: 'demo-camp-004',
    campaign_title: 'Executive Impersonation Ring',
    status: 'platform_notified',
    created_at: days(1),
    drafts: [
      {
        recipient_type: 'platform',
        recipient_name: 'LinkedIn Trust & Safety',
        subject: 'Executive Impersonation: Fake NexBank CEO Profile',
        body_text: 'We are reporting profile priya-sharma-nexbank-ceo on LinkedIn which is impersonating our CEO Priya Sharma to conduct investment fraud.',
        contact_email: 'safety@linkedin.com',
        portal_url: 'https://www.linkedin.com/help/linkedin/ask/TS-RFI',
        policy_reference: 'LinkedIn Professional Community Policies — Fake Profiles',
      },
    ],
    manifest: [
      { id: 'ev-006', name: 'linkedin_profile_archive.pdf', media_type: 'application/pdf', sha256: 't0u1v2w3...', captured_at: days(1), source_reference: 'LinkedIn Profile', included: true },
    ],
  },
];

// ─────────────────────────────────────────────
// OVERVIEW STATS
// ─────────────────────────────────────────────
export const DEMO_OVERVIEW = {
  brands: 3,
  sightings: DEMO_SIGHTINGS.length,
  active_campaigns: 5,
  high_risk_campaigns: 3,
  environment: 'BYTE XL Demo',
};

// ─────────────────────────────────────────────
// CONNECTORS (Data Sources)
// ─────────────────────────────────────────────
export const DEMO_CONNECTORS = [
  { platform: 'instagram', name: 'Meta Graph API (Instagram)', enabled: true, status: 'connected' as const, lastSyncedAt: mins(3), authType: 'oauth' as const, credentials: { pageId: '10984...', accessToken: 'EAA••••••••••••••••' }, metrics: { messagesIngested: 3120, threatsDetected: 142 } },
  { platform: 'x_twitter', name: 'X (Twitter) Enterprise API v2', enabled: true, status: 'connected' as const, lastSyncedAt: mins(1), authType: 'oauth' as const, credentials: { clientId: 'NB_X_CLIENT_ID', accessToken: '••••••••••••••••' }, metrics: { messagesIngested: 1420, threatsDetected: 87 } },
  { platform: 'linkedin', name: 'LinkedIn Community Management API', enabled: true, status: 'connected' as const, lastSyncedAt: mins(12), authType: 'oauth' as const, credentials: { clientId: '86a9z7••••••', accessToken: 'AQV7••••••••••••' }, metrics: { messagesIngested: 620, threatsDetected: 19 } },
  { platform: 'telegram', name: 'Telegram Bot API & Channel Webhook', enabled: true, status: 'connected' as const, lastSyncedAt: mins(1), authType: 'token' as const, credentials: { botToken: '682940172:••••••••••••' }, metrics: { messagesIngested: 450, threatsDetected: 63 } },
  { platform: 'facebook', name: 'Meta Graph API (Facebook)', enabled: true, status: 'connected' as const, lastSyncedAt: mins(7), authType: 'oauth' as const, credentials: { pageId: '234567...', accessToken: 'EAAG••••••••' }, metrics: { messagesIngested: 890, threatsDetected: 34 } },
  { platform: 'discord', name: 'Discord Bot & Trust Gateway', enabled: false, status: 'disconnected' as const, authType: 'token' as const, credentials: { botToken: '' }, metrics: { messagesIngested: 0, threatsDetected: 0 } },
];

// ─────────────────────────────────────────────
// DEMO STORAGE KEY
// ─────────────────────────────────────────────
export const DEMO_STORAGE_KEY = 'astra_bytexl_demo_active';
export const DEMO_TOUR_STEP_KEY = 'astra_bytexl_tour_step';
export const DEMO_STATE_KEY = 'astra_bytexl_demo_state';
export const DEMO_TOUR_ACTIVE_KEY = 'astra_bytexl_tour_active';
