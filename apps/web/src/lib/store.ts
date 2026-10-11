import { 
  BrandAssetRegistry, 
  ConnectorCredential, 
  RogueAppListing, 
  SocialMessage 
} from '@/types/threat';
import { analyzeSocialMessage } from './threat-engine';

export const DEFAULT_BRAND_REGISTRY: BrandAssetRegistry = {
  id: 'brand-astra-01',
  brandName: 'Astra Security',
  legalEntity: 'Astra CyberDefense Technologies Inc.',
  officialDomains: ['astra.security', 'astradefense.io', 'getastra.com'],
  officialHandles: [
    { platform: 'x_twitter', handle: 'astrasecurity', verified: true },
    { platform: 'instagram', handle: 'astra.cyber', verified: true },
    { platform: 'linkedin', handle: 'astra-cyberdefense', verified: true },
    { platform: 'telegram', handle: 'astrasupport_official_bot', verified: true },
    { platform: 'discord', handle: 'AstraDefense', verified: true },
    { platform: 'facebook', handle: 'AstraSecurityOfficial', verified: true },
    { platform: 'whatsapp', handle: '+18005550199', verified: true }
  ],
  officialMobileApps: [
    {
      platform: 'android',
      name: 'Astra Shield Mobile',
      identifier: 'com.astra.cyberdefense',
      storeUrl: 'https://play.google.com/store/apps/details?id=com.astra.cyberdefense'
    },
    {
      platform: 'ios',
      name: 'Astra 2FA Authenticator',
      identifier: 'com.astra.security.ios',
      storeUrl: 'https://apps.apple.com/app/astra-security/id1594839201'
    }
  ],
  protectedExecutives: [
    {
      name: 'Alex Mercer',
      role: 'Chief Information Security Officer (CISO)',
      handles: ['alexmercer_ciso', 'alex-mercer-astra']
    },
    {
      name: 'Elena Rostova',
      role: 'VP of Threat Intelligence',
      handles: ['elena_rostova_sec', 'elena-rostova']
    }
  ],
  contactEmail: 'security@astra.security'
};

export const DEFAULT_CONNECTORS: ConnectorCredential[] = [
  {
    platform: 'x_twitter',
    name: 'X (Twitter) Enterprise API v2',
    enabled: true,
    status: 'connected',
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    authType: 'oauth',
    credentials: {
      clientId: 'ASTRA_X_CLIENT_ID_PROD',
      clientSecret: '••••••••••••••••••••••••',
      accessToken: '••••••••••••••••••••••••',
      webhookUrl: 'https://api.astra.security/api/webhooks/twitter'
    },
    metrics: {
      messagesIngested: 1420,
      threatsDetected: 87
    }
  },
  {
    platform: 'instagram',
    name: 'Meta Graph API (Instagram DM)',
    enabled: true,
    status: 'connected',
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    authType: 'token',
    credentials: {
      pageId: '109845729184712',
      accessToken: 'EAABwzL9...••••••••••••',
      webhookSecret: '••••••••••••••••••••••••',
      webhookUrl: 'https://api.astra.security/api/webhooks/instagram'
    },
    metrics: {
      messagesIngested: 3120,
      threatsDetected: 142
    }
  },
  {
    platform: 'telegram',
    name: 'Telegram Bot API & Channel Webhook',
    enabled: true,
    status: 'connected',
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    authType: 'token',
    credentials: {
      botToken: '682940172:AAFZ••••••••••••••••',
      webhookUrl: 'https://api.astra.security/api/webhooks/telegram'
    },
    metrics: {
      messagesIngested: 450,
      threatsDetected: 63
    }
  },
  {
    platform: 'linkedin',
    name: 'LinkedIn Community Management API',
    enabled: true,
    status: 'connected',
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    authType: 'oauth',
    credentials: {
      clientId: '86a9z7••••••••',
      clientSecret: '••••••••••••••••',
      accessToken: 'AQV7••••••••••••••••'
    },
    metrics: {
      messagesIngested: 620,
      threatsDetected: 19
    }
  },
  {
    platform: 'discord',
    name: 'Discord Bot & Trust Gateway',
    enabled: false,
    status: 'disconnected',
    authType: 'token',
    credentials: {
      botToken: '',
      webhookUrl: 'https://api.astra.security/api/webhooks/discord'
    },
    metrics: {
      messagesIngested: 0,
      threatsDetected: 0
    }
  },
  {
    platform: 'whatsapp',
    name: 'WhatsApp Business Cloud API',
    enabled: false,
    status: 'disconnected',
    authType: 'token',
    credentials: {
      pageId: '',
      accessToken: ''
    },
    metrics: {
      messagesIngested: 0,
      threatsDetected: 0
    }
  }
];

