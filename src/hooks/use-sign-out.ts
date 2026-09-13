"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/i18n/LocaleProvider";

/**
 * Secure sign-out: invalidates the server-side session, clears auth cookies,
 * disconnects any live Socket.IO connection this tab holds open (a signed-out
 * cookie doesn't itself close an already-established WebSocket), then
 * redirects to sign-in.
 */
export function useSignOut() {
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const { localiseHref } = useLocale();

  const signOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch {
      // Cookies are cleared server-side on success; if the request itself
      // failed we still navigate away rather than leaving the admin stuck.
    }
    window.dispatchEvent(new Event("admin-sign-out"));
    router.push(localiseHref("/auth/sign-in"));
    router.refresh();
  }, [router, localiseHref]);

  return { signOut, signingOut };
}
