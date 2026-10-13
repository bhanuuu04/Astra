import { NextResponse } from 'next/server';
import { resolveServerIdentity } from '@/lib/server-auth';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;

export async function GET(request: Request) {
  if (!COMPOSIO_API_KEY) {
    return NextResponse.json({ error: 'Social provider connections are not configured on this server.' }, { status: 503 });
  }

  try {
    const identity = await resolveServerIdentity(request);
    if (!identity) {
      return NextResponse.json({ error: 'Sign in before checking a provider connection.' }, { status: 401 });
    }

    const connectedAccountId = new URL(request.url).searchParams.get('connectedAccountId');
    if (!connectedAccountId) {
      return NextResponse.json({ error: 'connectedAccountId parameter is required' }, { status: 400 });
    }

    const response = await fetch(`https://backend.composio.dev/api/v3.1/connected_accounts/${encodeURIComponent(connectedAccountId)}`, {
      headers: { 'x-api-key': COMPOSIO_API_KEY, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) {
      return NextResponse.json({ error: 'The provider connection could not be found.' }, { status: response.status === 404 ? 404 : 502 });
    }

    const data = await response.json();
    if (data.user_id !== identity.providerUserId) {
      return NextResponse.json({ error: 'The provider connection is unavailable to this account.' }, { status: 404 });
    }

    return NextResponse.json({ active: data.status === 'ACTIVE', status: data.status, id: data.id, toolkit: data.toolkit?.slug });
  } catch (error) {
    console.error('Could not verify provider connection status:', error);
    return NextResponse.json({ error: 'Could not verify provider connection status.' }, { status: 502 });
  }
}
