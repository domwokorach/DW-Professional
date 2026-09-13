import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { defaultLocale, localisedPathname, normaliseLocale } from "@/i18n/config";
import { getAdminSession } from "@/lib/auth/guard";
import AdminShell from "@/components/admin/AdminShell";

// Middleware already redirects requests with no valid access token before
// they reach this layout (see src/middleware.ts's isAdminRoute check). This
// re-checks server-side as defense in depth — a route guard must never rely
// solely on middleware or the client — including the live account status,
// which middleware's stateless JWT check cannot see.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const locale = normaliseLocale(requestHeaders.get("x-portfolio-locale")) ?? defaultLocale;

  const admin = await getAdminSession();
  if (!admin) {
    const redirectTarget = requestHeaders.get("x-portfolio-path") ?? localisedPathname("/admin/chat", locale);
    redirect(
      `${localisedPathname("/auth/sign-in", locale)}?redirect_url=${encodeURIComponent(redirectTarget)}`
    );
  }

  // Read the desktop sidebar's persisted open/collapsed preference server-side
  // so the initial render already matches it — avoids the hydration mismatch
  // (and layout flash) that reading it client-only after mount would cause.
  const cookieStore = await cookies();
  const sidebarDefaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <AdminShell admin={admin} sidebarDefaultOpen={sidebarDefaultOpen}>
      {children}
    </AdminShell>
  );
}
