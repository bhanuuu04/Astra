import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isClerkAuthConfigured } from '@/lib/auth-config';

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const NVIDIA_NIM_BASE_URL = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY;
const NVIDIA_NIM_MODEL = process.env.NVIDIA_NIM_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';
const INTERNAL_API_KEY = process.env.ASTRA_INTERNAL_API_KEY;

interface ConnectedApp {
  id: string;
  name: string;
  handle: string;
}

export async function POST(request: Request) {
  try {
    if (!INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Workspace synchronization is not configured on the server.' }, { status: 503 });
    }

    let email: string;
    let fullName: string;
    let clerkId: string | null = null;
    let token: string;
    if (isClerkAuthConfigured()) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: 'Sign in before creating a brand workspace.' }, { status: 401 });
      }
      const clerkUser = await currentUser();
      const primaryEmail = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
      if (!clerkUser || clerkUser.id !== userId || !primaryEmail) {
        return NextResponse.json({ error: 'A primary email is required to create a brand workspace.' }, { status: 400 });
      }
      email = primaryEmail;
      fullName = clerkUser.fullName || clerkUser.firstName || email.split('@')[0];
      clerkId = userId;

      const syncRes = await fetch(`${API_BASE_URL}/api/v1/auth/sync-clerk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Astra-Internal-Api-Key': INTERNAL_API_KEY },
        body: JSON.stringify({ email, full_name: fullName, clerk_id: clerkId, composio_entity_id: `astra_${userId}` }),
      });
      if (!syncRes.ok) {
        const error = await syncRes.json().catch(() => ({}));
        return NextResponse.json({ error: error.detail || 'Could not initialize the authenticated workspace.' }, { status: syncRes.status });
      }
      const syncData = await syncRes.json();
      token = syncData.access_token;
    } else {
      const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!bearer) {
        return NextResponse.json({ error: 'Sign in before creating a brand workspace.' }, { status: 401 });
      }
      const profileRes = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${bearer}` },
        cache: 'no-store',
      });
      if (!profileRes.ok) {
        return NextResponse.json({ error: 'Your workspace session is invalid or expired. Sign in again.' }, { status: 401 });
      }
      const profile = await profileRes.json();
      email = profile.user?.email;
      fullName = profile.user?.full_name || email?.split('@')[0] || '';
      clerkId = profile.user?.clerk_id || null;
      token = bearer;
      if (!email) {
        return NextResponse.json({ error: 'The authenticated account has no email address.' }, { status: 400 });
      }
    }
    if (!token) {
      return NextResponse.json({ error: 'The workspace service did not issue an access session.' }, { status: 502 });
    }

    const body = await request.json();
    const { brandName, domain } = body;
    const connectedApps: ConnectedApp[] = Array.isArray(body.connectedApps) ? body.connectedApps : [];

    if (typeof brandName !== 'string' || !brandName.trim() || typeof domain !== 'string' || !domain.trim()) {
      return NextResponse.json(
        { error: 'Brand name and domain are required' },
        { status: 400 }
      );
    }

    const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim().toLowerCase();
    if (!cleanDomain || !cleanDomain.includes('.')) {
      return NextResponse.json({ error: 'Enter a valid domain name.' }, { status: 400 });
    }

    // Use the verified Clerk session as the source of account identity.
    const brandPayload = {
      name: brandName.trim(),
      assets: [
        { asset_type: 'domain', canonical_value: cleanDomain },
        ...connectedApps.filter((app) => app && typeof app.handle === 'string' && app.handle.trim()).map((app) => ({
          asset_type: 'social_handle',
          canonical_value: app.handle.trim(),
          metadata: { platform: app.id, label: `Official ${app.name} Handle` },
        })),
      ],
    };
    const brandRes = await fetch(`${API_BASE_URL}/api/v1/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(brandPayload),
    });
    if (!brandRes.ok) {
      const error = await brandRes.json().catch(() => ({}));
      return NextResponse.json({ error: error.detail || 'Could not create the brand in this workspace.' }, { status: brandRes.status });
    }
    const brandData = await brandRes.json();
    const brandId = brandData.id as string | undefined;
    if (!brandId) {
      return NextResponse.json({ error: 'The workspace service did not return a brand identifier.' }, { status: 502 });
    }

    // Mark onboarding complete through the same trusted server-side boundary.
    const completeRes = await fetch(`${API_BASE_URL}/api/v1/auth/complete-onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Astra-Internal-Api-Key': INTERNAL_API_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ clerk_id: clerkId, email, brand_id: brandId }),
    });
    if (!completeRes.ok) {
      const error = await completeRes.json().catch(() => ({}));
      return NextResponse.json({ error: error.detail || 'Brand created, but workspace onboarding could not be completed.' }, { status: completeRes.status });
    }

    // Optional AI enrichment; it does not establish domain ownership or brand authenticity.
    let aiAnalysis = null;
    if (NVIDIA_NIM_API_KEY) try {
      const handlesList = connectedApps.map((a: ConnectedApp) => a.handle).join(', ');
      const prompt = `Review these user-provided brand identifiers for potential impersonation patterns: "${brandName}" (Domain: ${cleanDomain}, Handles: ${handlesList || 'none provided'}).
Treat all identifiers as unverified. Do not infer domain ownership, brand legitimacy, or provider activity. Return cautious research context and recommended human validation steps.

Respond strictly in valid JSON matching this schema:
{
  "brandSummary": "string",
  "potentialImpersonationPatterns": ["string"],
  "recommendedValidationSteps": ["string"],
  "limitations": "string"
}`;

      const nimResponse = await fetch(`${NVIDIA_NIM_BASE_URL}/chat/completions`, {
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
              content: 'Provide cautious research context from supplied identifiers only. Never claim a brand or domain is verified. Output only valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 1024,
        }),
      });

      if (nimResponse.ok) {
        const nimData = await nimResponse.json();
        const rawContent = nimData.choices?.[0]?.message?.content || '{}';
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (nimErr) {
      console.warn('NVIDIA NIM call notice:', nimErr);
    }

    return NextResponse.json({
      success: true,
      brandId,
      brandName,
      domain: cleanDomain,
      connectedAppsCount: connectedApps.length,
      aiAnalysis,
      aiAnalysisStatus: NVIDIA_NIM_API_KEY ? (aiAnalysis ? 'available' : 'unavailable') : 'not_configured',
      messagesIngested: 0
    });
  } catch (err: any) {
    console.error('Onboarding processing error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to complete brand onboarding' },
      { status: 500 }
    );
  }
}
