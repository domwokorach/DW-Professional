"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Send, X } from "lucide-react";
import type { ChatAction, ChatMessage, ConnectionState } from "@/types/chat";

const STATUS_LABEL: Record<ConnectionState, string> = {
  online: "Online",
  connecting: "Connecting…",
  reconnecting: "Reconnecting…",
  offline: "Offline",
};

const STATUS_DOT_CLASS: Record<ConnectionState, string> = {
  online: "bg-emerald-400",
  connecting: "bg-amber-400",
  reconnecting: "bg-amber-400",
  offline: "bg-red-400",
};

function formatTimestamp(createdAt: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

export default function LiveChatPanel({
  messages,
  typing,
  connectionState,
  onSend,
  onAction,
  onMinimise,
  onClose,
  closeButtonRef,
}: {
  messages: ChatMessage[];
  typing: boolean;
  connectionState: ConnectionState;
  onSend: (text: string) => void;
  onAction: (action: ChatAction) => void;
  onMinimise: () => void;
  onClose: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleSend();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      id="live-chat-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Live chat with Dominic's assistant"
      className="fixed right-4 top-1/2 z-[100] flex max-h-[70vh] w-[calc(100vw-32px)] -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl md:right-[84px] md:w-[380px] md:max-w-[380px]"
      style={{ right: "max(16px, env(safe-area-inset-right))" }}
    >
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="font-mono text-sm font-semibold text-white">Live Chat</p>
          <p
            className="mt-1 flex items-center gap-1.5 text-xs text-muted"
            role="status"
            aria-live="polite"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASS[connectionState]}`}
              aria-hidden="true"
            />
            {STATUS_LABEL[connectionState]}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onMinimise}
            aria-label="Minimise live chat"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Minus className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close live chat"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 py-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col gap-1 ${
              message.sender === "visitor" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${
                message.sender === "visitor"
                  ? "bg-accent text-ink"
                  : "border border-line bg-ink text-white"
              }`}
            >
              {message.content}
            </div>
            <span className="px-1 text-[11px] text-muted">
              {formatTimestamp(message.createdAt)}
            </span>
            {message.actions?.length ? (
              <div className="flex flex-wrap gap-2">
                {message.actions.map((action) => (
                  <button
                    key={action.href + action.label}
                    type="button"
                    onClick={() => onAction(action)}
                    className="rounded-full border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent transition-colors duration-150 hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {typing ? (
          <div className="flex items-start" aria-hidden="true">
            <div className="flex items-center gap-1 rounded-2xl border border-line bg-ink px-4 py-2.5 text-sm text-muted">
              <span className="sr-only">Assistant is typing</span>
              Typing…
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-line px-3 py-3">
        <label htmlFor="live-chat-input" className="sr-only">
          Type a message
        </label>
        <textarea
          ref={textareaRef}
          id="live-chat-input"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            const el = event.target;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          maxLength={2000}
          className="min-h-11 max-h-24 flex-1 resize-none rounded-2xl border border-line bg-ink px-4 py-2.5 text-sm leading-normal text-white placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-ink transition-opacity duration-150 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
