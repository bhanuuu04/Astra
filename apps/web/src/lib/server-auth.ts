import { auth, currentUser } from '@clerk/nextjs/server';
import { isClerkAuthConfigured } from '@/lib/auth-config';

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ServerIdentity {
  id: string;
  providerUserId: string;
  email?: string;
  accessToken?: string;
}

/** Resolve identity from a verified Clerk session or an API-validated local JWT. */
export async function resolveServerIdentity(request: Request): Promise<ServerIdentity | null> {
  if (isClerkAuthConfigured()) {
    const { userId } = await auth();
    if (!userId) return null;
    const user = await currentUser();
    if (!user || user.id !== userId) return null;
    return {
      id: userId,
      providerUserId: `astra_${userId}`,
      email: user.primaryEmailAddress?.emailAddress?.toLowerCase(),
    };
  }

  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return null;
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const profile = await response.json();
  const user = profile.user;
  if (!user?.id) return null;
  return {
    id: user.id,
    providerUserId: `astra_${user.clerk_id || user.id}`,
    email: user.email,
    accessToken,
  };
}
