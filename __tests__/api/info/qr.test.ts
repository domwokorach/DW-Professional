import { getInfoFormUrl } from '@/lib/info/qr';

describe('getInfoFormUrl', () => {
  const originalEnv = process.env;
  const setEnv = (env: Record<string, string | undefined>) => {
    process.env = { ...originalEnv, ...env } as NodeJS.ProcessEnv;
  };

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses the deployed APP_URL in production, whatever host served the request', () => {
    setEnv({ NODE_ENV: 'production', APP_URL: 'https://www.dominicwokorach.me/', NEXT_PUBLIC_APP_URL: undefined });
    expect(getInfoFormUrl('http://localhost:3000')).toBe('https://www.dominicwokorach.me/info');
  });

  it('falls back to the live domain in production when APP_URL is missing', () => {
    setEnv({ NODE_ENV: 'production', APP_URL: undefined, NEXT_PUBLIC_APP_URL: undefined });
    expect(getInfoFormUrl('https://preview.example.com')).toBe('https://www.dominicwokorach.me/info');
  });

  it('uses the request origin in development so a dev QR opens the local server', () => {
    setEnv({ NODE_ENV: 'development', APP_URL: 'https://www.dominicwokorach.me' });
    expect(getInfoFormUrl('http://localhost:3000')).toBe('http://localhost:3000/info');
  });
});
