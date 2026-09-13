import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  localisedPathname,
  normaliseLocale,
  stripLocale,
} from "@/i18n/config";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";

function isAdminRoute(remainingPath: string) {
  return remainingPath === "/admin" || remainingPath.startsWith("/admin/");
}

/**
 * Edge-safe check: verifies the access token's signature and expiry only.
 * This is the first gate (fast redirect for the common case); the admin
 * layout and every admin API route re-check the live user/session against
 * the database as defense in depth, since a token can be valid but its
 * session or account may have since been revoked/disabled.
 */
async function hasValidAccessToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return false;

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

function preferredLocale(request: NextRequest) {
  const saved = normaliseLocale(request.cookies.get(localeCookieName)?.value);
  if (saved) return saved;

  const accepted = request.headers.get("accept-language") ?? "";
  for (const item of accepted.split(",")) {
    const locale = normaliseLocale(item.trim().split(";")[0]);
    if (locale) return locale;
  }
  return defaultLocale;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (!isLocale(firstSegment)) {
    const locale = preferredLocale(request);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localisedPathname(pathname, locale);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(localeCookieName, locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  const locale = normaliseLocale(firstSegment) ?? defaultLocale;
  const remainingPath = stripLocale(pathname);

  if (isAdminRoute(remainingPath)) {
    if (!(await hasValidAccessToken(request))) {
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = localisedPathname("/auth/sign-in", locale);
      signInUrl.search = "";
      signInUrl.searchParams.set("redirect_url", `${localisedPathname(remainingPath, locale)}${request.nextUrl.search}`);
      return NextResponse.redirect(signInUrl);
    }
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = remainingPath;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-portfolio-locale", locale);
  requestHeaders.set("x-portfolio-path", `${localisedPathname(remainingPath, locale)}${request.nextUrl.search}`);

  const response = NextResponse.rewrite(rewriteUrl, {
    request: { headers: requestHeaders },
  });
  response.cookies.set(localeCookieName, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon\\.svg|robots\\.txt|sitemap\\.xml|.*\\.[^/]+$).*)"],
};
