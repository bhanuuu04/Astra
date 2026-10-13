import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, clerkId } = body;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const internalApiKey = process.env.ASTRA_INTERNAL_API_KEY || process.env.ADMIN_API_KEY;
    if (internalApiKey) {
      headers['x-astra-internal-key'] = internalApiKey;
    }

    // Call backend API to reset user onboarding status in database
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/reset-onboarding`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: email || null,
        clerk_id: clerkId || null,
      }),
    });

    const data = await res.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: 'Setup guide reset successfully. Ready to restart onboarding.',
      data,
    });
  } catch (error: any) {
    console.error('Reset guide error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset setup guide' },
      { status: 500 }
    );
  }
}
