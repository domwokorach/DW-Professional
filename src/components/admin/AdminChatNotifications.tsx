"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAdminChatContext } from "@/hooks/use-admin-chat-context";
import { useNotifications } from "@/hooks/use-notifications";
import { useLocale } from "@/i18n/LocaleProvider";
import { localisedPathname } from "@/i18n/config";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { getMessagePreview } from "@/lib/chat/helpers";
import type { MessageEventPayload } from "@/types/socket";

const SEEN_IDS_LIMIT = 200;

interface NotificationPreferences {
  newMessage: boolean;
  sound: boolean;
  browserPush: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = { newMessage: true, sound: true, browserPush: false };

/**
 * Global, page-independent popup for new candidate messages — mounted once
 * in AdminShell (above every /admin/* page) so it fires "while the admin is
 * viewing another admin page" (brief §8), sharing the single admin socket
 * connection from AdminChatProvider rather than opening a second one.
 * Renders nothing visible itself; the toast portal and <title> are the UI.
 */
export default function AdminChatNotifications() {
  const { socketRef, conversations } = useAdminChatContext();
  const { notify } = useNotifications();
  const router = useRouter();
  const { locale } = useLocale();
  const seenMessageIds = useRef<string[]>([]);
  const originalTitleRef = useRef<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) return;
        const data = (await res.json()) as { preferences?: { notifications?: Partial<NotificationPreferences> } };
        if (cancelled || !data.preferences?.notifications) return;
        setPreferences({ ...DEFAULT_PREFERENCES, ...data.preferences.notifications });
      } catch {
        // Keep defaults — this only tailors sound/browser-push behaviour.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !preferences.newMessage) return;

    const handleMessage = ({ message }: MessageEventPayload) => {
      if (message.sender !== "visitor") return;
      // The same message can be re-emitted once its status flips to
      // "delivered" — never toast/notify for it twice.
      if (seenMessageIds.current.includes(message.id)) return;
      seenMessageIds.current.push(message.id);
      if (seenMessageIds.current.length > SEEN_IDS_LIMIT) seenMessageIds.current.shift();

      const conversation = conversations.find((c) => c.id === message.conversationId);
      const name = conversation?.name || "A visitor";
      const preview = getMessagePreview(message.content, 120);
      const href = localisedPathname(`/admin/chat?conversation=${message.conversationId}`, locale);
      const openChat = () => router.push(href);

      toast("New live chat message", {
        description: `${name}\n"${preview}"`,
        action: { label: "Open chat", onClick: openChat },
        cancel: { label: "Dismiss", onClick: () => {} },
      });

      notify(`New portfolio chat message`, `${name}: ${preview}`, {
        onClick: openChat,
        sound: preferences.sound,
        browserPush: preferences.browserPush,
      });
    };

    socket.on(SOCKET_EVENTS.MESSAGE, handleMessage);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE, handleMessage);
    };
  }, [socketRef, conversations, router, locale, notify, preferences]);

  useEffect(() => {
    if (originalTitleRef.current === null) originalTitleRef.current = document.title;
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadByAdmin, 0);
    document.title = totalUnread > 0 ? `(${totalUnread}) ${originalTitleRef.current}` : originalTitleRef.current;
    return () => {
      if (originalTitleRef.current !== null) document.title = originalTitleRef.current;
    };
  }, [conversations]);

  return null;
}
