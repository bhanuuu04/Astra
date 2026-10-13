import { NextResponse } from 'next/server';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY || 'ak_OCJyi-IhtbMULLyu4vpq';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const connectedAccountId = searchParams.get('connectedAccountId');

    if (!connectedAccountId) {
      return NextResponse.json({ error: 'connectedAccountId parameter is required' }, { status: 400 });
    }

    const response = await fetch(`https://backend.composio.dev/api/v3.1/connected_accounts/${connectedAccountId}`, {
      headers: {
        'x-api-key': COMPOSIO_API_KEY,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const errData = await response.json();
      return NextResponse.json({
        active: false,
        status: 'UNKNOWN',
        error: errData.message || 'Account not found or not yet registered',
      });
    }

    const data = await response.json();
    const isActive = data.status === 'ACTIVE';

    return NextResponse.json({
      active: isActive,
      status: data.status,
      id: data.id,
      toolkit: data.toolkit?.slug,
      userId: data.user_id,
      accountData: data,
    });
  } catch (err: any) {
    console.error('Error verifying connected account status:', err);
    return NextResponse.json(
      { active: false, status: 'ERROR', error: err.message },
      { status: 500 }
    );
  }
}
