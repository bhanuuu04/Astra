import { 
  BrandAssetRegistry, 
  SenderProfile, 
  ThreatAnalysis, 
  ThreatCategory, 
  ThreatIndicator, 
  ExtractedArtifact, 
  ThreatSeverity 
} from '@/types/threat';

// Homoglyph map for lookalike character replacement
const HOMOGLYPHS: Record<string, string> = {
  'а': 'a', 'а́': 'a', 'ä': 'a', '@': 'a', '4': 'a',
  'Ь': 'b', 'в': 'b', '8': 'b',
  'с': 'c', 'ç': 'c', '(': 'c',
  'ԁ': 'd', 'cl': 'd',
  'е': 'e', 'ё': 'e', 'é': 'e', '3': 'e',
  'ɡ': 'g', '9': 'g',
  'һ': 'h',
  'і': 'i', 'í': 'i', '1': 'i', '!': 'i',
  'ј': 'j',
  'k': 'k', 'к': 'k',
  'ӏ': 'l', '|': 'l',
  'м': 'm', 'rn': 'm',
  'п': 'n',
  'о': 'o', 'ö': 'o', '0': 'o', 'ø': 'o',
  'р': 'p',
  'ԛ': 'q',
  'г': 'r',
  'ѕ': 's', '5': 's', '$': 's',
  'т': 't', '7': 't', '+': 't',
  'υ': 'u', 'ü': 'u', 'v': 'u',
  'ν': 'v',
  'w': 'w', 'vv': 'w',
  'х': 'x', '×': 'x',
  'у': 'y', 'ý': 'y',
  'z': 'z', '2': 'z'
};

/**
 * Normalize string by converting homoglyphs and special characters to base latin
 */
export function normalizeHomoglyphs(str: string | undefined | null): string {
  if (!str || typeof str !== 'string') return '';
  let result = str.toLowerCase();
  for (const [char, replacement] of Object.entries(HOMOGLYPHS)) {
    result = result.split(char).join(replacement);
  }
  return result.replace(/[^a-z0-9]/g, '');
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Calculate string similarity percentage (0 to 100)
 */
export function calculateSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 100;
  const distance = levenshteinDistance(longer, shorter);
  return Math.round(((longer.length - distance) / longer.length) * 100);
}

// Suspicious URL Shorteners & High-Risk TLDs
const URL_SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'is.gd', 'rb.gy', 't.me/'];
const HIGH_RISK_TLDS = ['.xyz', '.top', '.click', '.ru', '.cfd', '.buzz', '.cam', '.live', '.space', '.tk', '.ml', '.ga', '.work'];

// Phishing & Social Engineering Keywords
const URGENCY_TRIGGERS = [
  'account suspended', 'account scheduled for deletion', 'within 24 hours', 'immediate action required',
  'copyright violation', 'trademark infringement notice', 'verify your identity', 'identity confirmation',
  'security alert', 'unauthorized login detected', 'wallet verification', 'kyc verification required',
  'claim reward', 'winner chosen', 'giveaway exclusive', 'airdrop distribution'
];

const CREDENTIAL_HARVEST_TRIGGERS = [
  'enter your password', 'verify seed phrase', 'recovery phrase', 'provide 2fa code', 'otp sent',
  'fill this form to verify', 'reset credentials', 'connect wallet'
];

// Fake Mobile App / APK indicators
const ROGUE_APP_TRIGGERS = [
  '.apk', '.ipa', 'download our mobile app', 'download the official app here', 'install app from link',
  'new mobile version released', 'updated apk file', 'app package', 'install-app', 'download-apk',
  'mobile-release', 'support-app'
];

const FAKE_BADGE_SYMBOLS = ['✓', '✔', '☑️', '✅', ' verified'];

/**
 * Main Threat Intelligence Analysis Engine
 */
