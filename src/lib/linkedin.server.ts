// Server-only: "Continue with LinkedIn" for the Portfolio Access form, using LinkedIn's Sign In with LinkedIn using
// OpenID Connect (Authorization Code flow, scopes openid profile email). LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET
// stay on the server: they are read only here and never returned, logged or sent to the browser.
//
// Nothing is stored until the candidate submits the form: the verified identity travels in a short-lived, signed,
// HttpOnly cookie, and the submit route saves it with the candidate's session. LinkedIn access tokens are used once
// (to fetch the ID token) and never kept.
import { createHmac, createPublicKey, hkdfSync, randomBytes, timingSafeEqual, verify, type JsonWebKey } from 'node:crypto';

export type LinkedInIdentity = {
  /** LinkedIn's member identifier (the OIDC `sub`). */
  memberId: string;
  name: string | null;
  givenName: string | null;
  familyName: string | null;
  email: string | null;
  picture: string | null;
  locale: string | null;
  connectedAt: string;
};

export const STATE_COOKIE = 'pa_li_oauth';
export const IDENTITY_COOKIE = 'pa_li';
export const STATE_TTL_S = 10 * 60;
export const IDENTITY_TTL_S = 60 * 60;
export const CALLBACK_PATH = '/api/auth/linkedin/callback';
export const FORM_PATH = '/en-gb/portfolio-access';

/**
 * LinkedIn's endpoints. LINKEDIN_OIDC_BASE_URL may point them at a local mock, but only outside production, so the
 * live site can only ever talk to LinkedIn itself.
 */
function endpoints() {
  const mock = process.env.NODE_ENV !== 'production' ? process.env.LINKEDIN_OIDC_BASE_URL?.replace(/\/+$/, '') : undefined;
  const www = mock ?? 'https://www.linkedin.com';
  return {
    authorize: `${www}/oauth/v2/authorization`,
    token: `${www}/oauth/v2/accessToken`,
    jwks: `${www}/oauth/openid/jwks`,
    issuer: `${www}/oauth`,
  };
}

const clientId = () => process.env.LINKEDIN_CLIENT_ID ?? '';
const clientSecret = () => process.env.LINKEDIN_CLIENT_SECRET ?? '';
export const linkedInEnabled = () => Boolean(clientId() && clientSecret());

/** The callback LinkedIn returns to. Must exactly match a redirect URL registered in the LinkedIn app. */
export function redirectUri(request: Request) {
  return process.env.LINKEDIN_REDIRECT_URI || `${new URL(request.url).origin}${CALLBACK_PATH}`;
}

// ---- Signed cookies -------------------------------------------------------------------------------------------

/** HMAC key derived from the client secret, so no extra secret has to be configured. */
const signingKey = () => Buffer.from(hkdfSync('sha256', clientSecret(), 'portfolio-access', 'linkedin-cookie-v1', 32));
const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url');