export const INITIAL_MESSAGES_RAW = [
  {
    id: 'msg-001',
    platform: 'instagram' as const,
    brandAccountId: 'brand-astra-01',
    sender: {
      id: 'usr-ig-01',
      platform: 'instagram' as const,
      username: 'astra_mobile_security_patch',
      displayName: 'Astra Mobile Support ✓',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      bio: 'Official Astra Security Technical Assistance Desk. Contact here for app issues.',
      followerCount: 14,
      followingCount: 1240,
      accountCreatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 3).toISOString(), // 3 days ago
      isVerifiedBadge: false,
      isFakeBadgeEmoji: true,
      postCount: 1
    },
    content: 'CRITICAL SECURITY BULLETIN: We detected an unauthorized intrusion attempt targeting your enterprise console. You must install the urgent Astra Mobile Security patch v4.2.1 immediately to prevent account suspension: https://astra-mobile-update.top/downloads/AstraSecurity_Patch_v4.2.1.apk within 24 hours.',
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    status: 'new' as const
  },
  {
    id: 'msg-002',
    platform: 'x_twitter' as const,
    brandAccountId: 'brand-astra-01',
    sender: {
      id: 'usr-tw-02',
      platform: 'x_twitter' as const,
      username: 'astrà_support_desk', // homoglyph à
      displayName: 'Astra HelpDesk Center',
      avatarUrl: 'https://images.unsplash.com/photo-1633409381658-a0cdef852895?w=150&auto=format&fit=crop&q=80',
      bio: '24/7 Priority Resolution Desk for Astra Cybersecurity subscribers. Direct Message us.',
      followerCount: 42,
      followingCount: 890,
      accountCreatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 6).toISOString(),
      isVerifiedBadge: false,
      isFakeBadgeEmoji: false
    },
    content: 'Urgent notice regarding your official handle: Case ID #TR-9941. We received a legal trademark infringement claim against your account. If you do not appeal within 12 hours, your handle @astrasecurity will be revoked. Submit your ownership appeal here: https://bit.ly/astra-appeal-case-9941',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'new' as const
  },
  {
    id: 'msg-003',
    platform: 'telegram' as const,
    brandAccountId: 'brand-astra-01',
    sender: {
      id: 'usr-tg-03',
      platform: 'telegram' as const,
      username: 'AstraToken_Official_Airdrop',
      displayName: 'Astra Security Foundation Airdrop',
      avatarUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=150&auto=format&fit=crop&q=80',
      bio: 'Astra CyberDefenders Community Reward Portal. Connect wallet to claim $ASTRA.',
      followerCount: 310,
      followingCount: 15,
      accountCreatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 10).toISOString(),
      isVerifiedBadge: false,
      isFakeBadgeEmoji: false
    },
    content: 'CONGRATULATIONS! Your social handle has been selected for the Astra CyberDefenders Foundation exclusive reward pool. Claim 10,000 $ASTRA governance tokens now. Verify your Web3 wallet address at https://astra-token-distribution.xyz. Gas verification fee: Send 0.04 ETH to 0x71C949A4C78D2c99b82F995a9757659560f4C221 to unlock instant distribution.',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'quarantined' as const
  },
  {
    id: 'msg-004',
    platform: 'linkedin' as const,
    brandAccountId: 'brand-astra-01',
    sender: {
      id: 'usr-li-04',
      platform: 'linkedin' as const,
      username: 'alex-mercer-astra9283',
      displayName: 'Alex Mercer (Astra CISO) ☑️',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Chief Information Security Officer at Astra CyberDefense. Cybersecurity leader.',
      followerCount: 28,
      followingCount: 1450,
      accountCreatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 4).toISOString(),
      isVerifiedBadge: false,
      isFakeBadgeEmoji: true
    },
    content: 'Hi team, I am currently boarding an international flight and have restricted access to our internal corporate portal. Could someone from IT quickly inspect this urgent procurement security document for our cloud vendor renewal? https://secure-doc-review.live/astra-cloud-contract.pdf. Please confirm receipt as soon as reviewed.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    status: 'investigating' as const
  },
  {
    id: 'msg-005',
    platform: 'x_twitter' as const,
    brandAccountId: 'brand-astra-01',
    sender: {
      id: 'usr-tw-05',
      platform: 'x_twitter' as const,
      username: 'dev_sarah_cloud',
      displayName: 'Sarah Jenkins | DevOps Lead',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'DevOps & Cloud Architect @ FinTechStack. Building high-resilience Kubernetes clusters.',
      followerCount: 4210,
      followingCount: 610,
      accountCreatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 720).toISOString(),
      isVerifiedBadge: true,
      isFakeBadgeEmoji: false
    },
    content: 'Hello @astrasecurity team! We are currently conducting an evaluation of your Brand Protection & API scanning solutions for our enterprise infrastructure. Could someone from your partnerships or sales engineering team connect with us at security-ops@fintechstack.io?',
    timestamp: new Date(Date.now() - 1000 * 60 * 340).toISOString(),
    status: 'resolved' as const
  }
];

