import { NextResponse } from 'next/server';
import { SEED_BRANDS, SEED_POSTS, SEED_STORIES } from '@/lib/consumer-feed-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');

    let posts = SEED_POSTS;

    if (category) {
      posts = posts.filter((p) => p.category === category);
    }
    if (brand) {
      posts = posts.filter(
        (p) => p.brandName.toLowerCase() === brand.toLowerCase() || p.brandId === brand
      );
    }

    return NextResponse.json({
      success: true,
      brandsCount: SEED_BRANDS.length,
      brands: SEED_BRANDS,
      stories: SEED_STORIES,
      posts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch consumer security feed' },
      { status: 500 }
    );
  }
}
