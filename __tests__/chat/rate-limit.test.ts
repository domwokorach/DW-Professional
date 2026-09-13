import { isRateLimited } from '@/lib/utils/rate-limit';
import { RATE_LIMIT_MAX_MESSAGES } from '@/lib/chat/constants';

describe('isRateLimited', () => {
  it('allows requests under the limit', () => {
    const key = `rate-limit-test-under-${Date.now()}`;
    for (let i = 0; i < RATE_LIMIT_MAX_MESSAGES - 1; i++) {
      expect(isRateLimited(key)).toBe(false);
    }
  });

  it('trips after RATE_LIMIT_MAX_MESSAGES within the window', () => {
    const key = `rate-limit-test-trip-${Date.now()}`;
    for (let i = 0; i < RATE_LIMIT_MAX_MESSAGES; i++) {
      expect(isRateLimited(key)).toBe(false);
    }
    // The next call within the same window should be rate limited.
    expect(isRateLimited(key)).toBe(true);
  });

  it('tracks distinct keys independently', () => {
    const keyA = `rate-limit-test-a-${Date.now()}`;
    const keyB = `rate-limit-test-b-${Date.now()}`;

    for (let i = 0; i < RATE_LIMIT_MAX_MESSAGES; i++) {
      isRateLimited(keyA);
    }

    expect(isRateLimited(keyA)).toBe(true);
    expect(isRateLimited(keyB)).toBe(false);
  });
});
