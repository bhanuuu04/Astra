import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const body = await request.json();

    const { platform, content, sender, brandId } = body;

    // Persist real inbound message sighting directly to backend database
    const batchPayload = {
      brand_id: brandId || undefined,
      sightings: [
        {
          surface: platform || 'instagram',
          source_kind: 'direct_message',
          content: content,
          sender: sender,
          normalized_payload: {
            content: content,
            sender: sender,
            platform: platform
          },
          evidence_text: `${platform.toUpperCase()} DM from @${sender?.username || 'unknown'}: ${content}`
        }
      ]
    };

    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const res = await fetch(`${apiBaseUrl}/api/v1/sightings:batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify(batchPayload)
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ success: false, error: errText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
