"use client";

import { useCallback } from "react";
import { useSocket } from "./use-socket";

async function fetchAdminToken(): Promise<string> {
  const res = await fetch("/api/chat/token", { method: "POST" });
  if (!res.ok) throw new Error("Unable to fetch admin chat token");
  const { token } = (await res.json()) as { token: string };
  return token;
}

/** Owns the admin's realtime connection: joins the admin room and receives every conversation's events. */
export function useAdminSocket() {
  const fetchToken = useCallback(fetchAdminToken, []);
  return useSocket(fetchToken);
}
