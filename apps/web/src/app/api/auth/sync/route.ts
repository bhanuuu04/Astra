import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isClerkAuthConfigured } from '@/lib/auth-config';

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const INTERNAL_API_KEY = process.env.ASTRA_INTERNAL_API_KEY;

async function ensureComposioEntity(entityId: string) {
  if (!COMPOSIO_API_KEY) {
    return { entityId, status: 'not_configured' };
  }

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

export async function POST() {
  try {
    if (!isClerkAuthConfigured()) {
      return NextResponse.json({ error: 'Clerk sign-in is not configured on this server.' }, { status: 503 });
    }
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Sign in before synchronizing your workspace.' }, { status: 401 });
    }
    if (!INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Workspace synchronization is not configured on the server.' }, { status: 503 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!clerkUser || clerkUser.id !== userId || !email) {
      return NextResponse.json({ error: 'A primary email is required for workspace synchronization.' }, { status: 400 });
    }

    const entityId = `astra_${userId}`;

    // 1. Ensure Composio entity exists for this user
    let composioInfo = null;
    if (entityId) {
      composioInfo = await ensureComposioEntity(entityId);
    }

    // 2. Sync user to Supabase via FastAPI backend
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/sync-clerk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Astra-Internal-Api-Key': INTERNAL_API_KEY },
      body: JSON.stringify({
        email,
        full_name: clerkUser.fullName || clerkUser.firstName || email.split('@')[0],
        clerk_id: userId,
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