export function analyzeSocialMessage(
  content: string,
  sender: SenderProfile,
  brand: BrandAssetRegistry
): ThreatAnalysis {
  const indicators: ThreatIndicator[] = [];
  const extractedArtifacts: ExtractedArtifact[] = [];
  const categories: ThreatCategory[] = [];
  
  let impersonationScore = 0;
  let fakeAccountProbability = 0;
  let maliciousPayloadDetected = false;
  let fakeMobileAppDetected = false;

  const safeContent = content || '';
  const contentLower = safeContent.toLowerCase();
  const safeUsername = sender?.username || 'unknown_user';
  const safeDisplayName = sender?.displayName || safeUsername;

  const normalizedBrandName = normalizeHomoglyphs(brand?.brandName || 'brand');
  const normalizedSenderUsername = normalizeHomoglyphs(safeUsername);
  const normalizedSenderDisplay = normalizeHomoglyphs(safeDisplayName);

  // -------------------------------------------------------------
  // 1. SENDER PROFILE & IMPERSONATION ANALYSIS
  // -------------------------------------------------------------
  const officialHandles = (brand?.officialHandles || [])
    .filter(h => h.platform === sender?.platform)
    .map(h => (h.handle || '').toLowerCase().replace('@', ''));

  const isOfficialAccount = officialHandles.includes(safeUsername.toLowerCase().replace('@', ''));

  if (!isOfficialAccount) {
    // Check for Brand Name in Sender Handle or Display Name
    const containsBrandInUsername = normalizedSenderUsername.includes(normalizedBrandName);
    const containsBrandInDisplay = normalizedSenderDisplay.includes(normalizedBrandName);

    // Lookalike keywords often combined with brand impersonation
    const brandSpoofKeywords = ['support', 'help', 'desk', 'service', 'official', 'team', 'care', 'security', 'verify', 'admin', 'bot'];
    const matchedSpoofWords = brandSpoofKeywords.filter(k => 
      safeUsername.toLowerCase().includes(k) || safeDisplayName.toLowerCase().includes(k)
    );

    if (containsBrandInUsername || containsBrandInDisplay) {
      impersonationScore += 55;
      categories.push('brand_impersonation');

      indicators.push({
        type: 'impersonation',
        severity: 'critical',
        title: 'Brand Name Ingestion Detected in Untrusted Account',
        description: `Sender account incorporates brand name "${brand.brandName}" in their username/display name while not being on the authorized handle list.`,
        evidence: `Username: @${sender.username} | Display Name: "${sender.displayName}"`
      });

      if (matchedSpoofWords.length > 0) {
        impersonationScore += 30;
        indicators.push({
          type: 'impersonation',
          severity: 'critical',
          title: 'Spoofed Department Keywords Detected',
          description: `Account mimics official brand departments (${matchedSpoofWords.join(', ')}).`,
          evidence: `Matched Keywords: [${matchedSpoofWords.join(', ')}]`
        });
      }
    } else {
      // Fuzzy Similarity Check (Typosquatting / Homoglyph Attack)
      const usernameSimilarity = calculateSimilarity(normalizedSenderUsername, normalizedBrandName);
      if (usernameSimilarity >= 70 && usernameSimilarity < 100) {
        impersonationScore += 45;
        categories.push('brand_impersonation');
        indicators.push({
          type: 'impersonation',
          severity: 'high',
          title: 'High Typosquatting Similarity to Brand',
          description: `Sender handle @${sender.username} has a ${usernameSimilarity}% phonetic/levenshtein match to official brand "${brand.brandName}".`,
          evidence: `Similarity: ${usernameSimilarity}%`
        });
      }
    }

    // Check for Executive Impersonation
    for (const exec of brand.protectedExecutives) {
      const execNameNorm = normalizeHomoglyphs(exec.name);
      if (normalizedSenderDisplay.includes(execNameNorm) || normalizedSenderUsername.includes(execNameNorm)) {
        impersonationScore += 60;
        categories.push('brand_impersonation');
        indicators.push({
          type: 'impersonation',
          severity: 'critical',
          title: `Executive / VIP Impersonation Detected (${exec.name})`,
          description: `Sender is imitating protected brand leadership (${exec.name} - ${exec.role}).`,
          evidence: `Executive Name: ${exec.name} | Sender: ${sender.displayName}`
        });
      }
    }

    // Fake Verification Badge Emoji in Display Name
    const hasFakeBadge = FAKE_BADGE_SYMBOLS.some((s: string) => sender.displayName.includes(s));
    if (hasFakeBadge && !sender.isVerifiedBadge) {
      impersonationScore += 25;
      fakeAccountProbability += 30;
      categories.push('fake_profile');
      indicators.push({
        type: 'fake_account',
        severity: 'high',
        title: 'Deceptive Verification Badge Emoji',
        description: 'Sender is utilizing unicode checkmarks/badges in display name to deceive recipients into perceiving official verification.',
        evidence: `Display Name: "${sender.displayName}"`
      });
    }

    // Account Age & Bot Velocity Heuristics
    if (sender.accountCreatedAt) {
      const createdDate = new Date(sender.accountCreatedAt).getTime();
      const daysOld = (Date.now() - createdDate) / (1000 * 3600 * 24);
      if (daysOld < 15) {
        fakeAccountProbability += 35;
        indicators.push({
          type: 'fake_account',
          severity: 'medium',
          title: 'Freshly Created Account (<15 Days Old)',
          description: `Account was registered only ${Math.round(daysOld)} days ago, consistent with burner attack infrastructure.`,
          evidence: `Created: ${new Date(sender.accountCreatedAt).toLocaleDateString()}`
        });
      }
    }

    // Follower / Following Anomaly (Spam/Burner profile)
    if (sender.followingCount > 300 && sender.followerCount < 20) {
      fakeAccountProbability += 35;
      categories.push('fake_profile');
      indicators.push({
        type: 'anomaly',
        severity: 'medium',
        title: 'Asymmetric Follower/Following Ratio (Burner Bot Pattern)',
        description: `Account follows ${sender.followingCount} profiles while possessing only ${sender.followerCount} followers.`,
        evidence: `Ratio: ${sender.followingCount} following / ${sender.followerCount} followers`
      });
    }
  }

  // -------------------------------------------------------------
  // 2. PAYLOAD & CONTENT FORENSICS
  // -------------------------------------------------------------
  // URL Extraction Regex
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const extractedUrls = content.match(urlRegex) || [];

  for (const rawUrl of extractedUrls) {
    let cleanUrl = rawUrl.replace(/[.,!?;:)]$/, '');
    let urlObj: URL | null = null;
    try {
      urlObj = new URL(cleanUrl);
    } catch {
      // not a valid url
    }

    const isSuspiciousTLD = HIGH_RISK_TLDS.some(tld => cleanUrl.toLowerCase().includes(tld));
    const isShortener = URL_SHORTENERS.some(short => cleanUrl.toLowerCase().includes(short));
    
    // Check if domain mimics brand official domains
    let isDomainSpoof = false;
    if (urlObj) {
      const hostname = urlObj.hostname.toLowerCase();
      const isOfficialDomain = brand.officialDomains.some(d => hostname === d || hostname.endsWith(`.${d}`));
      
      if (!isOfficialDomain && (hostname.includes(normalizedBrandName) || hostname.includes('astra'))) {
        isDomainSpoof = true;
      }
    }

    const isMaliciousUrl = isSuspiciousTLD || isShortener || isDomainSpoof;
    if (isMaliciousUrl) {
      maliciousPayloadDetected = true;
      categories.push('phishing_link');
    }

    extractedArtifacts.push({
      type: 'url',
      value: cleanUrl,
      isMalicious: isMaliciousUrl,
      notes: isDomainSpoof 
        ? 'Lookalike domain spoofing official brand name'
        : isShortener 
          ? 'URL shortener masking true destination'
          : isSuspiciousTLD 
            ? 'High-risk malicious TLD'
            : 'Extracted URL'
    });

    if (isDomainSpoof) {
      indicators.push({
        type: 'phishing',
        severity: 'critical',
        title: 'Lookalike Brand Phishing Domain in Message',
        description: `The URL links to an unauthorized domain "${urlObj?.hostname}" that mimics the brand domain.`,
        evidence: cleanUrl
      });
    } else if (isShortener) {
      indicators.push({
        type: 'phishing',
        severity: 'high',
        title: 'Masked URL Shortener Link',
        description: 'Sender is obfuscating the destination endpoint using an unverified redirector.',
        evidence: cleanUrl
      });
    }
  }

  // -------------------------------------------------------------
  // 3. FAKE MOBILE APP / ROGUE APK DETECTION
  // -------------------------------------------------------------
  const containsApkExtension = contentLower.includes('.apk') || contentLower.includes('.ipa');
  const matchedRogueAppKeywords = ROGUE_APP_TRIGGERS.filter(k => contentLower.includes(k));

  if (containsApkExtension || matchedRogueAppKeywords.length >= 2) {
    fakeMobileAppDetected = true;
    categories.push('fake_mobile_app');
    
    // Extract potential APK package or filename
    const apkMatch = content.match(/[\w\-.]+\.apk/i);
    const apkName = apkMatch ? apkMatch[0] : 'unnamed-app.apk';

    extractedArtifacts.push({
      type: 'apk',
      value: apkName,
      isMalicious: true,
      notes: 'Rogue Android APK download distributed via Direct Message'
    });

    indicators.push({
      type: 'rogue_app',
      severity: 'critical',
      title: 'Counterfeit Mobile App / Rogue APK Distribution',
      description: `Message is actively distributing an unverified mobile application (${apkName}) falsely presented as brand software.`,
      evidence: `Payload reference: ${apkName} | Context: "${content.substring(0, 100)}..."`
    });
  }

  // -------------------------------------------------------------
  // 4. SOCIAL ENGINEERING & SCAM ANALYSIS
  // -------------------------------------------------------------
  const matchedUrgency = URGENCY_TRIGGERS.filter(t => contentLower.includes(t));
  if (matchedUrgency.length > 0) {
    categories.push('social_engineering');
    indicators.push({
      type: 'social_engineering',
      severity: matchedUrgency.length > 1 ? 'critical' : 'high',
      title: 'High-Urgency Psychological Coercion',
      description: 'Message leverages classic fear/urgency extortion tactics common in social media account takeover schemes.',
      evidence: `Triggers detected: [${matchedUrgency.join(', ')}]`
    });
  }

  const matchedHarvesting = CREDENTIAL_HARVEST_TRIGGERS.filter(t => contentLower.includes(t));
  if (matchedHarvesting.length > 0) {
    categories.push('credential_harvesting');
    categories.push('scam_account');
    indicators.push({
      type: 'phishing',
      severity: 'critical',
      title: 'Credential Harvesting & 2FA Extraction Attempt',
      description: 'Sender prompts target to disclose sensitive credentials, recovery keys, or authentication tokens.',
      evidence: `Triggers detected: [${matchedHarvesting.join(', ')}]`
    });
  }

  // Crypto wallet pattern extraction
  const ethWalletRegex = /0x[a-fA-F0-9]{40}/g;
  const btcWalletRegex = /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g;
  const ethMatches = content.match(ethWalletRegex) || [];
  const btcMatches = content.match(btcWalletRegex) || [];

  for (const wallet of [...ethMatches, ...btcMatches]) {
    categories.push('scam_account');
    extractedArtifacts.push({
      type: 'crypto_wallet',
      value: wallet,
      isMalicious: true,
      notes: 'Cryptocurrency address in unsolicited DM (Potential financial scam)'
    });

    indicators.push({
      type: 'anomaly',
      severity: 'high',
      title: 'Cryptocurrency Wallet Address Injected',
      description: 'Message solicits or injects direct crypto wallet addresses.',
      evidence: wallet
    });
  }

  // -------------------------------------------------------------
  // 5. COMPUTE COMPOSITE RISK SCORE & SEVERITY
  // -------------------------------------------------------------
  impersonationScore = Math.min(100, impersonationScore);
  fakeAccountProbability = Math.min(100, fakeAccountProbability);

  let calculatedScore = 0;
  if (impersonationScore > 0) calculatedScore += impersonationScore * 0.45;
  if (fakeAccountProbability > 0) calculatedScore += fakeAccountProbability * 0.25;
  if (maliciousPayloadDetected) calculatedScore += 30;
  if (fakeMobileAppDetected) calculatedScore += 35;
  if (matchedUrgency.length > 0) calculatedScore += 20;
  if (matchedHarvesting.length > 0) calculatedScore += 35;

  // Cap at 100
  let finalRiskScore = Math.min(100, Math.round(calculatedScore));

  // Determine Severity Level
  let severity: ThreatSeverity = 'clean';
  if (finalRiskScore >= 80 || fakeMobileAppDetected || (impersonationScore >= 70 && maliciousPayloadDetected)) {
    severity = 'critical';
  } else if (finalRiskScore >= 60) {
    severity = 'high';
  } else if (finalRiskScore >= 35) {
    severity = 'medium';
  } else if (finalRiskScore >= 15) {
    severity = 'low';
  } else {
    severity = 'clean';
  }

  if (categories.length === 0) {
    categories.push('legitimate');
  }

  // Recommended Actions
  const recommendedActions: string[] = [];
  if (severity === 'critical' || severity === 'high') {
    if (impersonationScore > 50) {
      recommendedActions.push(`Submit immediate Brand Impersonation Takedown on ${sender.platform.toUpperCase()}`);
    }
    if (fakeMobileAppDetected) {
      recommendedActions.push('Report rogue APK hosting URL to Google Play Protect & abuse registrar');
      recommendedActions.push('Alert customer community regarding counterfeit mobile application');
    }
    if (maliciousPayloadDetected) {
      recommendedActions.push('Submit phishing URL to Google Safe Browsing and Netcraft');
    }
    recommendedActions.push(`Quarantine conversation and block @${sender.username} across all social endpoints`);
  } else if (severity === 'medium') {
    recommendedActions.push('Monitor sender handle for recurring unsolicited solicitations');
    recommendedActions.push('Mark conversation as suspicious');
  } else {
    recommendedActions.push('Message appears legitimate customer communication');
  }

  // High-level summary
  let summary = '';
  if (severity === 'critical') {
    summary = `CRITICAL THREAT: ${impersonationScore > 60 ? 'Active brand impersonator' : 'Malicious campaign'} targeting brand via ${sender.platform.toUpperCase()}.`;
    if (fakeMobileAppDetected) summary += ' Rogue mobile app distribution detected.';
  } else if (severity === 'high') {
    summary = `HIGH RISK: Suspicious profile mimicking brand attributes with social engineering indicators.`;
  } else if (severity === 'medium') {
    summary = `MEDIUM RISK: Low-trust account exhibiting anomalous patterns or unsolicited links.`;
  } else {
    summary = `LOW/CLEAN: Inbound customer message with no malicious or impersonation markers detected.`;
  }

  // -------------------------------------------------------------
  // 6. PROFILE SAFETY & COLLABORATION INTENT CLASSIFICATION
  // -------------------------------------------------------------
  const collabKeywords = [
    'collaboration', 'collab', 'partnership', 'sponsor', 'sponsorship',
    'promote', 'brand ambassador', 'media kit', 'paid promo', 'influencer',
    'affiliate', 'deal', 'work together'
  ];
  const matchedCollab = collabKeywords.filter(k => contentLower.includes(k));
  
  let intent: 'collaboration_proposal' | 'sponsorship_inquiry' | 'customer_support' | 'impersonation_scam' | 'phishing_lure' | 'general_inquiry' = 'general_inquiry';
  let intentConfidence = 50;

  if (impersonationScore >= 50) {
    intent = 'impersonation_scam';
    intentConfidence = 90;
  } else if (maliciousPayloadDetected || matchedHarvesting.length > 0) {
    intent = 'phishing_lure';
    intentConfidence = 88;
  } else if (matchedCollab.length > 0) {
    intent = matchedCollab.includes('sponsor') || matchedCollab.includes('sponsorship') ? 'sponsorship_inquiry' : 'collaboration_proposal';
    intentConfidence = Math.min(95, 60 + matchedCollab.length * 15);
  } else if (contentLower.includes('help') || contentLower.includes('issue') || contentLower.includes('account')) {
    intent = 'customer_support';
    intentConfidence = 70;
  }

  // Safety Score: inverted risk score with profile integrity factors
  const safetyDeductions = (finalRiskScore * 0.75) + (fakeAccountProbability * 0.25);
  const safetyScore = Math.max(0, Math.min(100, Math.round(100 - safetyDeductions)));
  const isSafe = safetyScore >= 65 && severity === 'clean' || (severity === 'low' && safetyScore >= 70);

  const safetyReasons: string[] = [];
  if (safetyScore >= 80) {
    safetyReasons.push('Authentic profile with normal follower distribution');
    safetyReasons.push('Zero lookalike or spoofing keywords detected');
    safetyReasons.push('No malicious payloads or unverified links found');
  } else {
    if (impersonationScore > 30) safetyReasons.push(`Impersonation risk detected against brand assets (${impersonationScore}%)`);
    if (fakeAccountProbability > 30) safetyReasons.push('Anomalous follower/following ratio typical of burner accounts');
    if (maliciousPayloadDetected) safetyReasons.push('Contains suspicious external redirects or spoofed domains');
    const hasDeceptiveBadge = FAKE_BADGE_SYMBOLS.some((s: string) => sender.displayName.includes(s));
    if (hasDeceptiveBadge && !sender.isVerifiedBadge) {
      safetyReasons.push('Deceptive fake verification checkmark emoji in display name');
    }
    if (matchedUrgency.length > 0) safetyReasons.push('Uses coercive urgency triggers');
  }

  const profileSafety = {
    safetyScore,
    isSafe,
    intent,
    intentConfidence,
    burnerAccountProbability: fakeAccountProbability,
    executiveImpersonationDetected: impersonationScore > 50,
    brandImpersonationDetected: impersonationScore > 40,
    reasons: safetyReasons
  };

  return {
    riskScore: finalRiskScore,
    severity,
    categories: Array.from(new Set(categories)),
    summary,
    impersonationScore,
    fakeAccountProbability,
    maliciousPayloadDetected,
    fakeMobileAppDetected,
    indicators,
    extractedArtifacts,
    recommendedActions,
    profileSafety
  };
}
