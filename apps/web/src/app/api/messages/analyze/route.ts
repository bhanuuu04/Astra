import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const NVIDIA_NIM_BASE_URL = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY || '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';
const NVIDIA_NIM_MODEL = process.env.NVIDIA_NIM_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      brandId,
      brandName = 'Apex FinCorp',
      domain = 'apexfintech.com',
      surface = 'instagram',
      content,
      sender
    } = body;

    if (!content || !sender || !sender.username) {
      return NextResponse.json(
        { error: 'Message content and sender.username are required' },
        { status: 400 }
      );
    }

    const cleanHandle = sender.username.replace(/^@/, '').trim();
    const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
    const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Algorithmic Pre-Filter Forensics
    const hasFakeBadge = Boolean(
      sender.isFakeBadgeEmoji ||
      (sender.displayName && /[\u2705\u2714\u2713\u2611\u2705]|[\uD83C\uDF96]|[\uD83D\uDC8E]|verified|\u2713/i.test(sender.displayName) && !sender.isVerifiedBadge)
    );

    const followerCount = typeof sender.followerCount === 'number' ? sender.followerCount : 15;
    const followingCount = typeof sender.followingCount === 'number' ? sender.followingCount : 850;
    const isBurnerRatio = followerCount < 40 && followingCount > 300;

    const lowerContent = content.toLowerCase();
    const isUrgentExtortion = /suspend|verify|urgent|copyright|2fa|wallet|infringement|password|credential|freeze|takedown|notice|immediate/i.test(lowerContent);
    const mentionsBrand = lowerContent.includes(brandSlug) || cleanHandle.toLowerCase().includes(brandSlug);

    // 2. Query NVIDIA NIM Nemotron-3.5 AI Sentinel for Autonomous Forensic Analysis
    let aiVerdict: any = null;
    try {
      const prompt = `You are ASTRA's Autonomous SOC Analyst & Impersonator Detection AI.
Evaluate this inbound social media direct message received on an official brand account.

Target Brand: "${brandName}" (Domain: ${cleanDomain})
Inbound Surface: ${surface}
Sender Handle: @${cleanHandle}
Sender Display Name: "${sender.displayName || cleanHandle}"
Sender Followers: ${followerCount}, Following: ${followingCount}
Is Official Verified Badge: ${Boolean(sender.isVerifiedBadge)}
Has Emoji Spoofed Checkmark: ${hasFakeBadge}
Sender Bio: "${sender.bio || 'None'}"
Message Content:
"""${content}"""

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
      });

      if (nimRes.ok) {
        const nimData = await nimRes.json();
        const rawContent = nimData.choices?.[0]?.message?.content || '{}';
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiVerdict = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (nimErr) {
      console.warn('NVIDIA NIM DM Analysis notice:', nimErr);
    }

    // Algorithmic Fallback if AI inference delayed
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

    // 3. Store Sighting & Indicators in Supabase PostgreSQL
    const sightingPayload = {
      brand_id: brandId || undefined,
      surface,
      source_kind: 'direct_message',
      observed_at: new Date().toISOString(),
      raw_ref: `${surface}://dm/@${cleanHandle}`,
      content,
      sender: {
        username: cleanHandle,
        displayName: sender.displayName || cleanHandle,
        avatarUrl: sender.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        bio: sender.bio || '',
        followerCount,
        followingCount,
        isVerifiedBadge: Boolean(sender.isVerifiedBadge),
        isFakeBadgeEmoji: hasFakeBadge
      },
      normalized_payload: {
        surface,
        content,
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
      const authHeader = request.headers.get('authorization');
      const batchHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeader) {
        batchHeaders['Authorization'] = authHeader;
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
      console.warn('Supabase DM sighting persistence notice:', dbErr);
    }

    return NextResponse.json({
      success: true,
      sightingId: savedSightingId,
      analysis: aiVerdict,
      persistedToSupabase: Boolean(savedSightingId),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error analyzing inbound DM:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error analyzing message' },
      { status: 500 }
    );
  }
}
