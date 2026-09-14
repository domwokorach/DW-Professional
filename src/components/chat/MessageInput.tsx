"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { MAX_MESSAGE_LENGTH } from "@/lib/chat/constants";
import { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction } from "@/components/ui/prompt-input";
import { ChatButton } from "@/components/ui/chat-button";

const MAX_TEXTAREA_HEIGHT_PX = 160;

export default function MessageInput({
  onSend,
  onTyping,
  placeholder = "Type a message…",
  disabled = false,
  disabledHint,
  closed = false,
}: {
  onSend: (content: string) => void;
  onTyping?: () => void;
  placeholder?: string;
  /** Disables sending (e.g. while the socket is offline/reconnecting) without touching the textarea, so a draft is never lost or blocked. */
  disabled?: boolean;
  disabledHint?: string;
  /** A closed conversation can never accept new messages again, unlike a transient connection drop — locks the textarea itself rather than only blocking Send. */
  closed?: boolean;
}) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH && !disabled && !closed;

  const handleSubmit = () => {
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <div
      className="flex flex-col gap-1.5 border-t border-line px-3 pt-3 sm:px-4"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      {(disabled || closed) && disabledHint ? (
        <p className={`text-xs ${closed ? "text-muted" : "text-amber-400"}`} role="status" aria-live="polite">
          {disabledHint}
        </p>
      ) : null}

      <PromptInput
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onTyping?.();
        }}
        onSubmit={handleSubmit}
        maxHeight={MAX_TEXTAREA_HEIGHT_PX}
        disabled={closed}
      >
        <label htmlFor="chat-message-input" className="sr-only">
          Type your message
        </label>
        <PromptInputTextarea
          id="chat-message-input"
          placeholder={placeholder}
          maxLength={MAX_MESSAGE_LENGTH}
          aria-describedby="chat-message-limit"
          aria-label="Message"
        />
        <span id="chat-message-limit" className="sr-only">
          Maximum {MAX_MESSAGE_LENGTH} characters. Press Enter to send, Shift+Enter for a new line.
        </span>
        <PromptInputActions className="justify-end">
          <PromptInputAction tooltip="Send message">
            <ChatButton
              type="button"
              onClick={handleSubmit}
              disabled={!canSend}
              aria-label="Send message"
              size="icon"
              className="h-11 w-11 shrink-0 focus-visible:outline-offset-2"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </ChatButton>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}
