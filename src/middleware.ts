import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, clerkClient } from "@clerk/nextjs/server";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  localisedPathname,
  normaliseLocale,
  stripLocale,
} from "@/i18n/config";

function isAdminRoute(remainingPath: string) {
  return remainingPath === "/admin" || remainingPath.startsWith("/admin/");
}

async function isAdminUser(userId: string): Promise<boolean> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  if (user.publicMetadata?.role === "admin") return true;

  const allowedEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  return Boolean(email && allowedEmails.includes(email));
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

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // API routes need clerkMiddleware() to wrap them (so auth() works inside
  // route handlers), but never take part in the locale rewrite below.
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
    const { userId } = await auth();

    if (!userId) {
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = localisedPathname("/sign-in", locale);
      signInUrl.search = "";
      signInUrl.searchParams.set("redirect_url", `${localisedPathname(remainingPath, locale)}${request.nextUrl.search}`);
      return NextResponse.redirect(signInUrl);
    }

    if (!(await isAdminUser(userId))) {
      const unauthorizedUrl = request.nextUrl.clone();
      unauthorizedUrl.pathname = localisedPathname("/unauthorized", locale);
      unauthorizedUrl.search = "";
      return NextResponse.redirect(unauthorizedUrl);
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
});

export const config = {
  matcher: ["/((?!_next|favicon\\.svg|robots\\.txt|sitemap\\.xml|.*\\.[^/]+$).*)"],
};
