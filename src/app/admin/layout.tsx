import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { defaultLocale, localisedPathname, normaliseLocale } from "@/i18n/config";
import { getAdminSession } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const admin = await getAdminSession();
  if (!admin) {
    const requestHeaders = await headers();
    const locale = normaliseLocale(requestHeaders.get("x-portfolio-locale")) ?? defaultLocale;
    redirect(localisedPathname("/unauthorized", locale));
  }

  return <>{children}</>;
}
