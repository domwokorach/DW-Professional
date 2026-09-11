import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  localisedPathname,
  normaliseLocale,
} from "@/i18n/config";

// The admin dashboard lives at a clean, non-localised path and is protected
// by Clerk — it's a private tool for one person, not portfolio content.
const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isAdminSignIn = createRouteMatcher(["/admin/sign-in(.*)"]);

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

function localeMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
  const rewriteUrl = request.nextUrl.clone();
  const remainingPath = pathname.split("/").slice(2).join("/");
  rewriteUrl.pathname = `/${remainingPath}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-portfolio-locale", locale);

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

export default clerkMiddleware(async (auth, request) => {
  if (isAdminRoute(request)) {
    if (!isAdminSignIn(request)) {
      await auth.protect();
    }
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  return localeMiddleware(request);
});

export const config = {
  matcher: [
    "/((?!_next|favicon\\.svg|robots\\.txt|sitemap\\.xml|.*\\.[^/]+$).*)",
    "/(api|trpc)(.*)",
  ],
};
