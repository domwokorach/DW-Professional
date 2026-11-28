// Parsing for Content-Security-Policy violation reports (legacy `report-uri` and Reporting API formats).

export type Violation = { directive: string; blocked: string; page: string; disposition: string };

/** Keeps only the origin and path of a URL: query strings and fragments can carry personal data. */
function scrub(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  if (/^(inline|eval|data|blob|wasm-eval|trusted-types-policy|trusted-types-sink)$/.test(value)) return value;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.slice(0, 200);
  } catch {
    return value.replace(/[^\w:./-]/g, '').slice(0, 60);
  }
}

/** Normalises both report formats: the legacy `csp-report` object and the Reporting API array. */
export function parseReports(payload: unknown): Violation[] {
  const rows: unknown[] = Array.isArray(payload) ? payload : [payload];
  const out: Violation[] = [];
  for (const row of rows.slice(0, 10)) {
    const body = (row as { type?: unknown; body?: unknown } | null)?.type === 'csp-violation' ? (row as { body: Record<string, unknown> }).body : (row as { 'csp-report'?: Record<string, unknown> } | null)?.['csp-report'];
    if (!body || typeof body !== 'object') continue;
    const directive = String(body['effectiveDirective'] ?? body['effective-directive'] ?? body['violated-directive'] ?? '').slice(0, 40);
    if (!directive) continue;
    out.push({
      directive,
      blocked: scrub(body['blockedURL'] ?? body['blocked-uri']),
      page: scrub(body['documentURL'] ?? body['document-uri']),
      disposition: String(body['disposition'] ?? 'report').slice(0, 10),
    });
  }
  return out;
}
