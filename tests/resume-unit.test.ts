import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { parseDevice, UNKNOWN_MODEL } from '../src/lib/device';
import { cleanResume, displayStatus, DISPLAY_STATUSES, validateResume } from '../src/lib/resume-access';
import { hashGrant, hashPin, hashToken, newPin, newToken, sameHash } from '../src/lib/resume-crypto.server';
import { renderResumeEmail } from '../src/lib/resume-email.server';

test('form validation: all three fields are required, trimmed and checked', () => {
  assert.deepEqual(Object.keys(validateResume({ fullName: '', email: '', company: '' })).sort(), ['company', 'email', 'fullName']);
  assert.ok(validateResume({ fullName: 'Jo', email: 'not-an-email', company: 'Acme' }).email);
  assert.ok(validateResume({ fullName: 'Jo\u0000x', email: 'a@b.co', company: 'Acme' }).fullName);
  assert.ok(validateResume({ fullName: 'x'.repeat(101), email: 'a@b.co', company: 'Acme' }).fullName);
  assert.ok(validateResume({ fullName: '   ', email: 'a@b.co', company: 'Acme' }).fullName);
  assert.deepEqual(validateResume({ fullName: 'Jane Smith', email: 'jane@acme.com', company: 'Acme Ltd' }), {});
  assert.deepEqual(cleanResume({ fullName: '  Jane   Smith ', email: ' Jane@Acme.COM ', company: ' Acme  Ltd ' }),
    { fullName: 'Jane Smith', email: 'Jane@Acme.COM', emailKey: 'jane@acme.com', company: 'Acme Ltd' });
});

test('admin statuses: the six required labels, derived expiry, and no approval status', () => {
  assert.deepEqual(DISPLAY_STATUSES, ['Pending Verification', 'Email Sent', 'Verified', 'Downloaded', 'Expired', 'Delivery Failed']);
  const past = new Date(Date.now() - 1000);
  const future = new Date(Date.now() + 60000);
  assert.equal(displayStatus('PENDING_VERIFICATION', future), 'Pending Verification');
  assert.equal(displayStatus('EMAIL_SENT', future), 'Email Sent');
  assert.equal(displayStatus('EMAIL_SENT', past), 'Expired');
  assert.equal(displayStatus('VERIFIED', past), 'Verified');
  assert.equal(displayStatus('DOWNLOADED', past), 'Downloaded');
  assert.equal(displayStatus('DELIVERY_FAILED', past), 'Delivery Failed');
  assert.ok(!DISPLAY_STATUSES.some((s) => /approv/i.test(s)));
});

test('device detection: families, browsers and honest fallbacks', () => {
  const iphone = parseDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1');
  assert.deepEqual([iphone.deviceType, iphone.os, iphone.browser, iphone.deviceModel], ['Mobile', 'iOS', 'Safari', 'Apple iPhone']);
  const ipad = parseDevice('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1');
  assert.deepEqual([ipad.deviceType, ipad.deviceModel, ipad.browser], ['Tablet', 'Apple iPad', 'Chrome']);
  const samsung = parseDevice('Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36');
  assert.equal(samsung.deviceModel, 'Samsung Galaxy (SM-S918B)');
  assert.equal(samsung.os, 'Android');
  assert.equal(parseDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36').deviceModel, 'Google Pixel 8');
  assert.equal(parseDevice('Mozilla/5.0 (Linux; Android 12; Nokia G21) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36').deviceModel, 'Nokia G21');
  // Chrome's reduced User-Agent hides the model: say so rather than guess.
  assert.equal(parseDevice('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36').deviceModel, UNKNOWN_MODEL);
  // A Client Hint model is used when the browser volunteers it.
  assert.equal(parseDevice('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36', { model: '"Pixel 7"' }).deviceModel, 'Google Pixel 7');
  const win = parseDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 Edg/124.0');
  assert.deepEqual([win.deviceType, win.os, win.browser], ['Desktop', 'Windows', 'Edge']);
  assert.equal(parseDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15').browser, 'Safari');
  assert.equal(parseDevice('Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0').browser, 'Firefox');
  assert.deepEqual(parseDevice(null), { deviceType: 'Unknown', deviceModel: UNKNOWN_MODEL, os: 'Unknown OS', browser: 'Other browser' });
});

test('secrets: random PIN and token, keyed hashes, constant-time compare, no plaintext equality', () => {
  for (let i = 0; i < 200; i++) assert.match(newPin(), /^\d{6}$/);
  assert.notEqual(newToken(), newToken());
  assert.match(newToken(), /^[A-Za-z0-9_-]{43}$/);
  const pin = '012345';
  assert.notEqual(hashPin('a', pin), pin);
  assert.notEqual(hashPin('a', pin), hashPin('b', pin), 'bound to the record');
  assert.ok(sameHash(hashPin('a', pin), hashPin('a', pin)));
  assert.ok(!sameHash(hashPin('a', pin), hashPin('a', '012346')));
  assert.ok(!sameHash(null, hashToken('x')));
  assert.notEqual(hashToken('x'), hashGrant('x'), 'purposes are separated');
});

test('verification email: shows the PIN and link, escapes the name, states the expiry', () => {
  const { html, text } = renderResumeEmail({ fullName: '<b>Eve</b> Smith', pin: '123456', verifyUrl: 'https://example.com/en-gb/resume/verify#t=abc', minutes: 10, siteUrl: 'https://example.com' });
  assert.ok(html.includes('123456') && text.includes('123456'));
  assert.ok(!html.includes('<b>Eve</b>'));
  assert.ok(html.includes('&lt;b&gt;Eve') );
  assert.ok(text.includes('#t=abc') && text.includes('10 minutes'));
});

test('browser code never imports server modules or the hash secret', () => {
  const dirs = ['src/components/resume', 'src/views/resume', 'src/components/admin/ResumeRequestsTable.tsx'];
  const files: string[] = [];
  const walk = (p: string) => { try { readdirSync(p).forEach((f) => walk(join(p, f))); } catch { files.push(p); } };
  dirs.forEach(walk);
  assert.ok(files.length >= 5);
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    assert.ok(!/\.server['"]/.test(src.replace(/import type[^;]*;/g, '')), `${f} imports a server module`);
    assert.ok(!/RESUME_HASH_SECRET|process\.env/.test(src), `${f} touches secrets`);
  }
});

test('no public résumé link remains in the source', () => {
  const grep = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? grep(p) : /\.(tsx?|css)$/.test(e.name) && /drive\.google\.com/.test(readFileSync(p, 'utf8')) ? [p] : [];
  });
  assert.deepEqual(grep('src'), []);
  assert.ok(!/drive\.google\.com|RESUME_URL/.test(readFileSync('next.config.ts', 'utf8')));
});
