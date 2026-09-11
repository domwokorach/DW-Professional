"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Conversation } from "@/types/chat";
import ConversationItem from "./ConversationItem";

export default function ConversationList({
  conversations,
  loading,
  selectedId,
  onlineVisitorIds,
  onSelect,
}: {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onlineVisitorIds: Set<string>;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) =>
      [conversation.name, conversation.email, conversation.lastMessagePreview]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term))
    );
  }, [conversations, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-3">
        <label htmlFor="conversation-search" className="sr-only">
          Search conversations
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            id="conversation-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {loading && conversations.length === 0 ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted">
            {conversations.length === 0 ? "No candidates yet." : "No conversations match your search."}
          </p>
        ) : (
          <ScrollArea className="h-full">
            <ul className="divide-y divide-line" aria-label="Conversations">
              {filtered.map((conversation) => (
                <li key={conversation.id}>
                  <ConversationItem
                    conversation={conversation}
                    online={onlineVisitorIds.has(conversation.visitorId)}
                    selected={conversation.id === selectedId}
                    onSelect={() => onSelect(conversation.id)}
                  />
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
