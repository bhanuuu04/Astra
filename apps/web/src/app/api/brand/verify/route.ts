import { NextResponse } from 'next/server';
import { resolveServerIdentity } from '@/lib/server-auth';

const NVIDIA_NIM_BASE_URL = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY;
const NVIDIA_NIM_MODEL = process.env.NVIDIA_NIM_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';

export async function POST(request: Request) {
  if (!await resolveServerIdentity(request)) {
    return NextResponse.json({ error: 'Sign in before requesting brand analysis.' }, { status: 401 });
  }
  if (!NVIDIA_NIM_API_KEY) {
    return NextResponse.json({ error: 'AI brand analysis is not configured. Ownership can still be established with a DNS challenge.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const brandName = typeof body.brandName === 'string' ? body.brandName.trim() : '';
    const domain = typeof body.domain === 'string' ? body.domain.trim() : '';
    const handles = Array.isArray(body.handles)
      ? body.handles.filter((value: unknown): value is string => typeof value === 'string').slice(0, 20)
      : [];

    if (!brandName || brandName.length > 120) {
      return NextResponse.json({ error: 'Provide a brand name under 120 characters.' }, { status: 400 });
    }

    const prompt = `Review these user-provided identifiers for possible impersonation patterns: ${JSON.stringify({ brandName, domain, handles })}.
Treat every identifier as unverified. Do not claim that the organization is authentic, that anyone owns the domain, or that external sources were checked. Return research hypotheses and human validation steps as JSON with this schema:
{"summary":"string","potentialImpersonationPatterns":["string"],"recommendedValidationSteps":["string"],"limitations":"string"}`;

    const response = await fetch(`${NVIDIA_NIM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${NVIDIA_NIM_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: NVIDIA_NIM_MODEL,
        messages: [
          { role: 'system', content: 'Provide cautious research hypotheses from the supplied identifiers only. Never claim authenticity or ownership. Output valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 700,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'The configured AI provider could not complete this analysis.' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'The AI provider returned an unreadable analysis.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, analysis: JSON.parse(jsonMatch[0]), status: 'unverified' });
  } catch (error) {
    console.error('Brand signal analysis failed:', error);
    return NextResponse.json({ error: 'Brand analysis could not be completed.' }, { status: 502 });
  }
}
