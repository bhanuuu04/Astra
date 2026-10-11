import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { analyzeSocialMessage } from '@/lib/threat-engine';
import { DEFAULT_BRAND_REGISTRY } from '@/lib/store';
import { SenderProfile, SocialMessage, SocialPlatform } from '@/types/threat';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params;
  if (!['instagram', 'facebook', 'telegram', 'twitter', 'x_twitter'].includes(platform)) {
    return NextResponse.json({ error: 'Unsupported webhook platform' }, { status: 404 });
  }
  const searchParams = req.nextUrl.searchParams;

  // 1. Meta / Instagram Webhook Verification Handshake
  if (platform === 'instagram' || platform === 'facebook') {
    const hubMode = searchParams.get('hub.mode');
    const hubChallenge = searchParams.get('hub.challenge');
    const hubVerifyToken = searchParams.get('hub.verify_token');

    const expectedToken = process.env.META_VERIFY_TOKEN;
    if (!expectedToken) {
      return new Response('Server misconfiguration: META_VERIFY_TOKEN is not configured', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (hubMode === 'subscribe' && hubChallenge) {
      if (hubVerifyToken === expectedToken) {
        return new Response(hubChallenge, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      return new Response('Forbidden: Invalid webhook verify token', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }

  // 2. Twitter / X Webhook CRC Handshake
  if (platform === 'twitter' || platform === 'x_twitter') {
    const crcToken = searchParams.get('crc_token');
    if (crcToken) {
      const secret = process.env.X_CONSUMER_SECRET;
      if (!secret) {
        return NextResponse.json(
          { error: 'Server misconfiguration: X_CONSUMER_SECRET is not configured' },
          { status: 500 }
        );
      }
      const hmac = crypto.createHmac('sha256', secret).update(crcToken).digest('base64');
      return NextResponse.json({
        response_token: `sha256=${hmac}`
      });
    }
  }

  return NextResponse.json({
    status: 'active',
    endpoint: `/api/webhooks/${platform}`,
    message: 'Astra Threat Ingestion Webhook Ready'
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await context.params;
    if (!['instagram', 'facebook', 'telegram', 'twitter', 'x_twitter'].includes(platform)) {
      return NextResponse.json({ error: 'Unsupported webhook platform' }, { status: 404 });
    }
    const rawText = await req.text();
    let rawBody: any = {};
    try {
      rawBody = JSON.parse(rawText);
    } catch {
      rawBody = {};
    }

    // 1. Fail-Closed Cryptographic Signature Verification
    if (platform === 'instagram' || platform === 'facebook') {
      const appSecret = process.env.META_APP_SECRET;
      if (!appSecret) {
        return NextResponse.json(
          { error: 'Server misconfiguration: META_APP_SECRET is not configured' },
          { status: 500 }
        );
      }

      const signatureHeader = req.headers.get('x-hub-signature-256');
      if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
        return NextResponse.json(
          { error: 'Missing or malformed X-Hub-Signature-256 header' },
          { status: 401 }
        );
      }

      const providedHash = signatureHeader.slice(7).trim();
      const expectedHash = crypto
        .createHmac('sha256', appSecret)
        .update(rawText)
        .digest('hex');

      if (
        providedHash.length !== expectedHash.length ||
        !crypto.timingSafeEqual(Buffer.from(providedHash, 'hex'), Buffer.from(expectedHash, 'hex'))
      ) {
        return NextResponse.json(
          { error: 'Invalid Meta X-Hub-Signature-256' },
          { status: 401 }
        );
      }
    } else if (platform === 'telegram') {
      const telegramSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
      if (!telegramSecret) {
        return NextResponse.json(
          { error: 'Server misconfiguration: TELEGRAM_WEBHOOK_SECRET is not configured' },
          { status: 500 }
        );
      }

      const headerSecret = req.headers.get('x-telegram-bot-api-secret-token');
      if (!headerSecret || headerSecret !== telegramSecret) {
        return NextResponse.json(
          { error: 'Invalid or missing Telegram webhook secret token' },
          { status: 401 }
        );
      }
    } else if (platform === 'twitter' || platform === 'x_twitter') {
      const xSecret = process.env.X_CONSUMER_SECRET;
      if (!xSecret) {
        return NextResponse.json(
          { error: 'Server misconfiguration: X_CONSUMER_SECRET is not configured' },
          { status: 500 }
        );
      }

      const signatureHeader = req.headers.get('x-twitter-webhooks-signature');
      if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
        return NextResponse.json(
          { error: 'Missing or malformed X-Twitter-Webhooks-Signature header' },
          { status: 401 }
        );
      }

      const providedHash = signatureHeader.slice(7).trim();
      const expectedHash = crypto
        .createHmac('sha256', xSecret)
        .update(rawText)
        .digest('base64');

      const providedBytes = Buffer.from(providedHash, 'base64');
      const expectedBytes = Buffer.from(expectedHash, 'base64');
      if (
        providedBytes.length !== expectedBytes.length ||
        !crypto.timingSafeEqual(providedBytes, expectedBytes)
      ) {
        return NextResponse.json(
          { error: 'Invalid Twitter webhook signature' },
          { status: 401 }
        );
      }
    }

    // 2. Tenant and Brand Context Scoping
    const searchParams = req.nextUrl.searchParams;
    const paramTenantId = searchParams.get('tenant_id') || req.headers.get('x-astra-tenant-id');
    const paramBrandId = searchParams.get('brand_id') || req.headers.get('x-astra-brand-id');

    if (paramTenantId && !UUID_REGEX.test(paramTenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant_id format. Must be a valid UUID.' },
        { status: 400 }
      );
    }
    if (paramBrandId && !UUID_REGEX.test(paramBrandId)) {
      return NextResponse.json(
        { error: 'Invalid brand_id format. Must be a valid UUID.' },
        { status: 400 }
      );
    }

    // 3. Normalize Incoming Payloads across Social Providers
    let extractedSender: SenderProfile;
    let extractedContent = '';
    const messageId = `live-${Date.now()}`;

    if (platform === 'telegram') {
      const msg = rawBody.message || rawBody.channel_post || rawBody;
      const from = msg.from || {};
      extractedSender = {
        id: `tg-${from.id || 'unknown'}`,
        platform: 'telegram',
        username: from.username || `user_${from.id}`,
        displayName: `${from.first_name || ''} ${from.last_name || ''}`.trim() || 'Telegram User',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        followerCount: 0,
        followingCount: 0,
        isVerifiedBadge: false,
        isFakeBadgeEmoji: false
      };
      extractedContent = msg.text || msg.caption || '';
    } else if (platform === 'instagram' || platform === 'facebook') {
      const entry = rawBody.entry?.[0]?.messaging?.[0] || rawBody;
      extractedSender = {
        id: `ig-${entry.sender?.id || 'unknown'}`,
        platform: 'instagram',
        username: entry.sender?.username || `ig_user_${entry.sender?.id || 'ext'}`,
        displayName: entry.sender?.name || 'Instagram User',
        avatarUrl: 'https://images.unsplash.com/photo-1633409381658-a0cdef852895?w=150&auto=format&fit=crop&q=80',
        followerCount: entry.sender?.followers_count || 12,
        followingCount: entry.sender?.following_count || 450,
        isVerifiedBadge: false,
        isFakeBadgeEmoji: false
      };
      extractedContent = entry.message?.text || rawBody.text || '';
    } else {
      extractedSender = {
        id: `${platform}-${rawBody.sender?.id || Date.now()}`,
        platform: platform as SocialPlatform,
        username: rawBody.sender?.username || rawBody.username || 'unidentified_sender',
        displayName: rawBody.sender?.displayName || rawBody.displayName || 'Sender',
        avatarUrl: rawBody.sender?.avatarUrl || 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=150&auto=format&fit=crop&q=80',
        bio: rawBody.sender?.bio || '',
        followerCount: rawBody.sender?.followerCount || 0,
        followingCount: rawBody.sender?.followingCount || 0,
        isVerifiedBadge: Boolean(rawBody.sender?.isVerifiedBadge),
        isFakeBadgeEmoji: Boolean(rawBody.sender?.isFakeBadgeEmoji)
      };
      extractedContent = rawBody.content || rawBody.text || '';
    }

    // 4. Run Astra Real-time AI Threat Analysis Engine
    const targetBrandConfig = {
      ...DEFAULT_BRAND_REGISTRY,
      id: paramBrandId || DEFAULT_BRAND_REGISTRY.id,
      brandName: DEFAULT_BRAND_REGISTRY.brandName
    };

    const threatAnalysis = analyzeSocialMessage(
      extractedContent,
      extractedSender,
      targetBrandConfig
    );

    const socialMessage: SocialMessage = {
      id: messageId,
      platform: platform as SocialPlatform,
      brandAccountId: targetBrandConfig.id,
      sender: extractedSender,
      content: extractedContent,
      timestamp: new Date().toISOString(),
      analysis: threatAnalysis,
      status: threatAnalysis.severity === 'critical' ? 'quarantined' : 'new'
    };

    // 5. Authenticated Forwarding to Backend API Ingestion Pipeline
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8000';
    const internalApiKey = process.env.ASTRA_INTERNAL_API_KEY || process.env.ADMIN_API_KEY;
    if (!internalApiKey) {
      return NextResponse.json(
        { error: 'Server misconfiguration: internal API credential is not configured' },
        { status: 500 }
      );
    }

    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${internalApiKey}`
    };
    if (paramTenantId) {
      forwardHeaders['X-Tenant-ID'] = paramTenantId;
    }

    const batchPayload: any = {
      sightings: [
        {
          surface: platform,
          source_kind: 'direct_message',
          observed_at: new Date().toISOString(),
          raw_ref: `${platform}://${extractedSender.username}/${messageId}`,
          content: extractedContent,
          evidence_text: extractedContent,
          sender: extractedSender,
          normalized_payload: {
            sender: extractedSender,
            threat_severity: threatAnalysis.severity,
            risk_score: threatAnalysis.riskScore,
            indicators: threatAnalysis.indicators,
            extracted_artifacts: threatAnalysis.extractedArtifacts
          }
        }
      ]
    };
    if (paramBrandId) {
      batchPayload.brand_id = paramBrandId;
    }

    let dbIngestionSuccess = false;
    let backendStatusCode = 0;
    let backendErrorDetail = '';

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/sightings:batch`, {
        method: 'POST',
        headers: forwardHeaders,
        body: JSON.stringify(batchPayload)
      });
      backendStatusCode = res.status;
      dbIngestionSuccess = res.ok;
      if (!res.ok) {
        try {
          const errJson = await res.json();
          backendErrorDetail = errJson.detail || JSON.stringify(errJson);
        } catch {
          backendErrorDetail = await res.text();
        }
      }
    } catch (fetchErr: any) {
      dbIngestionSuccess = false;
      backendErrorDetail = fetchErr?.message || 'Ingestion upstream connection failed';
    }

    // 6. Truthful HTTP Response Contract
    if (!dbIngestionSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ingestion pipeline failure: Sighting could not be persisted to system of record',
          persisted_to_db: false,
          threat_analyzed: true,
          platform,
          threatSeverity: threatAnalysis.severity,
          riskScore: threatAnalysis.riskScore,
          diagnostic: {
            backendStatusCode,
            backendErrorDetail
          }
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Webhook event cryptographically verified and persisted to tenant system of record',
        persisted_to_db: true,
        platform,
        tenant_id: paramTenantId || null,
        brand_id: paramBrandId || null,
        threatSeverity: threatAnalysis.severity,
        riskScore: threatAnalysis.riskScore,
        processedMessage: socialMessage
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
