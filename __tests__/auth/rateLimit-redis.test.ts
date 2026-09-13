jest.mock('@/lib/redis/client');

import { checkRateLimit } from '@/lib/auth/rateLimit';
import { getRedisClient } from '@/lib/redis/client';

describe('checkRateLimit with Redis configured', () => {
  it('uses INCR/EXPIRE/TTL against the redis client when getRedisClient() returns one', async () => {
    const fakeRedis = {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      ttl: jest.fn().mockResolvedValue(60),
    };
    (getRedisClient as jest.Mock).mockReturnValue(fakeRedis);

    const result = await checkRateLimit('sign-in:ip:203.0.113.5', 5, 60);

    expect(fakeRedis.incr).toHaveBeenCalledWith('ratelimit:sign-in:ip:203.0.113.5');
    expect(fakeRedis.expire).toHaveBeenCalledWith('ratelimit:sign-in:ip:203.0.113.5', 60);
    expect(result).toEqual({ allowed: true, remaining: 4, retryAfterSeconds: 60 });
  });

  it('does not re-arm the TTL on subsequent calls within the window, and rejects once over the limit', async () => {
    const fakeRedis = {
      incr: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(3),
      expire: jest.fn().mockResolvedValue(1),
      ttl: jest.fn().mockResolvedValue(30),
    };
    (getRedisClient as jest.Mock).mockReturnValue(fakeRedis);

    await checkRateLimit('k', 2, 60);
    await checkRateLimit('k', 2, 60);
    const third = await checkRateLimit('k', 2, 60);

    expect(fakeRedis.expire).toHaveBeenCalledTimes(1);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it('falls back to the window length when redis reports no TTL', async () => {
    const fakeRedis = {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      ttl: jest.fn().mockResolvedValue(-1),
    };
    (getRedisClient as jest.Mock).mockReturnValue(fakeRedis);

    const result = await checkRateLimit('no-ttl-key', 5, 45);
    expect(result.retryAfterSeconds).toBe(45);
  });
});
