import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isClerkAuthConfigured } from '@/lib/auth-config';

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const INTERNAL_API_KEY = process.env.ASTRA_INTERNAL_API_KEY;

export async function POST(request: Request) {
  try {
    let email: string | undefined;
    let clerkId: string | null = null;
    let token: string | null = null;

    if (isClerkAuthConfigured()) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: 'Sign in before resetting brand workspace.' }, { status: 401 });
      }
      const clerkUser = await currentUser();
      const primaryEmail = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
      if (!clerkUser || clerkUser.id !== userId || !primaryEmail) {
        return NextResponse.json({ error: 'A primary email is required.' }, { status: 400 });
      }
      email = primaryEmail;
      clerkId = userId;

      // 1. Reset user onboarding and brand in Supabase via internal auth endpoint
      if (INTERNAL_API_KEY) {
        try {
          await fetch(`${API_BASE_URL}/api/v1/auth/reset-onboarding`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Astra-Internal-Api-Key': INTERNAL_API_KEY,
            },
            body: JSON.stringify({ clerk_id: clerkId, email }),
          });
        } catch (e) {
          console.warn('Backend reset-onboarding warning:', e);
        }

        // Also sync token so we can call brands/reset for tenant
        const syncRes = await fetch(`${API_BASE_URL}/api/v1/auth/sync-clerk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Astra-Internal-Api-Key': INTERNAL_API_KEY },
          body: JSON.stringify({
            email,
            full_name: clerkUser.fullName || clerkUser.firstName || email.split('@')[0],
            clerk_id: clerkId,
            composio_entity_id: `astra_${userId}`,
          }),
        });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          token = syncData.access_token;
        }
      }
    } else {
      const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (bearer) {
        token = bearer;
      }
    }

    // Call brand reset endpoint on FastAPI backend
    if (token) {
      const brandResetRes = await fetch(`${API_BASE_URL}/api/v1/brands/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!brandResetRes.ok) {
        const err = await brandResetRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: err.detail || 'Could not reset brand profile.' },
          { status: brandResetRes.status }
        );
      }
      const data = await brandResetRes.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({
      success: true,
      message: 'Brand profile reset successfully.',
    });
  } catch (err: any) {
    console.error('Brand reset API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to reset brand profile.' },
      { status: 500 }
    );
  }
}
