import { NextResponse } from 'next/server';
import { resolveServerIdentity } from '@/lib/server-auth';
import { InboundSaveSchema, enforceMaxLength, redactSensitiveContent } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    // Require authentication
    const identity = await resolveServerIdentity(request);
    if (!identity) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const body = await request.json();

    // Validate input schema
    const parseResult = InboundSaveSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { platform, content, sender, brandId } = parseResult.data;

    // Sanitize content
    const sanitizedContent = redactSensitiveContent(enforceMaxLength(content, 10000));

    // Persist real inbound message sighting directly to backend database
    const batchPayload = {
      brand_id: brandId || undefined,
      sightings: [
        {
          surface: platform,
          source_kind: 'direct_message',
          content: sanitizedContent,
          sender: {
            ...sender,
            username: enforceMaxLength(sender.username, 200),
            displayName: sender.displayName ? enforceMaxLength(sender.displayName, 200) : undefined,
            bio: sender.bio ? redactSensitiveContent(enforceMaxLength(sender.bio, 5000)) : undefined
          },
          normalized_payload: {
            content: sanitizedContent,
            sender,
            platform
          },
          evidence_text: `${platform.toUpperCase()} DM from @${sender?.username || 'unknown'}: ${sanitizedContent.slice(0, 500)}`
        }
      ]
    };

    // Use identity token instead of caller-supplied token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (identity.accessToken) {
      headers['Authorization'] = `Bearer ${identity.accessToken}`;
    }

    const res = await fetch(`${apiBaseUrl}/api/v1/sightings:batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify(batchPayload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Backend sighting save failed:', errText);
      return NextResponse.json({ success: false, error: 'Failed to save sighting' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Inbound save error:', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
