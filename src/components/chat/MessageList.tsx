"use client";

import { useEffect, useRef, useState } from "react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { MessageCircle } from "lucide-react";
import { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor } from "@/components/ui/chat-container";
import { ScrollButton } from "@/components/ui/scroll-button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/types/chat";
import { formatDateSeparator } from "@/lib/chat/helpers";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

const GROUP_GAP_MS = 5 * 60 * 1000;

type ListItem =
  | { type: "date"; key: string; label: string }
  | { type: "message"; key: string; message: ChatMessage; showMeta: boolean };

/** Collapses consecutive messages from the same sender (within a short gap) so
 *  the sender label only appears once per run, and inserts a date separator
 *  whenever the calendar day changes — keeps a long thread scannable instead
 *  of repeating the same name/avatar on every line. */
function buildListItems(messages: ChatMessage[]): ListItem[] {
  const items: ListItem[] = [];
  let prev: ChatMessage | null = null;

  for (const message of messages) {
    const date = new Date(message.createdAt);
    const isNewDay = !prev || new Date(prev.createdAt).toDateString() !== date.toDateString();
    if (isNewDay) {
      items.push({ type: "date", key: `date-${message.id}`, label: formatDateSeparator(date) });
    }

    const gapMs = prev ? date.getTime() - new Date(prev.createdAt).getTime() : Infinity;
    const showMeta = isNewDay || prev?.sender !== message.sender || gapMs > GROUP_GAP_MS;
    items.push({ type: "message", key: message.id, message, showMeta });
    prev = message;
  }

  return items;
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
      <span className="shrink-0 text-[11px] font-medium text-muted">{label}</span>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
    </div>
  );
}

/** "↓ N new message(s)" pill next to the scroll-to-bottom button — counts
 *  messages that arrived while the admin was scrolled up reading history. */
function NewMessagesIndicator({ messageCount }: { messageCount: number }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  const [newCount, setNewCount] = useState(0);
  const prevCount = useRef(messageCount);

  useEffect(() => {
    if (isAtBottom) {
      setNewCount(0);
    } else if (messageCount > prevCount.current) {
      setNewCount((count) => count + (messageCount - prevCount.current));
    }
    prevCount.current = messageCount;
  }, [messageCount, isAtBottom]);

  if (newCount === 0 || isAtBottom) return null;

  return (
    <button
      type="button"
      onClick={() => scrollToBottom()}
      className="pointer-events-auto absolute bottom-14 left-1/2 -translate-x-1/2 rounded-full border border-accent/40 bg-surface px-3 py-1.5 text-xs font-medium text-accent shadow-md transition-colors hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      ↓ {newCount} new message{newCount === 1 ? "" : "s"}
    </button>
  );
}

const PAGE_SIZE = 40;

export default function MessageList({
  messages,
  loading,
  typingLabel,
  onDeleteMessage,
}: {
  messages: ChatMessage[];
  loading: boolean;
  typingLabel: string | null;
  onDeleteMessage?: (messageId: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    // Reset the window whenever the thread changes size downward (new conversation).
    setVisibleCount((prev) => (messages.length < prev ? PAGE_SIZE : prev));
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-1 space-y-3 px-4 py-4">
        <Skeleton className="h-12 w-2/3 border border-line" />
        <Skeleton className="ml-auto h-12 w-1/2 border border-line" />
        <Skeleton className="h-12 w-3/5 border border-line" />
        <Skeleton className="ml-auto h-12 w-2/5 border border-line" />
      </div>
    );
  }

  const hasOlder = messages.length > visibleCount;
  const visible = hasOlder ? messages.slice(messages.length - visibleCount) : messages;

  return (
    <div className="relative min-h-0 flex-1">
      {/* StickToBottom keeps the view pinned to the latest message only while
          the admin is already at the bottom — it never yanks the scroll
          position back down if they've scrolled up to read older history. */}
      <ChatContainerRoot className="h-full">
        <ChatContainerContent
          className="px-4 py-4"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Conversation messages"
        >
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
              <MessageCircle className="h-8 w-8 text-muted" aria-hidden="true" />
              <p className="text-sm font-medium text-paper">No messages yet</p>
              <p className="max-w-xs text-sm text-muted">
                Send a reply below to start the conversation.
              </p>
            </div>
          ) : (
            <>
              {hasOlder ? (
                <div className="flex justify-center pb-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    Load older messages
                  </button>
                </div>
              ) : null}
              {buildListItems(visible).map((item) =>
                item.type === "date" ? (
                  <DateSeparator key={item.key} label={item.label} />
                ) : (
                  <MessageBubble
                    key={item.key}
                    message={item.message}
                    showMeta={item.showMeta}
                    onDelete={onDeleteMessage}
                  />
                )
              )}
            </>
          )}
          {typingLabel ? <TypingIndicator label={typingLabel} /> : null}
        </ChatContainerContent>
        <ChatContainerScrollAnchor />
        <NewMessagesIndicator messageCount={messages.length} />
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <ScrollButton />
        </div>
      </ChatContainerRoot>
    </div>
  );
}
