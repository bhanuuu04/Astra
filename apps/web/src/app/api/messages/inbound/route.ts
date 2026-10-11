import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiBaseUrl}/api/v1/sightings?limit=50`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, sightings: [] }, { status: 500 });
    }

    const sightings = await res.json();
    return NextResponse.json({ success: true, sightings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
