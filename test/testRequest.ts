import { NextRequest } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, DEVICE_COOKIE } from '@/lib/auth/cookies';
import { signAccessToken } from '@/lib/auth/tokens';
import type { Role } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const nextHeadersMock = jest.requireMock('next/headers') as {
  __setMockCookies: (cookies: Record<string, string>) => void;
  __clearMockCookies: () => void;
};

interface JsonRequestOptions {
  method?: string;
  body?: unknown;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}

/**
 * Builds a real NextRequest against a route handler the same way the Next.js
 * runtime would — route handlers in this app read `request.json()`,
 * `request.cookies`, and `request.headers` directly, so a plain mock object
 * would need to fake all three; this is the one construction site every
 * route test in __tests__/api and __tests__/auth shares.
 */
export function makeRequest(url: string, options: JsonRequestOptions = {}): NextRequest {
  const { method = 'GET', body, cookies = {}, headers = {}, searchParams } = options;

  const fullUrl = new URL(url, 'http://localhost:3000');
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) fullUrl.searchParams.set(key, value);
  }

  const cookieHeader = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');

  const requestHeaders = new Headers(headers);
  if (cookieHeader) requestHeaders.set('cookie', cookieHeader);
  if (body !== undefined && !requestHeaders.has('content-type')) {
    requestHeaders.set('content-type', 'application/json');
  }

  return new NextRequest(fullUrl, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** Signs a real access-token JWT for use as the `admin_at` cookie, without going through a full sign-in flow. */
export async function createAdminToken(claims: {
  sub: string;
  email: string;
  role: Role;
  sessionId: string;
}): Promise<string> {
  return signAccessToken(claims);
}

/**
 * Builds the cookie map (`admin_at`/`admin_rt`/`admin_device`) for an
 * authenticated request. Pass a real user+session pair (from the mocked
 * Prisma client) — the token is signed for real, but the DB lookups guard.ts
 * performs still resolve through whatever db.user/db.session mocks the test
 * has configured, so tests control "session revoked", "user suspended", etc.
 * independently of the token's own validity.
 */
export async function authCookiesFor(params: {
  userId: string;
  email: string;
  role: Role;
  sessionId: string;
  refreshToken?: string;
  deviceId?: string;
}): Promise<Record<string, string>> {
  const accessToken = await createAdminToken({
    sub: params.userId,
    email: params.email,
    role: params.role,
    sessionId: params.sessionId,
  });

  const cookies: Record<string, string> = { [ACCESS_COOKIE]: accessToken };
  if (params.refreshToken) cookies[REFRESH_COOKIE] = params.refreshToken;
  if (params.deviceId) cookies[DEVICE_COOKIE] = params.deviceId;

  // guard.ts reads via next/headers' cookies(), not request.cookies — keep
  // the mocked next/headers store in sync so requireAdminApi()/getAdminSession()
  // see the same admin_at value as the NextRequest built from these cookies.
  nextHeadersMock.__setMockCookies(cookies);

  return cookies;
}

/** Clears the mocked next/headers cookie store — call in afterEach if a test suite mixes authenticated and unauthenticated requests. */
export function clearMockAuthCookies() {
  nextHeadersMock.__clearMockCookies();
}

export async function readJson(response: Response) {
  return response.json();
}
