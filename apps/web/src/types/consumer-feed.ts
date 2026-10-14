export type AlertCategory =
  | 'official_directory'
  | 'scam_alert'
  | 'security_update'
  | 'rogue_app'
  | 'policy_advisory';

export type AlertBadgeType = 'verified' | 'warning' | 'critical' | 'info';

export interface OfficialSocialChannel {
  platform: 'instagram' | 'x_twitter' | 'linkedin' | 'facebook' | 'youtube' | 'telegram' | 'play_store';
  handle: string;
  url: string;
  label?: string;
  isVerified: boolean;
}

export interface OfficialWebsiteAsset {
  label: string;
  url: string;
  isPrimary: boolean;
  sslVerified: boolean;
}

export interface BrandSecurityProfile {
  id: string;
  name: string;
  domain: string;
  legalEntity?: string;
  industry?: string;
  logoUrl?: string;
  summary?: string;
  confidenceScore: number;
  verifiedAt: string;
  isCustomBrand?: boolean;
  officialWebsites: OfficialWebsiteAsset[];
  officialSocials: OfficialSocialChannel[];
  supportEmail?: string;
  securityEmail?: string;
  supportPhone?: string;
  threatKeywords?: string[];
  highRiskTyposquats?: string[];
  knownImposters?: {
    platform: string;
    fakeHandle: string;
    fakeUrl?: string;
    reason: string;
    threatLevel: 'high' | 'critical';
    status: 'flagged' | 'takedown_requested' | 'suspended';
  }[];
}

export interface SecurityComment {
  id: string;
  author: string;
  avatar?: string;
  timeAgo: string;
  text: string;
  isVerifiedConsumer?: boolean;
}

export interface SecurityFeedPost {
  id: string;
  brandId: string;
  brandName: string;
  brandDomain: string;
  brandLogo?: string;
  isBrandVerified: boolean;
  timestamp: string;
  category: AlertCategory;
  badgeType: AlertBadgeType;
  badgeText: string;
  title: string;
  content: string;
  
  // Real verified assets registered by the brand
  officialWebsites: OfficialWebsiteAsset[];
  officialSocials: OfficialSocialChannel[];
  
  // Threat watchout & known imposters
  threatWatchout?: {
    tactic: string;
    fakeHandles?: string[];
    fakeDomains?: string[];
    riskScore: number;
    advice: string;
  };

  // Visual Instagram-style post card styling
  visualTheme: 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo';
  visualGraphicHeadline: string;
  visualGraphicSubhead: string;
  visualStats?: { label: string; value: string }[];

  // Social engagement metrics
  helpfulCount: number;
  isHelpful?: boolean;
  commentsCount: number;
  comments: SecurityComment[];
  isSaved?: boolean;
  isFollowingBrand?: boolean;
}

export interface SecurityStory {
  id: string;
  brandId: string;
  brandName: string;
  brandLogo?: string;
  hasUnread: boolean;
  alertType: 'urgent_scam' | 'new_official' | 'security_patch';
  previewBadge: string;
  headline: string;
  bodyText: string;
  officialDomain: string;
  officialHandle: string;
  warningNote?: string;
  timeAgo: string;
}
