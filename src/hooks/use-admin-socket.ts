"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "./use-socket";
import { SessionExpiredError } from "@/lib/socket/errors";
import { localisedPathname } from "@/i18n/config";
import { useLocale } from "@/i18n/LocaleProvider";

async function fetchAdminToken(): Promise<string> {
  const res = await fetch("/api/chat/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "admin" }),
  });
  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) throw new Error("Unable to fetch admin chat token");
  const { token } = (await res.json()) as { token: string };
  return token;
}

/**
 * Owns the admin's realtime connection: joins the admin room and receives
 * every conversation's events. Re-verifies Clerk/ADMIN_EMAILS authorization
 * on every (re)connect via fetchAdminToken; if that authorization has been
 * revoked, useSocket reports "unauthorized" and this hook redirects to the
 * locale-aware unauthorized page rather than retrying forever.
 */
export function useAdminSocket() {
  const fetchToken = useCallback(fetchAdminToken, []);
  const { socketRef, connectionState, reconnect } = useSocket(fetchToken);
  const router = useRouter();
  const { locale } = useLocale();

  useEffect(() => {
    if (connectionState !== "unauthorized") return;
    router.replace(localisedPathname("/unauthorized", locale));
  }, [connectionState, router, locale]);

  return { socketRef, connectionState, reconnect };
}
