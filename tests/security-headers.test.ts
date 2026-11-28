import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { POST } from '../src/app/api/csp-report/route';
import { parseReports } from '../src/lib/csp-report';
import { buildContentSecurityPolicy, cspReportOnlyHeaders, s3Origins } from '../src/lib/security-headers';

const directive = (policy: string, name: string) => policy.split('; ').find((d) => d.startsWith(`${name} `))?.slice(name.length + 1).split(' ') ?? [];

describe('Content-Security-Policy', () => {
  const production = buildContentSecurityPolicy({ development: false, env: {} });

  test('is restrictive by default and blocks plugins, base-tag and form hijacking', () => {
    assert.deepEqual(directive(production, 'default-src'), ["'self'"]);
    assert.deepEqual(directive(production, 'object-src'), ["'none'"]);
    assert.deepEqual(directive(production, 'base-uri'), ["'self'"]);
    assert.deepEqual(directive(production, 'form-action'), ["'self'"]);
    assert.deepEqual(directive(production, 'frame-ancestors'), ["'self'"]);
  });

  test('allows only the third-party origin the site really uses, for media only', () => {
    assert.ok(directive(production, 'img-src').includes('https://res.cloudinary.com'));
    assert.ok(directive(production, 'img-src').includes('https://cdn.meteocons.com'));
    assert.ok(directive(production, 'media-src').includes('https://res.cloudinary.com'));
    assert.ok(!directive(production, 'connect-src').includes('https://res.cloudinary.com'));
    for (const name of ['script-src', 'style-src', 'connect-src', 'frame-src']) assert.ok(!directive(production, name).some((v) => v.startsWith('https:') || v === '*'), name);
  });

  test("'unsafe-eval' is development-only", () => {
    assert.ok(!directive(production, 'script-src').includes("'unsafe-eval'"));
    assert.ok(directive(buildContentSecurityPolicy({ development: true, env: {} }), 'script-src').includes("'unsafe-eval'"));
  });

  test('presigned S3 uploads are allowed only to the configured bucket', () => {
    const env = { AWS_REGION: 'eu-west-2', AWS_S3_BUCKET_NAME: 'my-attachments' };
    assert.deepEqual(s3Origins(env), ['https://my-attachments.s3.eu-west-2.amazonaws.com']);
    assert.ok(directive(buildContentSecurityPolicy({ development: false, env }), 'connect-src').includes('https://my-attachments.s3.eu-west-2.amazonaws.com'));
    assert.deepEqual(s3Origins({ AWS_REGION: 'eu-west-2', AWS_S3_BUCKET_NAME: 'bad bucket;script-src *' }), []);
  });

  test('is delivered report-only, never enforced, with a reporting endpoint', () => {
    const headers = cspReportOnlyHeaders({ development: false, env: {} });
    assert.deepEqual(headers.map((h) => h.key), ['Content-Security-Policy-Report-Only', 'Reporting-Endpoints']);
    assert.ok(!headers.some((h) => h.key === 'Content-Security-Policy'));
    assert.match(headers[0].value, /report-uri \/api\/csp-report/);
  });
});

describe('CSP report parsing and endpoint', () => {
  test('parses both report formats and strips query strings', () => {
    const legacy = { 'csp-report': { 'effective-directive': 'img-src', 'blocked-uri': 'https://x.example/a.png?token=secret', 'document-uri': 'https://site.example/en-gb?email=a@b.c', disposition: 'report' } };
    const modern = [{ type: 'csp-violation', body: { effectiveDirective: 'script-src', blockedURL: 'inline', documentURL: 'https://site.example/', disposition: 'report' } }];
    assert.deepEqual(parseReports(legacy), [{ directive: 'img-src', blocked: 'https://x.example/a.png', page: 'https://site.example/en-gb', disposition: 'report' }]);
    assert.equal(parseReports(modern)[0].blocked, 'inline');
    assert.deepEqual(parseReports({ nonsense: true }), []);
    assert.equal(parseReports(Array.from({ length: 50 }, () => modern[0])).length, 10);
  });

  const post = (body: string, type = 'application/csp-report', extra: Record<string, string> = {}) =>
    POST(new Request('https://site.example/api/csp-report', { method: 'POST', body, headers: { 'content-type': type, ...extra } }));

  test('accepts a valid report with 204 and rejects wrong types, bad JSON and oversized bodies', async () => {
    const quiet = console.warn;
    console.warn = () => {};
    try {
      assert.equal((await post(JSON.stringify({ 'csp-report': { 'effective-directive': 'img-src' } }))).status, 204);
      assert.equal((await post('x', 'text/plain')).status, 415);
      assert.equal((await post('{not json')).status, 400);
      assert.equal((await post('x'.repeat(9000))).status, 413);
      assert.equal((await post('{}', 'application/json', { 'content-length': '99999' })).status, 413);
    } finally {
      console.warn = quiet;
    }
  });
});
