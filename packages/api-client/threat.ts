export type SocialPlatform = 
  | 'x_twitter'
  | 'instagram'
  | 'linkedin'
  | 'telegram'
  | 'discord'
  | 'facebook'
  | 'whatsapp';

export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low' | 'clean';

export type ThreatCategory = 
  | 'brand_impersonation'
  | 'scam_account'
  | 'fake_profile'
  | 'fake_mobile_app'
  | 'phishing_link'
  | 'social_engineering'
  | 'credential_harvesting'
  | 'legitimate';

export interface ThreatIndicator {
  type: 'impersonation' | 'fake_account' | 'rogue_app' | 'phishing' | 'social_engineering' | 'anomaly';
  severity: ThreatSeverity;
  title: string;
  description: string;
  evidence: string;
}

export interface ExtractedArtifact {
  type: 'url' | 'apk' | 'domain' | 'email' | 'crypto_wallet' | 'phone';
  value: string;
  isMalicious: boolean;
  notes?: string;
}

export interface ThreatAnalysis {
  riskScore: number; // 0 - 100
  severity: ThreatSeverity;
  categories: ThreatCategory[];
  summary: string;
  impersonationScore: number; // 0 - 100
  fakeAccountProbability: number; // 0 - 100
  maliciousPayloadDetected: boolean;
  fakeMobileAppDetected: boolean;
  indicators: ThreatIndicator[];
  extractedArtifacts: ExtractedArtifact[];
  recommendedActions: string[];
}

export interface SenderProfile {
  id: string;
  platform: SocialPlatform;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  accountCreatedAt?: string;
  isVerifiedBadge: boolean;
  isFakeBadgeEmoji: boolean; // e.g. using ☑️ or ✓ in display name
  postCount?: number;
  profileUrl?: string;
}

export interface SocialMessage {
  id: string;
  platform: SocialPlatform;
  brandAccountId: string; // which brand channel received this
  sender: SenderProfile;
  content: string;
  timestamp: string; // ISO string
  attachments?: {
    type: 'image' | 'video' | 'file' | 'audio';
    url: string;
    filename?: string;
    mimeType?: string;
  }[];
  analysis: ThreatAnalysis;
  status: 'new' | 'investigating' | 'quarantined' | 'takedown_requested' | 'resolved' | 'dismissed';
  notes?: string;
}

export interface BrandAssetRegistry {
  id: string;
  brandName: string;
  legalEntity: string;
  officialDomains: string[];
  officialHandles: {
    platform: SocialPlatform;
    handle: string;
    verified: boolean;
  }[];
  officialMobileApps: {
    platform: 'android' | 'ios';
    name: string;
    identifier: string; // package name e.g. com.astra.security or App Store ID
    storeUrl: string;
  }[];
  protectedExecutives: {
    name: string;
    role: string;
    handles: string[];
  }[];
  contactEmail: string;
}

export interface ConnectorCredential {
  platform: SocialPlatform;
  name: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSyncedAt?: string;
  authType: 'oauth' | 'token' | 'webhook';
  credentials: {
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    botToken?: string;
    webhookSecret?: string;
    webhookUrl?: string;
    pageId?: string;
  };
  metrics: {
    messagesIngested: number;
    threatsDetected: number;
    lastError?: string;
  };
}

export interface RogueAppListing {
  id: string;
  appName: string;
  packageName: string;
  sourcePlatform: 'third_party_apk' | 'telegram_dm' | 'instagram_dm' | 'x_dm' | 'cloned_playstore' | 'phishing_landing';
  detectedInMessageId?: string;
  discoveredAt: string;
  downloadUrl: string;
  sha256?: string;
  riskScore: number;
  status: 'active_threat' | 'takedown_submitted' | 'removed';
  targetBrand: string;
  impersonationDetails: string;
}
