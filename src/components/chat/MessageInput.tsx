"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { MAX_MESSAGE_LENGTH } from "@/lib/chat/constants";

const MAX_TEXTAREA_HEIGHT_PX = 160;

export default function MessageInput({
  onSend,
  onTyping,
  placeholder = "Type a message…",
  disabled = false,
  disabledHint,
}: {
  onSend: (content: string) => void;
  onTyping?: () => void;
  placeholder?: string;
  /** Disables sending (e.g. while the socket is offline/reconnecting) without touching the textarea, so a draft is never lost or blocked. */
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH && !disabled;

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 border-t border-line px-4 py-3">
      {disabled && disabledHint ? (
        <p className="text-xs text-amber-400" role="status" aria-live="polite">
          {disabledHint}
        </p>
      ) : null}
      <div className="flex items-end gap-2">
        <label htmlFor="chat-message-input" className="sr-only">
          Type your message
        </label>
        <textarea
          ref={textareaRef}
          id="chat-message-input"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            autoGrow(event.target);
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
          className="min-h-[44px] max-h-40 flex-1 resize-none overflow-y-auto rounded-2xl border border-line bg-ink px-4 py-2.5 text-sm leading-normal text-white placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
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
      </div>
    </form>
  );
}
