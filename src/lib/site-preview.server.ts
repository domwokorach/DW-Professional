// Server-only: fetches a public web page and reads its name and description, for the Portfolio Access "Import
// from company website" button. The URL comes from a visitor, so the fetch is locked down against server-side
// request forgery: http(s) on the standard ports only, every DNS answer (including after each redirect) must be a
// public address, at most 3 redirects, a 6 second overall limit, and at most 512 KB of HTML read. Only text comes
// back: no images or other resources are fetched, and nothing from the page is ever rendered as HTML.
import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import http, { type IncomingMessage } from 'node:http';
import https from 'node:https';
import { isIP, type LookupFunction } from 'node:net';
import type { SitePreview } from '@/lib/portfolio-access';

const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 6000;

export class PreviewError extends Error {
  constructor(public code: 'blocked' | 'unreachable' | 'not_html' | 'too_large') {
    super(code);
  }
}

/** True for addresses that must never be fetched: loopback, private, link-local (incl. cloud metadata), etc. */
export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) || a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v6);
  if (mapped) return isPrivateAddress(mapped[1]);
  return (
    v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || /^fe[89ab]/.test(v6) ||
    v6.startsWith('ff') || v6.startsWith('64:ff9b:') || v6.startsWith('2001:db8')
  );
}

/** DNS lookup that refuses private answers. Used for the actual connection, so a rebinding DNS can't slip past. */
const safeLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '', 4);
    const list = addresses as unknown as LookupAddress[];
    if (!list.length || list.some((a) => isPrivateAddress(a.address))) {
      return callback(Object.assign(new Error('blocked address'), { code: 'EBLOCKED' }), '', 4);
    }
    if ((options as { all?: boolean }).all) return (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

function checkUrl(url: URL) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new PreviewError('blocked');
  if (url.username || url.password) throw new PreviewError('blocked');
  if (url.port && url.port !== '80' && url.port !== '443') throw new PreviewError('blocked');
  // A literal IP skips DNS, so check it here as well.
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) && isPrivateAddress(host)) throw new PreviewError('blocked');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new PreviewError('blocked');
  }
}

function get(url: URL, signal: AbortSignal): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const req = (url.protocol === 'https:' ? https : http).get(url, {
      lookup: safeLookup,
      signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DominicPortfolioPreview/1.0; +https://www.dominicwokorach.me)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
        'Accept-Language': 'en-GB,en;q=0.8',
      },
    });
    req.on('response', resolve);
    req.on('error', (err: NodeJS.ErrnoException) => reject(err.code === 'EBLOCKED' ? new PreviewError('blocked') : new PreviewError('unreachable')));
  });
}

async function readHtml(res: IncomingMessage): Promise<string> {
  const type = String(res.headers['content-type'] ?? '');
  if (!/text\/html|application\/xhtml\+xml/i.test(type)) {
    res.resume();
    throw new PreviewError('not_html');
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of res) {
    size += (chunk as Buffer).length;
    chunks.push(chunk as Buffer);
    // Enough for the <head>: stop reading rather than failing on large pages.
    if (size >= MAX_BYTES) {
      res.destroy();
      break;
    }
  }
  return Buffer.concat(chunks).subarray(0, MAX_BYTES).toString('utf8');
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
function decode(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Math.min(Number(n), 0x10ffff)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Math.min(parseInt(n, 16), 0x10ffff)))
    .replace(/&([a-z#0-9]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}
/** Plain text only: tags stripped, entities decoded, control characters removed, whitespace collapsed, capped. */
function clean(s: string | undefined | null, max: number) {
  if (!s) return null;
  const text = decode(s.replace(/<[^>]*>/g, ' ')).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function meta(html: string, keys: string[]) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = /\b(?:property|name)\s*=\s*["']?([^"'\s>]+)/i.exec(tag)?.[1]?.toLowerCase();
    if (!key || !keys.includes(key)) continue;
    const content = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
    const value = content?.[1] ?? content?.[2] ?? content?.[3];
    if (value?.trim()) return value;
  }
  return null;
}

/** Fetches `href` (already validated as an absolute http(s) URL) and returns its name and description. */
export async function fetchSitePreview(href: string): Promise<SitePreview> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let url = new URL(href);
    for (let hop = 0; ; hop++) {
      checkUrl(url);
      const res = await get(url, controller.signal);
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume();
        if (hop >= MAX_REDIRECTS) throw new PreviewError('unreachable');
        url = new URL(res.headers.location, url);
        continue;
      }
      if (status < 200 || status >= 300) {
        res.resume();
        throw new PreviewError('unreachable');
      }
      const html = await readHtml(res);
      const head = html.split(/<\/head>/i)[0];
      const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1];
      const name = clean(meta(head, ['og:site_name', 'application-name']) ?? meta(head, ['og:title']) ?? title, 120);
      const description = clean(meta(head, ['og:description', 'description', 'twitter:description']), 220);
      return { url: url.href, host: url.hostname.replace(/^www\./, ''), name, description };
    }
  } catch (err) {
    if (err instanceof PreviewError) throw err;
    throw new PreviewError('unreachable');
  } finally {
    clearTimeout(timer);
  }
}
