"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, typingLabel]);

  if (loading) {
    return (
      <div className="flex-1 space-y-3 px-4 py-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="ml-auto h-12 w-1/2" />
        <Skeleton className="h-12 w-3/5" />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div
        className="space-y-3 px-4 py-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversation messages"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-muted">No messages yet.</p>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        {typingLabel ? <TypingIndicator label={typingLabel} /> : null}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
