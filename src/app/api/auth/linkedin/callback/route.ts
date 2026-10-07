import { timingSafeEqual } from 'node:crypto';
import {
  clearCookie, cookie, exchangeCode, FORM_PATH, IDENTITY_COOKIE, IDENTITY_TTL_S, linkedInEnabled, readCookie, seal,
  STATE_COOKIE, unseal, verifyIdToken,
} from '@/lib/linkedin.server';

export const dynamic = 'force-dynamic';

type OAuthState = { state: string; nonce: string; redirect: string };

/**
 * LinkedIn redirects here after sign-in. Checks `state` against the signed cookie set by /start, exchanges the code,
 * verifies the ID token, and keeps the member's details in a signed, HttpOnly, 1-hour cookie until the candidate
 * submits the form. Always returns to the form with a short status code; never shows LinkedIn's or our errors.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const headers = new Headers({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
  // The state cookie is single-use: cleared whatever happens.
  headers.append('Set-Cookie', clearCookie(STATE_COOKIE, '/api/auth/linkedin'));
  const back = (status: string) => {
    // 303 + replace-friendly: the browser lands on the form with a GET, and the page strips the status from the URL.
    headers.set('Location', new URL(`${FORM_PATH}?linkedin=${status}`, request.url).toString());
    return new Response(null, { status: 303, headers });
  };

  if (!linkedInEnabled()) return back('unavailable');
  const saved = unseal<OAuthState>(readCookie(request, STATE_COOKIE));
  const state = url.searchParams.get('state') ?? '';
  if (!saved || state.length !== saved.state.length || !timingSafeEqual(Buffer.from(state), Buffer.from(saved.state))) {
    return back('expired'); // missing, expired, replayed or forged
  }
  const error = url.searchParams.get('error');
  if (error) return back(/cancel/i.test(error) || error === 'access_denied' ? 'cancelled' : 'error');
  const code = url.searchParams.get('code');
  if (!code || code.length > 2000) return back('error');

  try {
    const identity = await verifyIdToken(await exchangeCode(code, saved.redirect), saved.nonce);
    headers.append('Set-Cookie', cookie(IDENTITY_COOKIE, seal(identity, IDENTITY_TTL_S), IDENTITY_TTL_S, '/api'));
    return back('connected');
  } catch (err) {
    console.error('[linkedin] Sign-in failed:', (err as Error).name, (err as Error).message.slice(0, 60));
    return back('error');
  }
}
