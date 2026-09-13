import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { defaultLocale, localisedPathname, normaliseLocale } from "@/i18n/config";

/** Old sign-in URL kept as a redirect to /auth/sign-in for existing bookmarks/links. */
export default async function LegacySignInRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const requestHeaders = await headers();
  const locale = normaliseLocale(requestHeaders.get("x-portfolio-locale")) ?? defaultLocale;
  const params = await searchParams;
  const redirectUrl = typeof params.redirect_url === "string" ? params.redirect_url : undefined;

  const target = localisedPathname("/auth/sign-in", locale);
  redirect(redirectUrl ? `${target}?redirect_url=${encodeURIComponent(redirectUrl)}` : target);
}
