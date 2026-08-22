"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const categories = [
  "HR",
  "Payroll",
  "Annual Leave",
  "Working Hours",
  "Payslips",
  "Opportunities",
];

type Message = {
  role: "user" | "assistant";
  content: string;
};

const INITIAL_MESSAGES: Message[] = [
  { role: "user", content: "Where can I find my payslip?" },
  {
    role: "assistant",
    content:
      "I found information relating to payroll and payslips. Payslips are issued on the last working day of each month via the payroll portal.",
  },
];

export default function ChatbotMockup() {
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [messages, error, reduceMotion]);

  async function sendMessage(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const detail = await res.text();
        throw new Error(detail || "Assistant is unavailable right now.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Assistant is unavailable right now. Please try again.");
      }
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return last?.role === "assistant" && !last.content ? prev.slice(0, -1) : prev;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface/60 p-6 sm:p-7">
      <p className="text-xs font-mono uppercase tracking-widest text-muted">
        Live demo — powered by OpenAI, backed by a sample knowledge base
      </p>

      <div className="mt-4 rounded-xl border border-line bg-ink/60 p-5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
          <p className="text-sm font-medium text-white">Internal Assistant</p>
        </div>

        <p className="mt-3 text-sm text-muted">How can I help you today?</p>

        <div className="mt-5 space-y-4" aria-live="polite">
          {messages.map((message, index) =>
            message.role === "user" ? (
              <motion.div
                key={index}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="ml-auto max-w-[80%] rounded-xl rounded-tr-sm bg-white/10 px-4 py-2.5 text-sm text-white"
              >
                <span className="sr-only">You said: </span>
                {message.content}
              </motion.div>
            ) : (
              <motion.div
                key={index}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-[85%] rounded-xl rounded-tl-sm bg-white/[0.04] px-4 py-3 text-sm text-muted"
              >
                <span className="sr-only">Assistant replied: </span>
                {message.content || (
                  <span className="flex items-center gap-1.5" role="status" aria-label="Assistant is finding relevant information">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" aria-hidden />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:0.15s]" aria-hidden />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:0.3s]" aria-hidden />
                  </span>
                )}
              </motion.div>
            )
          )}

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <div ref={conversationEndRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="mt-5 flex items-center gap-2 rounded-full border border-line bg-white/[0.02] px-4 py-2.5"
        >
          <label htmlFor="chat-question" className="sr-only">
            Ask a question
          </label>
          <input
            id="chat-question"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            maxLength={2000}
            placeholder="Ask another question..."
            className="w-full bg-transparent text-sm text-white placeholder:text-muted focus:outline-none disabled:opacity-60"
            style={{ fontSize: "16px" }}
          />
          <button
            type={isStreaming ? "button" : "submit"}
            onClick={isStreaming ? () => abortRef.current?.abort() : undefined}
            disabled={!isStreaming && !input.trim()}
            className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-medium text-ink disabled:opacity-40"
          >
            {isStreaming ? "Stop" : "Send"}
          </button>
        </form>
      </div>

      <div className="mt-5">
        <p className="text-xs font-mono uppercase tracking-widest text-muted">
          What can I help you find?
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <li key={category}>
              <button
                type="button"
                onClick={() => sendMessage(`Tell me about ${category}`)}
                disabled={isStreaming}
                className="rounded-full border border-line bg-white/[0.03] px-3 py-1.5 text-sm text-neutral-300 transition hover:border-accent hover:text-white disabled:opacity-50"
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
