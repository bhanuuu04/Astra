import { NextRequest, NextResponse } from 'next/server';
import { analyzeSocialMessage } from '@/lib/threat-engine';
import { DEFAULT_BRAND_REGISTRY } from '@/lib/store';
import { SenderProfile, BrandAssetRegistry } from '@/types/threat';
import { resolveServerIdentity } from '@/lib/server-auth';
import { AnalyzeMessageSchema, enforceMaxLength, redactSensitiveContent } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const identity = await resolveServerIdentity(req);
    if (!identity) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validate input schema
    const parseResult = AnalyzeMessageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { content, sender, brandId } = parseResult.data;

    // Enforce length limits and redact sensitive content
    const sanitizedContent = redactSensitiveContent(enforceMaxLength(content, 10000));
    const sanitizedSender: SenderProfile = {
      ...sender,
      id: String(sender.id ?? 'unknown-sender'),
      platform: sender.platform as SenderProfile['platform'],
      username: enforceMaxLength(String(sender.username), 200),
      displayName: enforceMaxLength(String(sender.displayName ?? sender.username), 200),
      avatarUrl: sender.avatarUrl ? enforceMaxLength(sender.avatarUrl, 2000) : '',
      bio: sender.bio ? redactSensitiveContent(enforceMaxLength(sender.bio, 5000)) : undefined,
      followerCount: sender.followerCount ?? 0,
      followingCount: sender.followingCount ?? 0,
      isVerifiedBadge: sender.isVerifiedBadge ?? false,
      isFakeBadgeEmoji: sender.isFakeBadgeEmoji ?? false
    };

    // The local analyzer currently operates against the configured registry.
    // Brand-specific analysis is accepted by the request contract but requires
    // a backend brand lookup before it can safely replace this tenant registry.
    const activeBrand = DEFAULT_BRAND_REGISTRY;

    const analysis = analyzeSocialMessage(sanitizedContent, sanitizedSender, activeBrand);

    return NextResponse.json({
      success: true,
      analysis,
      analyzedAt: new Date().toISOString(),
      dataMode: 'demo' // Mark as demo until backend brand verification is implemented
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze payload' },
      { status: 500 }
    );
  }
}
