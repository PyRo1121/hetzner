import { type NextRequest, NextResponse } from 'next/server';

/**
 * Edge Middleware for caching and optimization
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get pathname
  const { pathname } = request.nextUrl;

  // In production, cache static assets aggressively; in dev, avoid long cache
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/worklets')
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    response.headers.set(
      'Cache-Control',
      isProd ? 'public, max-age=31536000, immutable' : 'no-cache, must-revalidate'
    );
    return response;
  }

  // Cache API responses with shorter TTL
  if (pathname.startsWith('/api')) {
    // Don't cache admin endpoints
    if (pathname.startsWith('/api/admin')) {
      response.headers.set('Cache-Control', 'no-store, must-revalidate');
      return response;
    }

    // Cache GraphQL queries for 60 seconds
    if (pathname === '/api/graphql') {
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      return response;
    }

    // Cache other API routes for 5 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  }

  // Cache pages with ISR
  if (pathname.startsWith('/dashboard')) {
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  }

  // Cache landing page for 5 minutes
  if (pathname === '/') {
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  }

  // Default: no cache for dynamic pages
  response.headers.set('Cache-Control', 'no-cache, must-revalidate');
  return response;
}

// Configure which routes use middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
