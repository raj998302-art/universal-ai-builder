import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect API routes (except health check, auth, preview, mcp, and signed download URLs)
  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/health') &&
    !pathname.startsWith('/api/auth') &&
    !pathname.startsWith('/api/preview') &&
    !pathname.startsWith('/api/mcp') &&
    !pathname.startsWith('/api/openapi.json') &&
    !request.nextUrl.searchParams.has('key')
  ) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required. Provide a Bearer token in the Authorization header.',
          },
        },
        { status: 401 }
      );
    }
  }

  // Protect dashboard routes - check for session cookie
  if (pathname.startsWith('/dashboard')) {
    const sessionCookie = request.cookies.get('session');
    // In development or when no auth is configured, allow access
    if (!sessionCookie && process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_SECRET) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
