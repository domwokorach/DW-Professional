import {
  authorizeUrl, cookie, FORM_PATH, linkedInEnabled, randomToken, redirectUri, seal, STATE_COOKIE, STATE_TTL_S,
} from '@/lib/linkedin.server';
import { createRateLimit } from '@/lib/rate-limit.server';
import { trustedClientIp } from '@/lib/request.server';

export const dynamic = 'force-dynamic';

const limited = createRateLimit({ windowMs: 10 * 60 * 1000, max: 20 });

/**
 * GET → redirect to LinkedIn's sign-in. A fresh random `state` (CSRF protection) and `nonce` (ties the ID token to
 * this request) are kept in a signed, HttpOnly, 10-minute cookie; nothing about the form goes in the URL (the page
 * keeps its own draft in sessionStorage).
 */
export function GET(request: Request) {
  const back = (code: string) => Response.redirect(new URL(`${FORM_PATH}?linkedin=${code}`, request.url), 303);
  if (!linkedInEnabled()) return back('unavailable');
  if (limited(trustedClientIp(request) ?? 'unknown')) return back('error');
  const state = randomToken();
  const nonce = randomToken();
  const redirect = redirectUri(request);
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl(state, nonce, redirect),
      'Set-Cookie': cookie(STATE_COOKIE, seal({ state, nonce, redirect }, STATE_TTL_S), STATE_TTL_S, '/api/auth/linkedin'),
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
