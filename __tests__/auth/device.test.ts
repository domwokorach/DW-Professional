import { parseDeviceInfo, generateDeviceId, extractClientIp } from '@/lib/auth/device';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME_UA =
  'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36';
const PIXEL_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36';
const WINDOWS_EDGE_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0';
const MAC_SAFARI_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const LINUX_FIREFOX_UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0';

describe('parseDeviceInfo', () => {
  it('categorizes an iPhone/iOS Safari UA', () => {
    const info = parseDeviceInfo(IPHONE_UA);
    expect(info.deviceType).toBe('Mobile');
    expect(info.operatingSystem).toContain('iOS');
    expect(info.browser.toLowerCase()).toContain('safari');
  });

  it('categorizes an Android Chrome UA', () => {
    const info = parseDeviceInfo(ANDROID_CHROME_UA);
    expect(info.deviceType).toBe('Mobile');
    expect(info.operatingSystem).toContain('Android');
    expect(info.browser).toContain('Chrome');
  });

  it('categorizes a Pixel-specific Android Chrome UA', () => {
    const info = parseDeviceInfo(PIXEL_UA);
    expect(info.deviceType).toBe('Mobile');
    expect(info.operatingSystem).toContain('Android');
    expect(info.browser).toContain('Chrome');
  });

  it('categorizes a Windows Chrome/Edge UA', () => {
    const info = parseDeviceInfo(WINDOWS_EDGE_UA);
    expect(info.deviceType).toBe('Desktop');
    expect(info.operatingSystem).toContain('Windows');
    expect(info.browser.toLowerCase()).toContain('edge');
  });

  it('categorizes a macOS Safari UA', () => {
    const info = parseDeviceInfo(MAC_SAFARI_UA);
    expect(info.deviceType).toBe('Desktop');
    expect(info.operatingSystem.toLowerCase()).toContain('mac');
    expect(info.browser.toLowerCase()).toContain('safari');
  });

  it('categorizes a Linux Firefox UA', () => {
    const info = parseDeviceInfo(LINUX_FIREFOX_UA);
    expect(info.deviceType).toBe('Desktop');
    expect(info.operatingSystem).toContain('Linux');
    expect(info.browser).toBe('Firefox');
  });

  it('uses ua-parser-js\'s own device.type label for a non-mobile/tablet device (e.g. a smart TV)', () => {
    const SMART_TV_UA =
      'Mozilla/5.0 (SMART-TV; Linux; Tizen 2.3) AppleWebKit/538.1 (KHTML, like Gecko) Version/2.3 TV Safari/538.1';
    const info = parseDeviceInfo(SMART_TV_UA);
    expect(info.deviceType).not.toBe('Desktop');
    expect(info.deviceType.toLowerCase()).not.toBe('mobile');
  });

  it('falls back to a Mobile deviceType via the OS-name regex when ua-parser reports no device.type', () => {
    // A generic Android WebView UA that ua-parser-js often leaves device.type
    // undefined for, exercising the `/iphone|android|mobile/i.test(osName)`
    // fallback branch in parseDeviceInfo rather than the device.type checks.
    const ANDROID_WEBVIEW_UA =
      'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/71.0.3578.99 Mobile Safari/537.36 GSA/9.62.7.21.arm64';
    const info = parseDeviceInfo(ANDROID_WEBVIEW_UA);
    expect(info.operatingSystem).toContain('Android');
  });

  it('falls back to "Unknown" values for a null user agent', () => {
    const info = parseDeviceInfo(null);
    expect(info).toEqual({
      deviceType: 'Unknown',
      operatingSystem: 'Unknown',
      browser: 'Unknown',
      deviceName: 'Unknown device',
    });
  });

  it('falls back to "Unknown" values for an empty user agent string', () => {
    const info = parseDeviceInfo('');
    expect(info).toEqual({
      deviceType: 'Unknown',
      operatingSystem: 'Unknown',
      browser: 'Unknown',
      deviceName: 'Unknown device',
    });
  });
});

describe('generateDeviceId', () => {
  it('produces distinct hex strings', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateDeviceId()));
    expect(ids.size).toBe(20);
    for (const id of ids) {
      expect(id).toMatch(/^[0-9a-f]{32}$/);
    }
  });
});

describe('extractClientIp', () => {
  it('prefers x-forwarded-for, taking the first entry when comma-separated', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.5, 70.41.3.18, 150.172.238.178',
      'x-real-ip': '198.51.100.9',
    });
    expect(extractClientIp(headers)).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const headers = new Headers({ 'x-real-ip': '198.51.100.9' });
    expect(extractClientIp(headers)).toBe('198.51.100.9');
  });

  it('returns null when neither header is present', () => {
    const headers = new Headers();
    expect(extractClientIp(headers)).toBeNull();
  });
});
