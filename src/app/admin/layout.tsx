import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { defaultLocale, localisedPathname, normaliseLocale } from "@/i18n/config";
import { getAdminSession } from "@/lib/admin";

// The middleware already redirects unauthenticated/non-admin requests before
// they reach this layout (see src/middleware.ts's isAdminRoute check). This
// re-checks server-side as defense in depth — a route guard must never rely
// solely on middleware or the client — rather than as the primary gate.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const locale = normaliseLocale(requestHeaders.get("x-portfolio-locale")) ?? defaultLocale;

  const { userId } = await auth();
  if (!userId) {
    const redirectTarget = requestHeaders.get("x-portfolio-path") ?? localisedPathname("/admin/chat", locale);
    redirect(
      `${localisedPathname("/sign-in", locale)}?redirect_url=${encodeURIComponent(redirectTarget)}`
    );
  }

  const admin = await getAdminSession();
  if (!admin) {
    redirect(localisedPathname("/unauthorized", locale));
  }

  return <>{children}</>;
}
