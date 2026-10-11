import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      // Never fall back to demo tenant when credentials are missing
      return NextResponse.json({ success: true, sightings: [] });
    }

    const res = await fetch(`${apiBaseUrl}/api/v1/sightings?limit=50`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      }
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, sightings: [] }, { status: res.status });
    }

    const sightings = await res.json();
    return NextResponse.json({ success: true, sightings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
