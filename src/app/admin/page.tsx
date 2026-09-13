import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { defaultLocale, localisedPathname, normaliseLocale } from "@/i18n/config";

export default async function AdminIndexPage() {
  const requestHeaders = await headers();
  const locale = normaliseLocale(requestHeaders.get("x-portfolio-locale")) ?? defaultLocale;
  redirect(localisedPathname("/admin/chat", locale));
}
