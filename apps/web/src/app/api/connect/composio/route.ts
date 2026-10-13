import { NextResponse } from 'next/server';
import { resolveServerIdentity } from '@/lib/server-auth';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;

const AUTH_CONFIG_MAP: Record<string, string> = {
  instagram: 'ac_2WThybOPrHqj',
  facebook: 'ac_vY1Tivqx66YQ',
  linkedin: 'ac_j1HDu0ZJq4KD',
  youtube: 'ac_UEMXW_n4G6Af',
  twitter: 'ac_j1HDu0ZJq4KD',
  x: 'ac_j1HDu0ZJq4KD',
  google: 'ac_UEMXW_n4G6Af',
};

export async function POST(request: Request) {
  if (!COMPOSIO_API_KEY) {
    return NextResponse.json({ error: 'Social provider connections are not configured on this server.' }, { status: 503 });
  }

  try {
    const identity = await resolveServerIdentity(request);
    if (!identity) {
      return NextResponse.json({ error: 'Sign in before connecting a provider.' }, { status: 401 });
    }

    const body = await request.json();
    const normalizedPlatform = typeof body.platform === 'string'
      ? body.platform.toLowerCase().replace('x_twitter', 'twitter')
      : '';
    const authConfigId = AUTH_CONFIG_MAP[normalizedPlatform];
    if (!authConfigId) {
      return NextResponse.json({ error: `Provider connection is not supported for ${normalizedPlatform || 'this platform'}.` }, { status: 501 });
    }

    const requestOrigin = new URL(request.url).origin;
    const redirectUrl = new URL('/connect/callback', requestOrigin);
    redirectUrl.searchParams.set('platform', normalizedPlatform);

    const response = await fetch('https://backend.composio.dev/api/v3.1/connected_accounts/link', {
      method: 'POST',
      headers: { 'x-api-key': COMPOSIO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: identity.providerUserId,
        auth_config_id: authConfigId,
        redirect_url: redirectUrl.toString(),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.redirect_url) {
      return NextResponse.json({ error: 'The provider could not create an authorization link.' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      platform: normalizedPlatform,
      redirect_url: data.redirect_url,
      connected_account_id: data.connected_account_id,
      expires_at: data.expires_at,
    });
  } catch (error) {
    console.error('Could not create provider authorization link:', error);
    return NextResponse.json({ error: 'Could not create the provider authorization link.' }, { status: 502 });
  }
}
