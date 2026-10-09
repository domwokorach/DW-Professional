import { NextResponse, type NextRequest } from 'next/server';
import { LOGIN_PATH, SESSION_COOKIE } from '@/lib/admin/constants';

/**
 * First line of defence for the admin area only (the public site isn't matched). It redirects visitors with no
 * session cookie away from admin pages and adds no-cache / no-index / no-framing headers. It does NOT decide
 * who is signed in: every admin page and API validates the session against the database itself.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const production = process.env.NODE_ENV === 'production';

  // HTTPS only in production (the platform normally does this already; this makes it explicit for /admin).
  if (production && request.headers.get('x-forwarded-proto') === 'http') {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  let response: NextResponse;
  const isPage = !pathname.startsWith('/api/');
  if (isPage && pathname !== LOGIN_PATH && !request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = '';
    url.searchParams.set('next', `${pathname}${search}`);
    response = NextResponse.redirect(url);
  } else {
    response = NextResponse.next();
  }

  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'same-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  if (production) response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