export const INITIAL_ROGUE_APPS: RogueAppListing[] = [
  {
    id: 'rogue-app-01',
    appName: 'Astra Mobile Security Patch v4.2.1',
    packageName: 'com.astra.security.patch.updater',
    sourcePlatform: 'instagram_dm',
    detectedInMessageId: 'msg-001',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    downloadUrl: 'https://astra-mobile-update.top/downloads/AstraSecurity_Patch_v4.2.1.apk',
    sha256: '9f83e204c3210b4105aef89d1b702ec45819024f2b1c8a147e83492750e26d83',
    riskScore: 98,
    status: 'active_threat',
    targetBrand: 'Astra Security',
    impersonationDetails: 'Rogue trojanized Android APK mimicking Astra Shield Mobile. Employs SMS intercept & overlay credential theft permissions.'
  },
  {
    id: 'rogue-app-02',
    appName: 'Astra Token Claim Companion',
    packageName: 'org.astra.foundation.airdrop',
    sourcePlatform: 'telegram_dm',
    detectedInMessageId: 'msg-003',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    downloadUrl: 'https://astra-token-distribution.xyz/mobile/claim-app.apk',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    riskScore: 94,
    status: 'takedown_submitted',
    targetBrand: 'Astra Security',
    impersonationDetails: 'Fraudulent crypto wallet harvester masquerading as official Web3 utility app.'
  },
  {
    id: 'rogue-app-03',
    appName: 'Astra Authenticator Pro (Modded)',
    packageName: 'com.astra.authenticator.cloned',
    sourcePlatform: 'third_party_apk',
    discoveredAt: new Date(Date.now() - 1000 * 3600 * 48).toISOString(),
    downloadUrl: 'https://apk-fast-mirror.cam/store/astra-auth-cloned.apk',
    sha256: '3a7bd3e2360a3d29eea436fcfb7e44c735d117fcb0d099354830471981e28a5f',
    riskScore: 89,
    status: 'active_threat',
    targetBrand: 'Astra Security',
    impersonationDetails: 'Modified clone of official Astra 2FA app extracting private TOTP seeds to malicious C2 server.'
  }
];

export function buildInitialSocialMessages(): SocialMessage[] {
  return INITIAL_MESSAGES_RAW.map(m => {
    const analysis = analyzeSocialMessage(m.content, m.sender, DEFAULT_BRAND_REGISTRY);
    return {
      ...m,
      analysis
    };
  });
}
