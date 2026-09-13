import { checkRateLimit } from '@/lib/auth/rateLimit';

function uniqueKey(prefix: string): string {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

describe('checkRateLimit', () => {
  it('allows the first call within a fresh key, with remaining = limit - 1', async () => {
    const key = uniqueKey('fresh');
    const result = await checkRateLimit(key, 5, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('rejects calls once the limit within the window is exceeded', async () => {
    const key = uniqueKey('exceed');
    const limit = 3;

    for (let i = 0; i < limit; i++) {
      const result = await checkRateLimit(key, limit, 60);
      expect(result.allowed).toBe(true);
    }

    const overLimit = await checkRateLimit(key, limit, 60);
    expect(overLimit.allowed).toBe(false);
  });

  it('never lets remaining go negative even far past the limit', async () => {
    const key = uniqueKey('negative');
    const limit = 2;

    for (let i = 0; i < 10; i++) {
      const result = await checkRateLimit(key, limit, 60);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    }
  });
});
