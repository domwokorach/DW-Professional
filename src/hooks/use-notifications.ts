"use client";

import { useCallback, useEffect, useRef } from "react";
import { requestNotificationPermission, showBrowserNotification } from "@/lib/notifications/browser";

export function useNotifications() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-message.mp3");
  }, []);

  const notify = useCallback(
    (
      title: string,
      body: string,
      options: { onClick?: () => void; sound?: boolean; browserPush?: boolean } = {}
    ) => {
      const { onClick, sound = true, browserPush = true } = options;
      if (sound) audioRef.current?.play().catch(() => {});
      if (browserPush && document.visibilityState !== "visible") {
        showBrowserNotification(title, body, onClick);
      }
    },
    []
  );

  return { notify, requestPermission: requestNotificationPermission };
}
