describe('src/lib/auth/env', () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  it('getAccessTokenSecret returns the configured secret', () => {
    process.env = { ...ORIGINAL_ENV, JWT_ACCESS_SECRET: 'a-real-secret' };
    const { getAccessTokenSecret } = require('@/lib/auth/env');
    expect(getAccessTokenSecret()).toBe('a-real-secret');
  });

  it('getAccessTokenSecret throws when JWT_ACCESS_SECRET is not configured', () => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.JWT_ACCESS_SECRET;
    jest.resetModules();
    const { getAccessTokenSecret } = require('@/lib/auth/env');
    expect(() => getAccessTokenSecret()).toThrow('JWT_ACCESS_SECRET is not configured');
  });

  it('getTokenHashPepper throws when TOKEN_HASH_PEPPER is not configured', () => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.TOKEN_HASH_PEPPER;
    jest.resetModules();
    const { getTokenHashPepper } = require('@/lib/auth/env');
    expect(() => getTokenHashPepper()).toThrow('TOKEN_HASH_PEPPER is not configured');
  });

  it('getTokenHashPepper returns the configured pepper', () => {
    process.env = { ...ORIGINAL_ENV, TOKEN_HASH_PEPPER: 'a-real-pepper' };
    const { getTokenHashPepper } = require('@/lib/auth/env');
    expect(getTokenHashPepper()).toBe('a-real-pepper');
  });

  it('isProduction reflects NODE_ENV === "production"', () => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'production' };
    const prodModule = require('@/lib/auth/env');
    expect(prodModule.isProduction()).toBe(true);

    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'test' };
    const testModule = require('@/lib/auth/env');
    expect(testModule.isProduction()).toBe(false);
  });
});
