// Server-only helpers for reading request metadata (client IP, device summary) and same-origin checks.

/** The client IP as reported by the platform proxy (Vercel sets x-forwarded-for / x-real-ip), or "unknown". */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || request.headers.get('x-real-ip')?.trim() || '';
  return ip && ip.length <= 64 ? ip : 'unknown';
}

/** The user agent, capped so an oversized header can't bloat storage. */
export const userAgent = (request: Request) => (request.headers.get('user-agent') ?? '').slice(0, 400) || null;

/**
 * A short device / platform summary such as "Desktop · macOS · Chrome", from the user agent (and the
 * Sec-CH-UA client hints when the browser sends them). Coarse on purpose: it is moderation context, not tracking.
 */
export function deviceSummary(request: Request): string | null {
  const ua = request.headers.get('user-agent') ?? '';
  if (!ua) return null;
  const hintPlatform = request.headers.get('sec-ch-ua-platform')?.replace(/"/g, '');
  const hintMobile = request.headers.get('sec-ch-ua-mobile');

  const os =
    hintPlatform ||
    (/iPhone|iPad|iPod/.test(ua) ? 'iOS'
    : /Android/.test(ua) ? 'Android'
    : /Windows/.test(ua) ? 'Windows'
    : /CrOS/.test(ua) ? 'ChromeOS'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
    : /Linux/.test(ua) ? 'Linux'
    : 'Unknown OS');

  const browser =
    /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
    : /Firefox\/|FxiOS/.test(ua) ? 'Firefox'
    : /Chrome\/|CriOS/.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : 'Other browser';

  const kind =
    /iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'Tablet'
    : hintMobile === '?1' || /Mobi|iPhone|Android/.test(ua) ? 'Mobile'
    : /bot|crawl|spider|curl|wget|python|node-fetch|axios/i.test(ua) ? 'Automated client'
    : 'Desktop';

  return `${kind} · ${os} · ${browser}`.slice(0, 120);
}

/**
 * True when the request comes from this site's own pages: the Origin header (or, failing that, Referer) must
 * match the Host the request was sent to. Browsers always send Origin on cross-site POST/PATCH/DELETE, so a
 * forged cross-site request fails this check.
 */
export function isSameOrigin(request: Request): boolean {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return false;
  const source = request.headers.get('origin') ?? request.headers.get('referer');
  if (!source || source === 'null') return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}
