const EXAMPLE_CLERK_KEY = 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k';

export function isClerkAuthConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  return key.startsWith('pk_') && key !== EXAMPLE_CLERK_KEY && !key.includes('...');
}
