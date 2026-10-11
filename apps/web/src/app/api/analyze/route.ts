import { NextRequest, NextResponse } from 'next/server';
import { analyzeSocialMessage } from '@/lib/threat-engine';
import { DEFAULT_BRAND_REGISTRY } from '@/lib/store';
import { SenderProfile, BrandAssetRegistry } from '@/types/threat';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, sender, brand } = body as {
      content: string;
      sender: SenderProfile;
      brand?: BrandAssetRegistry;
    };

    if (!content || !sender) {
      return NextResponse.json(
        { error: 'Missing required parameters: content and sender' },
        { status: 400 }
      );
    }

    const activeBrand = brand || DEFAULT_BRAND_REGISTRY;
    const analysis = analyzeSocialMessage(content, sender, activeBrand);

    return NextResponse.json({
      success: true,
      analysis,
      analyzedAt: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze payload' },
      { status: 500 }
    );
  }
}
