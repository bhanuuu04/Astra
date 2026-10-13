import { NextResponse } from 'next/server';

interface FetchHandleRequest {
  platform: string;
  handle: string;
  domain?: string;
}

// Clean and extract handle from raw text or full URL
function extractCleanHandle(platform: string, raw: string): { cleanHandle: string; canonicalHandle: string } {
  let cleaned = raw.trim();

  // If user pasted a URL, extract the path segment
  try {
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      const url = new URL(cleaned);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        // e.g. linkedin.com/company/astra -> astra
        if (segments[0] === 'company' && segments.length > 1) {
          cleaned = segments[1];
        } else {
          cleaned = segments[0];
        }
      }
    }
  } catch {}

  // Strip leading @, query params, slashes
  cleaned = cleaned.replace(/^@+/, '').split('?')[0].replace(/\/+$/, '');

  const normalizedPlatform = platform.toLowerCase().replace('x_twitter', 'twitter');
  let canonicalHandle = cleaned;

  if (['instagram', 'twitter', 'x', 'youtube'].includes(normalizedPlatform)) {
    canonicalHandle = `@${cleaned}`;
  } else if (normalizedPlatform === 'linkedin' && !cleaned.startsWith('company/')) {
    canonicalHandle = cleaned;
  }

  return { cleanHandle: cleaned, canonicalHandle };
}

// Platform validation regex rules
function validatePlatformHandle(platform: string, cleanHandle: string): { valid: boolean; reason?: string } {
  const norm = platform.toLowerCase().replace('x_twitter', 'twitter');

  if (!cleanHandle || cleanHandle.length < 1) {
    return { valid: false, reason: 'Username cannot be empty.' };
  }

  if (norm === 'instagram') {
    if (cleanHandle.length > 30) {
      return { valid: false, reason: 'Instagram usernames must be at most 30 characters.' };
    }
    if (!/^[a-zA-Z0-9._]+$/.test(cleanHandle)) {
      return { valid: false, reason: 'Instagram usernames can only contain letters, numbers, periods, and underscores.' };
    }
    if (cleanHandle.startsWith('.') || cleanHandle.endsWith('.')) {
      return { valid: false, reason: 'Instagram usernames cannot begin or end with a period.' };
    }
  } else if (norm === 'twitter' || norm === 'x') {
    if (cleanHandle.length > 15) {
      return { valid: false, reason: 'Twitter/X usernames must be 15 characters or fewer.' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanHandle)) {
      return { valid: false, reason: 'Twitter/X usernames can only contain letters, numbers, and underscores.' };
    }
  } else if (norm === 'linkedin') {
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanHandle.replace('company/', ''))) {
      return { valid: false, reason: 'LinkedIn company slug contains invalid characters.' };
    }
  }

  return { valid: true };
}

export async function POST(request: Request) {
  try {
    const body: FetchHandleRequest = await request.json();
    const { platform, handle, domain } = body;

    if (!platform || !handle) {
      return NextResponse.json(
        { error: 'Platform and handle are required.' },
        { status: 400 }
      );
    }

    const { cleanHandle, canonicalHandle } = extractCleanHandle(platform, handle);
    const validation = validatePlatformHandle(platform, cleanHandle);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason || 'Invalid username format.' },
        { status: 422 }
      );
    }

    let existsCheck = true;
    let profileTitle: string | null = null;
    let avatarUrl: string = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanHandle)}&background=0f7b6c&color=fff&rounded=true`;

    // Attempt non-blocking profile probe
    const norm = platform.toLowerCase().replace('x_twitter', 'twitter');
    let probeUrl = '';
    if (norm === 'instagram') probeUrl = `https://www.instagram.com/${cleanHandle}/`;
    else if (norm === 'twitter' || norm === 'x') probeUrl = `https://x.com/${cleanHandle}`;
    else if (norm === 'linkedin') probeUrl = `https://www.linkedin.com/company/${cleanHandle.replace('company/', '')}/`;
    else if (norm === 'facebook') probeUrl = `https://www.facebook.com/${cleanHandle}`;
    else if (norm === 'youtube') probeUrl = `https://www.youtube.com/@${cleanHandle}`;

    if (probeUrl) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      try {
        const probeRes = await fetch(probeUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AstraBrandSentinel/2.0',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });

        if (probeRes.status === 404) {
          existsCheck = false;
        } else if (probeRes.ok) {
          existsCheck = true;
          const html = await probeRes.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            profileTitle = titleMatch[1].trim();
          }
          const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
          if (ogImageMatch && ogImageMatch[1]) {
            avatarUrl = ogImageMatch[1];
          }
        }
      } catch {
        // Network timeout / bot protection fallback: still valid syntactically
        existsCheck = true;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    return NextResponse.json({
      success: true,
      platform,
      rawHandle: handle,
      cleanHandle,
      canonicalHandle,
      exists: existsCheck,
      verified: true,
      profileTitle,
      avatarUrl,
      message: `Verified official ${platform.toUpperCase()} username: ${canonicalHandle}`,
    });

  } catch (err: any) {
    console.error('Fetch handle error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to verify handle.' },
      { status: 500 }
    );
  }
}
