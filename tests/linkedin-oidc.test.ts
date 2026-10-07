import assert from 'node:assert/strict';
import { createSign, generateKeyPairSync } from 'node:crypto';
import { after, test } from 'node:test';
import { verifyIdToken } from '../src/lib/linkedin.server';

const previous = {
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  baseUrl: process.env.LINKEDIN_OIDC_BASE_URL,
  fetch: globalThis.fetch,
};
process.env.LINKEDIN_CLIENT_ID = 'test-client';
process.env.LINKEDIN_CLIENT_SECRET = 'test-secret';
process.env.LINKEDIN_OIDC_BASE_URL = 'https://linkedin-oidc.test';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', use: 'sig', alg: 'RS256' };
globalThis.fetch = async () => Response.json({ keys: [jwk] });

after(() => {
  for (const [key, value] of [
    ['LINKEDIN_CLIENT_ID', previous.clientId],
    ['LINKEDIN_CLIENT_SECRET', previous.clientSecret],
    ['LINKEDIN_OIDC_BASE_URL', previous.baseUrl],
  ] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  globalThis.fetch = previous.fetch;
});

function token(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const message = `${encode({ alg: 'RS256', kid: 'test-key' })}.${encode({
    iss: 'https://linkedin-oidc.test', aud: 'test-client', sub: 'member-123',
    iat: now, exp: now + 300, nonce: 'expected-nonce', name: 'Example Candidate', ...overrides,
  })}`;
  const signature = createSign('RSA-SHA256').update(message).sign(privateKey).toString('base64url');
  return `${message}.${signature}`;
}

test('accepts a correctly signed LinkedIn ID token with the published issuer', async () => {
  const identity = await verifyIdToken(token(), 'expected-nonce');
  assert.equal(identity.memberId, 'member-123');
  assert.equal(identity.name, 'Example Candidate');
  assert.equal(identity.email, null);
});

test('rejects wrong issuer, expired token, missing issued-at and wrong nonce', async () => {
  for (const changes of [
    { iss: 'https://linkedin-oidc.test/oauth' },
    { exp: Math.floor(Date.now() / 1000) - 1 },
    { iat: null },
    { nonce: 'different-nonce' },
  ]) {
    await assert.rejects(verifyIdToken(token(changes), 'expected-nonce'));
  }
});
