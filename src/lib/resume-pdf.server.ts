import { RESUME_URL } from '@/config';

export const RESUME_FILENAME = 'Dominic_Wokorach_Resume.pdf';
const MAX_BYTES = 10 * 1024 * 1024;
const TIMEOUT_MS = 10_000;

export type ResumePdfResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; status: 404 | 502 | 504; message: string };

/** The Drive file id is taken from RESUME_URL so the site keeps a single source of truth. */
export function resumeFileId(url: string = RESUME_URL): string | null {
  return /\/file\/d\/([\w-]+)/.exec(url)?.[1] ?? null;
}

const hasPdfSignature = (b: Uint8Array) =>
  b.length > 1024 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d; // "%PDF-"

/**
 * Fetches the résumé bytes from Google Drive and returns them only if they really are a PDF. Drive answers with
 * an HTML sign-in or error page (often with status 200) when sharing is off, so the body is checked, not the status.
 */
export async function fetchResumePdf(fetchImpl: typeof fetch = fetch, url: string = RESUME_URL): Promise<ResumePdfResult> {
  const id = resumeFileId(url);
  if (!id) return { ok: false, status: 502, message: 'The résumé is not configured.' };
  try {
    const res = await fetchImpl(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`, {
      cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 404) return { ok: false, status: 404, message: 'The résumé file could not be found.' };
    if (!res.ok) return { ok: false, status: 502, message: 'Google Drive could not provide the résumé.' };
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > MAX_BYTES || !hasPdfSignature(bytes)) {
      return { ok: false, status: 502, message: 'The résumé is not available to download right now.' };
    }
    return { ok: true, bytes };
  } catch (error) {
    const timedOut = error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError');
    return { ok: false, status: timedOut ? 504 : 502, message: 'Google Drive could not be reached.' };
  }
}
