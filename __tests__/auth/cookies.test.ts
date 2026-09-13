import { NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  DEVICE_COOKIE,
  setAccessCookie,
  setRefreshCookie,
  setDeviceCookie,
  clearAuthCookies,
} from '@/lib/auth/cookies';

describe('auth cookies', () => {
  it('setAccessCookie sets an httpOnly, root-path, non-secure (test env) cookie', () => {
    const response = NextResponse.json({});
    setAccessCookie(response, 'access-token-value', 720);

    const cookie = response.cookies.get(ACCESS_COOKIE);
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe('access-token-value');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('lax');
    expect(cookie?.path).toBe('/');
    expect(cookie?.secure).toBe(false);
    expect(cookie?.maxAge).toBe(720);
  });

  it('setRefreshCookie scopes the cookie to /api/auth', () => {
    const response = NextResponse.json({});
    setRefreshCookie(response, 'refresh-token-value', 604800);

    const cookie = response.cookies.get(REFRESH_COOKIE);
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe('refresh-token-value');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('lax');
    expect(cookie?.path).toBe('/api/auth');
    expect(cookie?.secure).toBe(false);
    expect(cookie?.maxAge).toBe(604800);
  });

  it('setDeviceCookie sets a long-lived root-path cookie', () => {
    const response = NextResponse.json({});
    setDeviceCookie(response, 'device-id-value');

    const cookie = response.cookies.get(DEVICE_COOKIE);
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe('device-id-value');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('lax');
    expect(cookie?.path).toBe('/');
    expect(cookie?.secure).toBe(false);
    expect(cookie?.maxAge).toBe(400 * 24 * 60 * 60);
  });

  it('clearAuthCookies empties both the access and refresh cookies with maxAge 0', () => {
    const response = NextResponse.json({});
    clearAuthCookies(response);

    const accessCookie = response.cookies.get(ACCESS_COOKIE);
    const refreshCookie = response.cookies.get(REFRESH_COOKIE);

    expect(accessCookie?.value).toBe('');
    expect(accessCookie?.maxAge).toBe(0);
    expect(accessCookie?.path).toBe('/');

    expect(refreshCookie?.value).toBe('');
    expect(refreshCookie?.maxAge).toBe(0);
    expect(refreshCookie?.path).toBe('/api/auth');
  });
});
