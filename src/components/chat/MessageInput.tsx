"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { MAX_MESSAGE_LENGTH } from "@/lib/chat/constants";

export default function MessageInput({
  onSend,
  onTyping,
  placeholder = "Type a message…",
}: {
  onSend: (content: string) => void;
  onTyping?: () => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-line px-4 py-3">
      <label htmlFor="chat-message-input" className="sr-only">
        Type your message
      </label>
      <textarea
        id="chat-message-input"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          onTyping?.();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
          }
        }}
        placeholder={placeholder}
        rows={1}
        maxLength={MAX_MESSAGE_LENGTH}
        aria-describedby="chat-message-limit"
        className="min-h-11 max-h-24 flex-1 resize-none rounded-2xl border border-line bg-ink px-4 py-2.5 text-sm leading-normal text-white placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      />
      <span id="chat-message-limit" className="sr-only">
        Maximum {MAX_MESSAGE_LENGTH} characters. Press Enter to send, Shift+Enter for a new line.
      </span>
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-ink transition-opacity duration-150 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