export function seal(payload: object, ttlSeconds: number): string {
  const body = b64(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  return `${body}.${b64(createHmac('sha256', signingKey()).update(body).digest())}`;
}

export function unseal<T>(value: string | undefined | null): T | null {
  if (!value || !linkedInEnabled()) return null;
  const [body, mac] = value.split('.');
  if (!body || !mac) return null;
  const expected = createHmac('sha256', signingKey()).update(body).digest();
  const given = Buffer.from(mac, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T & { exp?: number };
    return typeof data.exp === 'number' && data.exp > Date.now() / 1000 ? data : null;
  } catch {
    return null;
  }
}

/** Cookie header value. Secure everywhere except plain-http local development. */
export function cookie(name: string, value: string, maxAge: number, path: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  // SameSite=Lax: sent on LinkedIn's top-level redirect back to the callback, never on cross-site sub-requests.
  return `${name}=${value}; Path=${path}; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}
export const clearCookie = (name: string, path: string) => cookie(name, '', 0, path);

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

/** The connected identity from the candidate's cookie, if valid and not expired. */
export const readIdentity = (request: Request) => unseal<LinkedInIdentity>(readCookie(request, IDENTITY_COOKIE));

// ---- Authorization Code flow ----------------------------------------------------------------------------------

export const randomToken = () => randomBytes(32).toString('base64url');

export function authorizeUrl(state: string, nonce: string, redirect: string) {
  const url = new URL(endpoints().authorize);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId(),
    redirect_uri: redirect,
    state,
    nonce,
    scope: 'openid profile email',
  }).toString();
  return url.toString();
}

export class LinkedInError extends Error {}

/** Exchanges the authorization code for tokens; returns only the ID token (the access token is discarded). */
export async function exchangeCode(code: string, redirect: string): Promise<string> {
  const res = await fetch(endpoints().token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect, client_id: clientId(), client_secret: clientSecret() }),
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  if (!res.ok) throw new LinkedInError(`token endpoint ${res.status}`);
  const body = (await res.json()) as { id_token?: unknown };
  if (typeof body.id_token !== 'string') throw new LinkedInError('no id_token');
  return body.id_token;
}

let jwksCache: { keys: (JsonWebKey & { kid?: string })[]; at: number } | null = null;
async function signingKeys(force = false) {
  if (!force && jwksCache && Date.now() - jwksCache.at < 60 * 60 * 1000) return jwksCache.keys;
  const res = await fetch(endpoints().jwks, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
  if (!res.ok) throw new LinkedInError(`jwks ${res.status}`);
  jwksCache = { keys: ((await res.json()) as { keys: (JsonWebKey & { kid?: string })[] }).keys ?? [], at: Date.now() };
  return jwksCache.keys;
}

const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

/**
 * Verifies the ID token (RS256 signature against LinkedIn's published keys, issuer, audience, expiry, issued-at and
 * the nonce sent with the request) and returns the member's details. Throws on anything invalid.
 */
export async function verifyIdToken(idToken: string, nonce: string): Promise<LinkedInIdentity> {
  const [h, p, s] = idToken.split('.');
  if (!h || !p || !s) throw new LinkedInError('malformed id_token');
  const header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8')) as { alg?: string; kid?: string };
  if (header.alg !== 'RS256') throw new LinkedInError('unexpected alg');
  const signed = Buffer.from(`${h}.${p}`);
  const signature = Buffer.from(s, 'base64url');
  const check = (keys: (JsonWebKey & { kid?: string })[]) => {
    const jwk = keys.find((k) => k.kid === header.kid);
    return Boolean(jwk && verify('RSA-SHA256', signed, createPublicKey({ key: jwk, format: 'jwk' }), signature));
  };
  // Cached keys first; if they don't verify (a new or rotated key), fetch LinkedIn's current keys once and retry.
  if (!check(await signingKeys()) && !check(await signingKeys(true))) throw new LinkedInError('bad signature');

  const c = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) as Record<string, unknown>;
  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (c.iss !== endpoints().issuer) throw new LinkedInError('bad issuer');
  if (!aud.includes(clientId())) throw new LinkedInError('bad audience');
  if (typeof c.exp !== 'number' || c.exp < now - 60) throw new LinkedInError('expired');
  if (typeof c.iat === 'number' && c.iat > now + 300) throw new LinkedInError('issued in the future');
  if (typeof c.nonce !== 'string' || c.nonce.length !== nonce.length || !timingSafeEqual(Buffer.from(c.nonce), Buffer.from(nonce))) {
    throw new LinkedInError('bad nonce');
  }
  const memberId = text(c.sub, 200);
  if (!memberId) throw new LinkedInError('no sub');

  const email = text(c.email, 254);
  const picture = text(c.picture, 1000);
  const locale = typeof c.locale === 'string'
    ? text(c.locale, 20)
    : c.locale && typeof c.locale === 'object'
      ? text([(c.locale as Record<string, unknown>).language, (c.locale as Record<string, unknown>).country].filter(Boolean).join('_'), 20)
      : null;
  return {
    memberId,
    name: text(c.name, 120),
    givenName: text(c.given_name, 80),
    familyName: text(c.family_name, 80),
    // Only an address that looks like one; LinkedIn may omit it.
    email: email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null,
    // Only an https image URL (it is shown in the admin page).
    picture: picture && /^https:\/\//i.test(picture) ? picture : null,
    locale,
    connectedAt: new Date().toISOString(),
  };
}
