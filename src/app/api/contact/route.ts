import {
  FILE_TOO_LARGE,
  MAX_FILE_BYTES,
  matchesSignature,
  safeFilename,
  validateFields,
  validateFile,
  type ContactErrors,
  type ContactFields,
} from '@/lib/contact';
import { getResend } from '@/lib/resend.server';
import { renderEnquiryEmail } from '@/lib/enquiry-email.server';
import { deleteUpload, DOWNLOAD_URL_TTL, isUploadKey, presignDownload, verifyUpload } from '@/lib/s3.server';
import { CONTENT_TYPES, extensionOf, formatBytes } from '@/lib/contact';
import { setEmailStatus, storeEnquiry, type CompanyMeta, type MediaMeta } from '@/lib/contact-store.server';
import { normaliseCompanyNumber } from '@/lib/companies';
import { lookupCompany } from '@/lib/company-lookup.server';
import { randomUUID } from 'node:crypto';

// Soft per-instance rate limit (instances are reused under Fluid Compute, so this
// stops bursts; it is not a global guarantee).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  // Drop stale entries now and then so the table can't grow without bound.
  if (hits.size > 500) hits.forEach((times, key) => { if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key); });
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const json = (body: unknown, status: number) => Response.json(body, { status });
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();
const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
};

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) return json({ error: 'rate_limited' }, 429);

  if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
    return json({ error: 'invalid_request' }, 400);
  }
  // Reject oversized bodies before parsing (file limit plus room for the text fields).
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_FILE_BYTES + 64 * 1024) return json({ errors: { file: FILE_TOO_LARGE } }, 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }

  // Honeypot: real visitors never see or fill this field.
  if (text(form, 'website')) return json({ error: 'invalid_request' }, 400);

  const fields: ContactFields = {
    fullName: text(form, 'fullName').trim(),
    email: text(form, 'email').trim(),
    mobileNumber: text(form, 'mobileNumber').trim(),
    company: text(form, 'company').trim(),
    projectType: text(form, 'projectType').trim(),
    message: text(form, 'message').trim(),
  };
  const errors: ContactErrors = validateFields(fields);

  let attachment: { filename: string; content: string } | undefined;
  let attachedBytes = 0;
  // Either a file already uploaded to S3 (the form sends its key), or a file in this request.
  let linked: { key: string; filename: string; size: number; url: string } | undefined;
  const fileKey = text(form, 'fileKey');
  const file = form.get('file');
  if (fileKey) {
    const filename = safeFilename(text(form, 'fileName') || fileKey);
    const size = isUploadKey(fileKey) ? await verifyUpload(fileKey) : null;
    if (size === null) {
      await deleteUpload(fileKey);
      errors.file = "We couldn't verify that file. Please choose it again and resend.";
    } else {
      try {
        linked = { key: fileKey, filename, size, url: await presignDownload(fileKey, filename) };
      } catch (err) {
        console.error('[contact] Could not create download link:', (err as Error).name);
        return json({ error: 'send_failed' }, 502);
      }
    }
  } else if (file && typeof file !== 'string' && file.size > 0) {
    const fileError = validateFile(file, MAX_FILE_BYTES);
    if (fileError) {
      errors.file = fileError;
    } else {
      const content = Buffer.from(await file.arrayBuffer());
      if (!matchesSignature(file.name, content.subarray(0, 16))) {
        errors.file = "That file doesn't look like the type its name suggests. Please upload a PDF, DOC, DOCX, PNG, JPG or WEBP file.";
      } else {
        // Base64 is Resend's documented string form; a raw Buffer would be JSON-serialised as {type,data}.
        attachment = { filename: safeFilename(file.name), content: content.toString('base64') };
        attachedBytes = content.length;
      }
    }
  }
  if (Object.keys(errors).length) return json({ errors }, 400);

  // A company picked from the Company field's suggestions. Only the number is taken from the
  // browser; status and address are looked up here. Optional: an unknown or unverifiable number
  // never blocks the enquiry, and a name typed by hand is sent as it is.
  let company: CompanyMeta | undefined;
  const companyNumber = fields.company ? normaliseCompanyNumber(text(form, 'companyNumber')) : null;
  if (companyNumber) {
    const found = await lookupCompany(companyNumber);
    company = {
      companyNumber,
      companyStatus: typeof found === 'object' && found ? found.company.companyStatus : null,
      companyAddress: typeof found === 'object' && found ? found.company.address : null,
    };
  }

  // The form sends one id per submission attempt and reuses it on retry; it keys both the stored
  // row and the email, so retrying never duplicates either.
  const sent = text(form, 'submissionId');
  const submissionId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sent) ? sent : randomUUID();
  const media: MediaMeta | undefined = linked && {
    key: linked.key,
    filename: linked.filename,
    mimeType: CONTENT_TYPES[extensionOf(linked.key) as keyof typeof CONTENT_TYPES],
    size: linked.size,
  };
  const enquiry = await storeEnquiry(submissionId, fields, media, company);
  if (enquiry?.emailStatus === 'SENT') return json({ ok: true }, 200);

  const resend = getResend();
  const to = process.env.CONTACT_TO_EMAIL;
  if (!resend || !to) {
    await setEmailStatus(enquiry, 'FAILED');
    console.error('[contact] Email is not configured: set RESEND_API_KEY and CONTACT_TO_EMAIL.');
    return json({ error: 'unavailable' }, 503);
  }

  const { html, text: body } = renderEnquiryEmail({
    fields,
    company,
    attachment: linked
      ? { filename: linked.filename, sizeLabel: formatBytes(linked.size), url: linked.url, expiresInDays: DOWNLOAD_URL_TTL / 86400 }
      : attachment
        ? { filename: attachment.filename, sizeLabel: formatBytes(attachedBytes) }
        : undefined,
    reference: submissionId.slice(0, 8).toUpperCase(),
    submittedAt: new Date(),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dominicwokorach.me',
  });

  try {
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>',
      to: [to],
      replyTo: fields.email,
      subject: oneLine(`New enquiry: ${fields.projectType} — ${fields.fullName}`).slice(0, 150),
      text: body,
      html,
      attachments: attachment ? [attachment] : undefined,
    }, { idempotencyKey: `contact-${submissionId}` });
    if (error) {
      console.error('[contact] Resend rejected the email:', error.name, error.message);
      await setEmailStatus(enquiry, 'FAILED');
      return json({ error: 'send_failed' }, 502);
    }
  } catch (err) {
    console.error('[contact] Sending failed:', (err as Error).name);
    await setEmailStatus(enquiry, 'FAILED');
    return json({ error: 'send_failed' }, 502);
  }

  await setEmailStatus(enquiry, 'SENT');
  return json({ ok: true }, 200);
}
