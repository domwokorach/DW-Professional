import { headers } from "next/headers";
import { defaultLocale, localisedPathname, normaliseLocale } from "@/i18n/config";
import SignInCard from "@/components/admin/SignInCard";

export const metadata = { title: "Sign in | Dominic Wokorach" };

export default async function SignInPage() {
  const requestHeaders = await headers();
  const locale = normaliseLocale(requestHeaders.get("x-portfolio-locale")) ?? defaultLocale;

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-28 sm:px-8">
      <SignInCard
        path={localisedPathname("/sign-in", locale)}
        fallbackRedirectUrl={localisedPathname("/admin/chat", locale)}
      />
    </section>
  );
}
