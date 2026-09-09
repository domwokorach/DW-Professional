"use client";

import { useEffect, useRef } from "react";
import { Send, X } from "lucide-react";
import type { ChatAction, ChatMessage } from "@/lib/portfolioAssistant/types";
import { suggestedQuestions } from "@/lib/portfolioAssistant/intents";

export default function PortfolioChatPanel({
  messages,
  loading,
  input,
  onInputChange,
  onSend,
  onSuggestedQuestion,
  onAction,
  onClose,
  closeButtonRef,
}: {
  messages: ChatMessage[];
  loading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: (text: string) => void;
  onSuggestedQuestion: (intentId: string, label: string) => void;
  onAction: (action: ChatAction) => void;
  onClose: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
  };

  return (
    <div
      id="portfolio-chat-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Dominic Portfolio Assistant"
      className="fixed bottom-24 right-4 z-[100] flex h-[70vh] max-h-[600px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl md:bottom-auto md:right-24 md:top-1/2 md:-translate-y-1/2"
    >
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="font-mono text-sm font-semibold text-white">
            Dominic Portfolio Assistant
          </p>
          <p className="text-xs text-muted">
            Ask about my experience, skills and projects
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            Available
          </p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close portfolio assistant"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        aria-live="polite"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col gap-2 ${
              message.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                message.role === "user"
                  ? "bg-accent text-ink"
                  : "border border-line bg-ink text-white"
              }`}
            >
              {message.content}
            </div>
            {message.actions?.length ? (
              <div className="flex flex-wrap gap-2">
                {message.actions.map((action) => (
                  <button
                    key={action.href + action.label}
                    type="button"
                    onClick={() => onAction(action)}
                    className="rounded-full border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {loading ? (
          <div className="flex items-start">
            <div className="rounded-2xl border border-line bg-ink px-4 py-2.5 text-sm text-muted">
              <span className="sr-only">Assistant is typing</span>
              <span aria-hidden="true">···</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-line px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestedQuestions.map((question) => (
            <button
              key={question.intentId}
              type="button"
              onClick={() => onSuggestedQuestion(question.intentId, question.label)}
              className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              {question.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label htmlFor="portfolio-chat-input" className="sr-only">
            Ask the portfolio assistant a question
          </label>
          <input
            id="portfolio-chat-input"
            type="text"
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Ask something..."
            maxLength={500}
            className="min-h-11 flex-1 rounded-full border border-line bg-ink px-4 py-2 text-sm text-white placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-ink transition-opacity disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}
