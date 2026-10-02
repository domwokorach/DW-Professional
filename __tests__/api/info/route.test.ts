import { NextRequest } from 'next/server';

const mockSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));
jest.mock('@vercel/blob', () => ({ del: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 5, retryAfterSeconds: 3600 }),
}));
jest.mock('@react-email/components', () => ({
  ...jest.requireActual('@react-email/components'),
  render: jest.fn().mockResolvedValue('<rendered/>'),
}));

import { POST } from '@/app/api/info/route';
import { checkRateLimit } from '@/lib/auth/rateLimit';

const VALID_FIELDS: Record<string, string> = {
  fullName: 'Amara Chen',
  email: 'Amara@Example.com',
  mobile: '07911 123456',
  mobileCountry: 'GB',
  company: 'Northwind Talent',
  projectType: 'recruitment',
  linkedinUrl: 'linkedin.com/in/amara',
  githubUrl: '',
  otherUrl: '',
  message: 'Hello!',
  submissionId: '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e',
  website: '',
};

function buildRequest(overrides: Record<string, string> = {}, startedAgoMs = 10_000) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...VALID_FIELDS, ...overrides })) form.set(key, value);
  if (!('startedAt' in overrides)) form.set('startedAt', String(Date.now() - startedAgoMs));
  return new NextRequest('http://localhost:3000/api/info', { method: 'POST', body: form });
}

describe('POST /api/info', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, RESEND_API_KEY: 'test-key', CONTACT_FROM_EMAIL: 'Site <no-reply@example.com>' };
    delete process.env.INFO_TO_EMAIL;
    mockSend.mockResolvedValue({ data: { id: 'email_1' }, error: null });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('emails a valid submission to Dominic with the visitor as reply-to and an idempotency key', async () => {
    const response = await POST(buildRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mockSend).toHaveBeenCalledTimes(1);
    const [payload, options] = mockSend.mock.calls[0];
    expect(payload.to).toEqual(['dominic.wokorach-o@outlook.com']);
    expect(payload.replyTo).toBe('amara@example.com');
    expect(payload.subject).toBe('New information from Amara Chen (Northwind Talent)');
    expect(payload.attachments).toBeUndefined();
    expect(options).toEqual({ idempotencyKey: `info-form/${VALID_FIELDS.submissionId}` });
  });

  it('rejects missing required fields with per-field errors and sends nothing', async () => {
    const response = await POST(buildRequest({ fullName: '', company: '', mobile: '' }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.fields).toEqual(
      expect.objectContaining({ fullName: expect.any(String), company: expect.any(String), mobile: expect.any(String) })
    );
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('rejects an invalid mobile number', async () => {
    const response = await POST(buildRequest({ mobile: '123' }));
    expect(response.status).toBe(400);
    expect((await response.json()).error.fields.mobile).toBeDefined();
  });

  it('rejects a LinkedIn URL on another domain and a non-http URL', async () => {
    const response = await POST(buildRequest({ linkedinUrl: 'https://evil.example.com/in/a', otherUrl: 'javascript:alert(1)' }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.fields.linkedinUrl).toMatch(/linkedin\.com/);
    expect(body.error.fields.otherUrl).toBeDefined();
  });

  it('silently drops submissions that fill the honeypot', async () => {
    const response = await POST(buildRequest({ website: 'https://spam.example' }));

    expect(response.status).toBe(200);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('rejects submissions sent implausibly fast after page load', async () => {
    const response = await POST(buildRequest({}, 500));

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('too_fast');
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('rejects messages stuffed with links', async () => {
    const response = await POST(buildRequest({ message: 'https://a.io https://b.io https://c.io https://d.io' }));
    expect(response.status).toBe(422);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('refuses attachment references outside the temp upload store', async () => {
    const response = await POST(
      buildRequest({
        attachmentUrl: 'https://attacker.example.com/contact-uploads/tmp/x.pdf',
        attachmentName: 'x.pdf',
        attachmentType: 'application/pdf',
        attachmentSize: '100',
      })
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('invalid_attachment');
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockResolvedValueOnce({ allowed: false, remaining: 0, retryAfterSeconds: 60 });
    const response = await POST(buildRequest());
    expect(response.status).toBe(429);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('reports a provider failure as an error so the visitor can retry', async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { name: 'application_error', message: 'down' } });
    const response = await POST(buildRequest());
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe('email_send_failed');
  });
});
