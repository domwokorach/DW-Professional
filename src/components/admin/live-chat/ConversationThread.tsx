"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { ChatMessage, Conversation } from "@/types/chat";

function formatTimestamp(createdAt: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(
    new Date(createdAt)
  );
}

export default function ConversationThread({
  conversation,
  messages,
  typing,
  loading,
  onSend,
  onToggleStatus,
  sendDisabled = false,
  sendDisabledHint,
}: {
  conversation: Conversation | null;
  messages: ChatMessage[];
  typing: boolean;
  loading: boolean;
  onSend: (content: string) => void;
  onToggleStatus: () => void;
  /** Disables sending (e.g. while the socket is offline/reconnecting) without touching the draft. */
  sendDisabled?: boolean;
  sendDisabledHint?: string;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted">
        Select a conversation to view the thread.
      </div>
    );
  }

  const handleSend = () => {
    if (!input.trim() || sendDisabled) return;
    onSend(input);
    setInput("");
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
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="font-mono text-sm font-semibold text-white">
            {conversation.name || conversation.email || conversation.visitorId}
          </p>
          {conversation.email ? <p className="text-xs text-muted">{conversation.email}</p> : null}
        </div>
        <button
          type="button"
          onClick={onToggleStatus}
          className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:text-white"
        >
          {conversation.status === "closed" ? "Reopen" : "Close"}
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-sm text-muted">Loading messages…</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col gap-1 ${
                message.sender === "admin" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${
                  message.sender === "admin"
                    ? "bg-accent text-ink"
                    : "border border-line bg-ink text-white"
                }`}
              >
                {message.content}
              </div>
              <span className="px-1 text-[11px] text-muted">
                {formatTimestamp(message.createdAt)}
              </span>
            </div>
          ))
        )}

        {typing ? (
          <div className="flex items-start" aria-hidden="true">
            <div className="flex items-center gap-1 rounded-2xl border border-line bg-ink px-4 py-2.5 text-sm text-muted">
              Typing…
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 border-t border-line px-4 py-3">
        {sendDisabled && sendDisabledHint ? (
          <p className="text-xs text-amber-400" role="status" aria-live="polite">
            {sendDisabledHint}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <label htmlFor="admin-reply-input" className="sr-only">
            Reply to conversation
          </label>
          <textarea
            id="admin-reply-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply to candidate…"
            rows={1}
            maxLength={2000}
            className="min-h-11 max-h-24 flex-1 resize-none rounded-2xl border border-line bg-ink px-4 py-2.5 text-sm leading-normal text-white placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
          <button
            type="submit"
            disabled={!input.trim() || sendDisabled}
            aria-label="Send reply"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-ink transition-opacity duration-150 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
