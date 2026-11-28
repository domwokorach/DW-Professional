/**
 * Content-Security-Policy for the portfolio. It is served in REPORT-ONLY mode first: browsers report what the
 * policy would have blocked (to /api/csp-report) without blocking anything, so it can be tuned against real traffic
 * before it is enforced. See SECURITY.md for the path to enforcement.
 *
 * Scripts still allow 'unsafe-inline': the site is statically rendered, so Next.js' inline bootstrap data and the
 * theme-init script cannot carry a per-request nonce. Moving to a nonce or hash policy means rendering pages
 * dynamically; that is a separate, deliberate change. Every other directive is restrictive.
 */

export const CSP_REPORT_PATH = '/api/csp-report';

const unique = (values: (string | undefined | false)[]) => [...new Set(values.filter((v): v is string => Boolean(v)))];

/** Origins the browser may upload attachments and avatars to with a presigned URL (the private S3 bucket). */
export function s3Origins(env: Record<string, string | undefined> = process.env): string[] {
  const endpoint = env.AWS_S3_ENDPOINT;
  const origins: string[] = [];
  if (endpoint) {
    try { origins.push(new URL(endpoint).origin); } catch { /* ignore a malformed endpoint */ }
  }
  const region = env.AWS_REGION;
  for (const bucket of [env.AWS_S3_BUCKET_NAME]) {
    if (bucket && region && /^[a-z0-9.-]{3,63}$/.test(bucket) && /^[a-z0-9-]+$/.test(region)) origins.push(`https://${bucket}.s3.${region}.amazonaws.com`);
  }
  return origins;
}

export function buildContentSecurityPolicy({ development = process.env.NODE_ENV !== 'production', env = process.env }: { development?: boolean; env?: Record<string, string | undefined> } = {}): string {
  const cloudinary = 'https://res.cloudinary.com';
  /** Weather icons shown in the contact section (observed as a real violation in the first report-only sweep). */
  const meteocons = 'https://cdn.meteocons.com';
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // 'wasm-unsafe-eval' lets the Draco/WebAssembly decoders compile; 'unsafe-eval' is development-only (React refresh).
    'script-src': unique(["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", development && "'unsafe-eval'"]),
    // Inline styles: Next.js, Motion and the SVG graph set style attributes; the sandboxed email previews carry inline CSS.
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', cloudinary, meteocons],
    'media-src': ["'self'", 'blob:', cloudinary],
    'font-src': ["'self'", 'data:'],
    // Browser-side requests go to this origin; presigned S3 uploads go to the bucket.
    'connect-src': unique(["'self'", ...s3Origins(env), development && 'ws:']),
    'worker-src': ["'self'", 'blob:'],
    // PDF certificate previews and the sandboxed email previews (srcdoc) are same-origin frames.
    'frame-src': ["'self'"],
    'frame-ancestors': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'manifest-src': ["'self'"],
    'report-uri': [CSP_REPORT_PATH],
    'report-to': ['csp'],
  };
  return Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`).join('; ');
}

/** Response headers that put the policy in report-only mode and tell the browser where to send reports. */
export function cspReportOnlyHeaders(options?: Parameters<typeof buildContentSecurityPolicy>[0]) {
  return [
    { key: 'Content-Security-Policy-Report-Only', value: buildContentSecurityPolicy(options) },
    { key: 'Reporting-Endpoints', value: `csp="${CSP_REPORT_PATH}"` },
  ];
}
