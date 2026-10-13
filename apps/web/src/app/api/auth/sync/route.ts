import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY || 'ak_OCJyi-IhtbMULLyu4vpq';

async function ensureComposioEntity(entityId: string) {
  try {
    // Check if entity already exists
    const checkRes = await fetch(`https://backend.composio.dev/api/v1/client/auth/user/entity/${entityId}`, {
      headers: { 'x-api-key': COMPOSIO_API_KEY },
    });
    if (checkRes.ok) {
      const entity = await checkRes.json();
      return entity;
    }

    // Entity doesn't exist yet — the first connection call will auto-create it.
    // Just return a stub for now.
    return { entityId, status: 'pending_first_connection' };
  } catch {
    return { entityId, status: 'composio_unavailable' };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, fullName, clerkId, composioEntityId } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const entityId = composioEntityId || (clerkId ? `astra_${clerkId}` : null);

    // 1. Ensure Composio entity exists for this user
    let composioInfo = null;
    if (entityId) {
      composioInfo = await ensureComposioEntity(entityId);
    }

    // 2. Sync user to Supabase via FastAPI backend
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/sync-clerk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        full_name: fullName || email.split('@')[0],
        clerk_id: clerkId || null,
        composio_entity_id: entityId || null,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail || 'Failed to sync with Supabase' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ ...data, composioInfo });
  } catch (error: any) {
    console.error('Clerk to Supabase sync error:', error);
    return NextResponse.json({ error: error.message || 'Internal error syncing user' }, { status: 500 });
  }
}
