import { NextResponse } from 'next/server';
import { resolveServerIdentity } from '@/lib/server-auth';
import { AnalyzeMessageSchema, AiVerdictSchema, enforceMaxLength, redactSensitiveContent } from '@/lib/validation';

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const NVIDIA_NIM_BASE_URL = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY;
const NVIDIA_NIM_MODEL = process.env.NVIDIA_NIM_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';
const ENABLE_EXTERNAL_AI = process.env.ENABLE_EXTERNAL_AI === 'true';

export async function POST(request: Request) {
  try {
    // Require authentication
    const identity = await resolveServerIdentity(request);
    if (!identity) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input schema
    const parseResult = AnalyzeMessageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const {
      brandId,
      content,
      sender
    } = parseResult.data;

    const brandName = body.brandName || 'Apex FinCorp';
    const domain = body.domain || 'apexfintech.com';
    const surface = body.surface || 'instagram';

    // Sanitize and enforce limits
    const sanitizedContent = redactSensitiveContent(enforceMaxLength(content, 10000));
    const cleanHandle = enforceMaxLength(sender.username.replace(/^@/, '').trim(), 200);
    const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
    const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Algorithmic Pre-Filter Forensics
    const hasFakeBadge = Boolean(
      sender.isFakeBadgeEmoji ||
      (sender.displayName && /[\u2705\u2714\u2713\u2611\u2705]|[\uD83C\uDF96]|[\uD83D\uDC8E]|verified|\u2713/i.test(sender.displayName) && !sender.isVerifiedBadge)
    );

    const followerCount = typeof sender.followerCount === 'number' ? Math.min(sender.followerCount, 10000000000) : 15;
    const followingCount = typeof sender.followingCount === 'number' ? Math.min(sender.followingCount, 10000000000) : 850;
    const isBurnerRatio = followerCount < 40 && followingCount > 300;

    const lowerContent = sanitizedContent.toLowerCase();
    const isUrgentExtortion = /suspend|verify|urgent|copyright|2fa|wallet|infringement|password|credential|freeze|takedown|notice|immediate/i.test(lowerContent);
    const mentionsBrand = lowerContent.includes(brandSlug) || cleanHandle.toLowerCase().includes(brandSlug);

    // 2. Query NVIDIA NIM only if explicitly enabled
    let aiVerdict: any = null;
    
    if (ENABLE_EXTERNAL_AI && NVIDIA_NIM_API_KEY) {
      try {
        // Redact content before sending to external AI
        const externalContent = redactSensitiveContent(sanitizedContent);
        const externalBio = sender.bio ? redactSensitiveContent(enforceMaxLength(sender.bio, 1000)) : 'None';
        
        const prompt = `You are ASTRA's Autonomous SOC Analyst & Impersonator Detection AI.
Evaluate this inbound social media direct message received on an official brand account.

Target Brand: "${brandName}" (Domain: ${cleanDomain})
Inbound Surface: ${surface}
Sender Handle: @${cleanHandle}
Sender Display Name: "${sender.displayName || cleanHandle}"
Sender Followers: ${followerCount}, Following: ${followingCount}
Is Official Verified Badge: ${Boolean(sender.isVerifiedBadge)}
Has Emoji Spoofed Checkmark: ${hasFakeBadge}
Sender Bio: "${externalBio}"
Message Content:
"""${externalContent}"""

Assess:
1. Is this sender an impersonator or fake account? (true/false)
2. Risk Score (0-100, where 90+ is critical threat)
3. Threat Classification: "impersonation_phishing" | "advance_fee_extortion" | "fake_support_scam" | "account_takeover_lure" | "benign_collaboration"
4. Forensic Indicators: extracted lookalike domains, payment handles, fake APKs, or phishing URLs
5. Detailed reasoning for the security analyst
6. Recommended Response Action: "block_and_takedown" | "quarantine" | "mark_safe"

Respond strictly in valid JSON matching this schema:
{
  "isFakeAccount": true,
  "riskScore": 95,
  "threatType": "string",
  "reasoning": "string",
  "extractedIndicators": ["string"],
  "recommendedAction": "string"
}`;

        const nimRes = await fetch(`${NVIDIA_NIM_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NVIDIA_NIM_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: NVIDIA_NIM_MODEL,
            messages: [
              {
                role: 'system',
                content: 'You are ASTRA Autonomous Threat Analysis AI. Output ONLY raw JSON without markdown codeblocks or explanation.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.1,
            max_tokens: 1024,
          }),
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });

        if (nimRes.ok) {
          const nimData = await nimRes.json();
          const rawContent = nimData.choices?.[0]?.message?.content || '{}';
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const rawVerdict = JSON.parse(jsonMatch[0]);
            // Validate AI output with schema
            const validatedVerdict = AiVerdictSchema.safeParse(rawVerdict);
            if (validatedVerdict.success) {
              aiVerdict = validatedVerdict.data;
            } else {
              console.warn('AI verdict failed validation:', validatedVerdict.error);
            }
          }
        }
      } catch (nimErr) {
        console.warn('NVIDIA NIM DM Analysis notice:', nimErr);
      }
    }

    // Algorithmic Fallback if AI inference is disabled or failed
    if (!aiVerdict) {
      const isFake = (hasFakeBadge && mentionsBrand) || (isBurnerRatio && isUrgentExtortion);
      const computedRisk = isFake ? (isUrgentExtortion ? 94 : 85) : (isUrgentExtortion ? 60 : 12);
      aiVerdict = {
        isFakeAccount: isFake,
        riskScore: computedRisk,
        threatType: isFake ? 'impersonation_phishing' : (computedRisk > 50 ? 'suspicious_inquiry' : 'benign_collaboration'),
        reasoning: isFake
          ? `Detected brand lookalike impersonation. Sender has ${followerCount} followers with spoofed checkmark credentials.`
          : 'Sender evaluated without urgent credential lures.',
        extractedIndicators: [`handle:@${cleanHandle}`],
        recommendedAction: isFake ? 'block_and_takedown' : 'mark_safe'
      };
    }

    // 3. Store Sighting & Indicators in Backend
    const sightingPayload = {
      brand_id: brandId || undefined,
      surface,
      source_kind: 'direct_message',
      observed_at: new Date().toISOString(),
      raw_ref: `${surface}://dm/@${cleanHandle}`,
      content: sanitizedContent,
      sender: {
        username: cleanHandle,
        displayName: sender.displayName || cleanHandle,
        avatarUrl: sender.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        bio: sender.bio ? redactSensitiveContent(enforceMaxLength(sender.bio, 5000)) : '',
        followerCount,
        followingCount,
        isVerifiedBadge: Boolean(sender.isVerifiedBadge),
        isFakeBadgeEmoji: hasFakeBadge
      },
      normalized_payload: {
        surface,
        content: sanitizedContent,
        sender: {
          username: cleanHandle,
          displayName: sender.displayName || cleanHandle,
          isVerifiedBadge: Boolean(sender.isVerifiedBadge),
          isFakeBadgeEmoji: hasFakeBadge,
          followerCount,
          followingCount
        },
        threat_analysis: {
          risk_score: aiVerdict.riskScore,
          threat_type: aiVerdict.threatType,
          summary: aiVerdict.reasoning,
          is_fake_account: aiVerdict.isFakeAccount,
          recommended_action: aiVerdict.recommendedAction,
          indicators: aiVerdict.extractedIndicators
        }
      }
    };

    let savedSightingId = null;
    try {
      const batchHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (identity.accessToken) {
        batchHeaders['Authorization'] = `Bearer ${identity.accessToken}`;
      }

      const batchRes = await fetch(`${API_BASE_URL}/api/v1/sightings:batch`, {
        method: 'POST',
        headers: batchHeaders,
        body: JSON.stringify({
          brand_id: brandId || undefined,
          sightings: [sightingPayload]
        })
      });

      if (batchRes.ok) {
        const batchData = await batchRes.json();
        savedSightingId = batchData.sighting_ids?.[0] || null;
      }
    } catch (dbErr) {
      console.warn('Backend sighting persistence notice:', dbErr);
    }

    return NextResponse.json({
      success: true,
      sightingId: savedSightingId,
      analysis: aiVerdict,
      persistedToBackend: Boolean(savedSightingId),
      externalAiEnabled: ENABLE_EXTERNAL_AI,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error analyzing inbound DM:', error);
    return NextResponse.json(
      { error: 'Internal error analyzing message' },
      { status: 500 }
    );
  }
}
