// Server-only helpers shared by the /api/resume routes.
import { site } from '@/config';
import { HOME } from '@/config/site';
import { parseDevice } from '@/lib/device';
import { CODE_TTL_MS } from '@/lib/resume-access';
import type { IssuedCode, RequestMeta } from '@/lib/resume-store.server';
import { sendResumeEmail } from '@/lib/resume-email.server';
import { trustedClientIp, userAgent } from '@/lib/request.server';

export const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

export const GRANT_COOKIE = 'resume_grant';
const secure = () => (process.env.NODE_ENV === 'production' ? '; Secure' : '');
export const grantCookie = (value: string, maxAgeSeconds: number) =>
  `${GRANT_COOKIE}=${value}; Path=/api/resume; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure()}`;

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=') || null;
  }
  return null;
}

/** Server-side IP (trusted proxy headers only) and coarse device info from the User-Agent and Client Hints. */
export function requestMeta(request: Request): RequestMeta {
  const device = parseDevice(request.headers.get('user-agent'), {
    platform: request.headers.get('sec-ch-ua-platform'),
    mobile: request.headers.get('sec-ch-ua-mobile'),
    model: request.headers.get('sec-ch-ua-model'),
  });
  return { ...device, ipAddress: trustedClientIp(request), userAgent: userAgent(request) };
}

/** The emailed link: the token rides in the URL fragment, so it never reaches server logs or Referer headers. */
export const verifyUrl = (token: string) => `${site.url.replace(/\/+$/, '')}${HOME}/resume/verify#t=${token}`;

/** Emails a freshly issued code. True only when the provider accepted the message. */
export function emailCode(code: IssuedCode, fullName: string, email: string, kind: 'request' | 'resend') {
  return sendResumeEmail(
    email,
    { fullName, pin: code.pin, verifyUrl: verifyUrl(code.token), minutes: CODE_TTL_MS / 60000, siteUrl: site.url },
    // Different per issued code, so a retry of the same request is not sent twice but a new code always is.
    `resume-${kind}-${code.id}-${code.expiresAt.getTime()}`,
  );
}
