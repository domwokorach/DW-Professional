"use client";

import { forwardRef } from "react";
import { MessageCircle, X } from "lucide-react";
import type { ConnectionState, PanelState } from "@/types/chat";

const STATUS_LABEL: Record<ConnectionState, string> = {
  online: "Online",
  connecting: "Connecting",
  reconnecting: "Reconnecting",
  offline: "Offline",
};

const STATUS_DOT_CLASS: Record<ConnectionState, string> = {
  online: "bg-emerald-400",
  connecting: "bg-amber-400",
  reconnecting: "bg-amber-400",
  offline: "bg-red-400",
};

const LiveChatLauncher = forwardRef<
  HTMLButtonElement,
  {
    panelState: PanelState;
    connectionState: ConnectionState;
    unreadCount: number;
    onToggle: () => void;
  }
>(function LiveChatLauncher({ panelState, connectionState, unreadCount, onToggle }, ref) {
  const isOpen = panelState === "open";

  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      aria-label={
        isOpen
          ? "Close live chat"
          : `Open live chat (${STATUS_LABEL[connectionState]}${
              unreadCount > 0 ? `, ${unreadCount} unread message${unreadCount === 1 ? "" : "s"}` : ""
            })`
      }
      aria-expanded={isOpen}
      aria-controls="live-chat-panel"
      className="fixed z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-line bg-accent text-ink shadow-xl transition-transform duration-150 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none motion-reduce:hover:scale-100"
      style={{
        top: "50%",
        transform: "translateY(-50%)",
        right: "max(16px, env(safe-area-inset-right))",
      }}
    >
      {isOpen ? (
        <X className="h-6 w-6" aria-hidden="true" />
      ) : (
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
      )}

      <span
        className={`absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-accent ${STATUS_DOT_CLASS[connectionState]}`}
        aria-hidden="true"
      />

      {!isOpen && unreadCount > 0 ? (
        <span
          className="absolute -left-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold leading-none text-white"
          aria-hidden="true"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
});

export default LiveChatLauncher;
