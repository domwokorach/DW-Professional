// Coarse device detection from the normal User-Agent header plus Client Hints when the browser sends them.
// Nothing here fingerprints: no canvas, fonts, screen size or other identifiers. When the model can't be read
// reliably the result is "Unknown device model"; it is never guessed.

export type DeviceInfo = { deviceType: string; deviceModel: string; os: string; browser: string };
export const UNKNOWN_MODEL = 'Unknown device model';

type Hints = { platform?: string | null; mobile?: string | null; model?: string | null };
const unquote = (s?: string | null) => (s ?? '').replace(/"/g, '').trim();

export function parseDevice(userAgent: string | null | undefined, hints: Hints = {}): DeviceInfo {
  const ua = (userAgent ?? '').slice(0, 400);
  const hintPlatform = unquote(hints.platform);

  const os =
    /iPhone|iPad|iPod/.test(ua) ? 'iOS'
    : /Android/.test(ua) ? 'Android'
    : /Windows/.test(ua) ? 'Windows'
    : /CrOS/.test(ua) ? 'ChromeOS'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
    : /Linux/.test(ua) ? 'Linux'
    : hintPlatform || 'Unknown OS';

  const browser =
    /Edg(e|A|iOS)?\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
    : /Firefox\/|FxiOS/.test(ua) ? 'Firefox'
    : /Chrome\/|CriOS/.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : 'Other browser';

  const isTablet = /iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua));
  const deviceType =
    !ua ? 'Unknown'
    : /bot|crawl|spider|curl|wget|python|node-fetch|axios/i.test(ua) ? 'Automated client'
    : isTablet ? 'Tablet'
    : hints.mobile === '?1' || /Mobi|iPhone|Android/.test(ua) ? 'Mobile'
    : 'Desktop';

  return { deviceType, deviceModel: model(ua, os, unquote(hints.model)), os, browser };
}

function model(ua: string, os: string, hintModel: string): string {
  // iOS never reveals the exact model; the family is all the browser discloses.
  if (/iPad/.test(ua)) return 'Apple iPad';
  if (/iPhone/.test(ua)) return 'Apple iPhone';
  if (os === 'macOS') return 'Apple Mac';
  if (os === 'Windows') return 'Windows PC';
  if (os === 'ChromeOS') return 'Chromebook';
  if (os === 'Android') {
    const raw = hintModel || /Android[^;)]*;\s*([^;)]+?)(?:\sBuild\/|[;)])/.exec(ua)?.[1]?.trim() || '';
    // Chrome's reduced User-Agent reports a bare "K" instead of a model.
    if (!raw || raw === 'K' || /^(Android|Mobile|Linux)$/i.test(raw)) return UNKNOWN_MODEL;
    if (/^SM-[A-Z0-9]+/i.test(raw)) return `Samsung Galaxy (${raw.split(/\s/)[0].toUpperCase()})`;
    if (/Pixel/i.test(raw)) return /^google/i.test(raw) ? raw : `Google ${raw}`;
    if (/Nokia/i.test(raw)) return raw;
    return raw.slice(0, 60);
  }
  if (os === 'Linux') return 'Linux computer';
  return UNKNOWN_MODEL;
}
