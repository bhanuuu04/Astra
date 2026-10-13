import { NextResponse, type NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Public routes that do not require clerk session redirect
const isPublicRoute = createRouteMatcher([
  '/',
  '/landing(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/consumer(.*)',
  '/api/(.*)'
]);

const clerkHandler = clerkMiddleware(async (auth, request) => {
  // If user is trying to access protected pages without signing in, redirect to /sign-in
  if (!isPublicRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url);
      // Let initial login direct to the onboarding /guide flow
      if (!request.nextUrl.pathname.startsWith('/overview')) {
        signInUrl.searchParams.set('redirect_url', request.url);
      }
      return NextResponse.redirect(signInUrl);
    }
  }
});

export default function middleware(request: NextRequest, event: any) {
  if (hasClerkKey) {
    return clerkHandler(request, event);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Clerk internal auto-proxy path as mandated by Clerk Next.js matcher
    '/__clerk/:path*',
  ],
};
