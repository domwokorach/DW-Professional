"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

const PAGE_SIZE = 40;

export default function MessageList({
  messages,
  loading,
  typingLabel,
}: {
  messages: ChatMessage[];
  loading: boolean;
  typingLabel: string | null;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    // Reset the window whenever the thread changes size downward (new conversation).
    setVisibleCount((prev) => (messages.length < prev ? PAGE_SIZE : prev));
  }, [messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
    // Only auto-scroll on genuinely new messages/typing changes, not when
    // revealing older history (which would otherwise yank the view back down).
  }, [messages.length, typingLabel]);

  if (loading) {
    return (
      <div className="flex-1 space-y-3 px-4 py-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="ml-auto h-12 w-1/2" />
        <Skeleton className="h-12 w-3/5" />
        <Skeleton className="ml-auto h-12 w-2/5" />
      </div>
    );
  }

  const hasOlder = messages.length > visibleCount;
  const visible = hasOlder ? messages.slice(messages.length - visibleCount) : messages;

  return (
    <ScrollArea className="flex-1">
      <div
        className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 py-6 lg:px-8"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversation messages"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-muted">No messages yet.</p>
        ) : (
          <>
            {hasOlder ? (
              <div className="flex justify-center pb-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  Load older messages
                </button>
              </div>
            ) : null}
            {visible.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </>
        )}
        {typingLabel ? <TypingIndicator label={typingLabel} /> : null}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
