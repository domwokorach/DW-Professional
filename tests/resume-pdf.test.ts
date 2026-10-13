import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchResumePdf, resumeFileId } from '../src/lib/resume-pdf.server';

const URL_ = 'https://drive.google.com/file/d/abc_123-X/view?usp=sharing';
const pdf = () => {
  const b = new Uint8Array(2048);
  b.set(new TextEncoder().encode('%PDF-1.6'));
  return b;
};
const reply = (body: BodyInit, status = 200) => (async () => new Response(body, { status })) as unknown as typeof fetch;

test('reads the file id from the share URL', () => {
  assert.equal(resumeFileId(URL_), 'abc_123-X');
  assert.equal(resumeFileId('https://example.com/x'), null);
});

test('returns the bytes of a real PDF', async () => {
  const r = await fetchResumePdf(reply(pdf() as BodyInit), URL_);
  assert.ok(r.ok && r.bytes.length === 2048);
});

test('rejects an HTML sign-in page served with status 200', async () => {
  const html = '<!doctype html><html>' + 'x'.repeat(3000) + '</html>';
  const r = await fetchResumePdf(reply(html), URL_);
  assert.ok(!r.ok && r.status === 502);
});

test('rejects JSON error bodies and tiny files', async () => {
  assert.ok(!(await fetchResumePdf(reply('{"error":"nope"}'), URL_)).ok);
  assert.ok(!(await fetchResumePdf(reply('%PDF-1.6'), URL_)).ok);
});

test('maps Drive 404, other failures and network errors safely', async () => {
  const a = await fetchResumePdf(reply('', 404), URL_);
  assert.ok(!a.ok && a.status === 404);
  const b = await fetchResumePdf(reply('', 500), URL_);
  assert.ok(!b.ok && b.status === 502);
  const c = await fetchResumePdf((async () => { throw new TypeError('network'); }) as unknown as typeof fetch, URL_);
  assert.ok(!c.ok && c.status === 502);
  const d = await fetchResumePdf((async () => { throw new DOMException('t', 'TimeoutError'); }) as unknown as typeof fetch, URL_);
  assert.ok(!d.ok && d.status === 504);
});
