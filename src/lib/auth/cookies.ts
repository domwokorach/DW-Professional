import type { NextResponse } from "next/server";
import { isProduction } from "./env";

export const ACCESS_COOKIE = "admin_at";
export const REFRESH_COOKIE = "admin_rt";
export const DEVICE_COOKIE = "admin_device";

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
  };
}

export function setAccessCookie(response: NextResponse, token: string, maxAgeSeconds: number) {
  response.cookies.set(ACCESS_COOKIE, token, { ...baseCookieOptions(), maxAge: maxAgeSeconds });
}

export function setRefreshCookie(response: NextResponse, token: string, maxAgeSeconds: number) {
  response.cookies.set(REFRESH_COOKIE, token, {
    ...baseCookieOptions(),
    path: "/api/auth",
    maxAge: maxAgeSeconds,
  });
}

export function setDeviceCookie(response: NextResponse, deviceId: string) {
  response.cookies.set(DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: 400 * 24 * 60 * 60,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { ...baseCookieOptions(), maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...baseCookieOptions(), path: "/api/auth", maxAge: 0 });
}
