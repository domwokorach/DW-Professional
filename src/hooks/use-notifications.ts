"use client";

import { useCallback, useEffect, useRef } from "react";
import { requestNotificationPermission, showBrowserNotification } from "@/lib/notifications/browser";

export function useNotifications() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-message.mp3");
  }, []);

  const notify = useCallback((title: string, body: string) => {
    audioRef.current?.play().catch(() => {});
    if (document.visibilityState !== "visible") {
      showBrowserNotification(title, body);
    }
  }, []);

  return { notify, requestPermission: requestNotificationPermission };
}
