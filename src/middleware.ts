import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  localisedPathname,
  normaliseLocale,
  stripLocale,
} from "@/i18n/config";

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

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/:locale/admin(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (isAdminRoute(request)) {
    const { userId, sessionClaims, redirectToSignIn } = await auth();
    if (!userId) return redirectToSignIn();

    const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
    const allowedIds = new Set(
      (process.env.ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean)
    );
    if (role !== "admin" && !allowedIds.has(userId)) {
      const unauthorized = request.nextUrl.clone();
      unauthorized.pathname = isLocale(firstSegment)
        ? `/${firstSegment}/unauthorized`
        : "/unauthorized";
      return NextResponse.redirect(unauthorized);
    }
  }

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
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = remainingPath;

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
});

export const config = {
  matcher: ["/((?!api|_next|favicon\\.svg|robots\\.txt|sitemap\\.xml|.*\\.[^/]+$).*)"],
};
