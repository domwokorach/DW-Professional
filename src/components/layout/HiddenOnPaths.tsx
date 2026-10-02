"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { stripLocale } from "@/i18n/config";

/**
 * Renders its children everywhere except on the given locale-less paths
 * (e.g. "/barcode" matches /en-gb/barcode, /fr/barcode, ...).
 */
export default function HiddenOnPaths({
  paths,
  children,
}: {
  paths: readonly string[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const path = stripLocale(pathname ?? "/").replace(/\/+$/, "") || "/";
  if (paths.includes(path)) return null;
  return <>{children}</>;
}
