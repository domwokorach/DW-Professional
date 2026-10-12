// Admin sign-in building blocks: password hashing/verification, post-login redirect safety and the email key used by
// the login throttle. (The route itself needs Next's request context; it is exercised over HTTP in docs/ADMIN notes.)
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { hashPassword, passwordProblem, verifyPassword } from '../src/lib/admin/password.server';
import { safeNext } from '../src/lib/admin/session.server';
import { emailHash } from '../src/lib/admin/login-throttle.server';

describe('passwords', () => {
  test('the right password verifies; a wrong one, an empty one and a missing hash do not', async () => {
    const stored = await hashPassword('correct horse battery staple');
    assert.match(stored, /^\$argon2id\$/);
    assert.equal(await verifyPassword(stored, 'correct horse battery staple'), true);
    assert.equal(await verifyPassword(stored, 'correct horse battery stapl'), false);
    assert.equal(await verifyPassword(stored, ''), false);
    assert.equal(await verifyPassword(null, 'correct horse battery staple'), false);
    assert.equal(await verifyPassword('not-a-hash', 'anything'), false);
  });
  test('short passwords are refused when an account is created or reset', () => {
    assert.ok(passwordProblem('short'));
    assert.equal(passwordProblem('long enough password'), undefined);
  });
});

describe('email handling', () => {
  test('the throttle key ignores case and surrounding whitespace, so upper-case emails share one counter', () => {
    assert.equal(emailHash(' Admin@Example.COM '), emailHash('admin@example.com'));
    assert.notEqual(emailHash('a@example.com'), emailHash('b@example.com'));
  });
});

describe('post-login redirect', () => {
  test('only same-site admin paths are accepted, never the login page or another origin', () => {
    assert.equal(safeNext('/admin/sessions'), safeNext('/admin/sessions'));
    assert.notEqual(safeNext('/admin/sessions'), safeNext('https://evil.example'));
    for (const bad of ['https://evil.example', '//evil.example', '/admin/login', '/elsewhere', '/admin/../x?y=<s>', undefined, 42]) {
      assert.ok(safeNext(bad).startsWith('/admin') && !safeNext(bad).startsWith('/admin/login'), String(bad));
    }
    assert.equal(safeNext('/admin/sessions'), '/admin/sessions');
  });
});
