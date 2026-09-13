"use client";

import { useMemo, useState } from "react";
import { Search, LogOut, TriangleAlert } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
} from "@/components/animate-ui/components/radix/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { matchesFilter, type ConversationFilter } from "@/lib/chat/filters";
import { getPresenceStatus } from "@/lib/chat/helpers";
import type { Conversation } from "@/types/chat";
import ConversationFilters from "./ConversationFilters";
import ConversationItem from "./ConversationItem";

function matchesQuery(conversation: Conversation, term: string): boolean {
  return [conversation.name, conversation.email, conversation.mobile, conversation.lastMessagePreview]
    .filter(Boolean)
    .some((field) => field!.toLowerCase().includes(term));
}

export default function ConversationList({
  conversations,
  loading,
  error,
  onRetry,
  selectedId,
  onlineVisitorIds,
  adminName,
  adminEmail,
  currentAdminId,
  className,
  onSelect,
  onSignOut,
}: {
  conversations: Conversation[];
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  selectedId: string | null;
  onlineVisitorIds: Set<string>;
  adminName: string;
  adminEmail: string;
  currentAdminId: string;
  className?: string;
  onSelect: (id: string) => void;
  onSignOut: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const debouncedQuery = useDebouncedValue(query, 250);

  const filtered = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    return conversations.filter((conversation) => {
      if (term && !matchesQuery(conversation, term)) return false;
      return matchesFilter(conversation, filter, { onlineVisitorIds, currentAdminId });
    });
  }, [conversations, debouncedQuery, filter, onlineVisitorIds, currentAdminId]);

  const { waiting, active, offline } = useMemo(() => {
    const waiting: Conversation[] = [];
    const active: Conversation[] = [];
    const offline: Conversation[] = [];
    for (const conversation of filtered) {
      const online = onlineVisitorIds.has(conversation.visitorId);
      switch (getPresenceStatus(conversation, online)) {
        case "offline":
          offline.push(conversation);
          break;
        case "waiting":
          waiting.push(conversation);
          break;
        default:
          active.push(conversation);
      }
    }
    return { waiting, active, offline };
  }, [filtered, onlineVisitorIds]);

  return (
    <Sidebar collapsible="none" className={className}>
      <SidebarHeader className="gap-3 border-b border-line p-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <label htmlFor="conversation-search" className="sr-only">
              Search candidates
            </label>
            <SidebarInput
              id="conversation-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search candidates…"
              className="pl-9"
            />
          </div>
          <ConversationFilters value={filter} onChange={setFilter} />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {error && conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <TriangleAlert className="h-5 w-5 text-amber-400" aria-hidden="true" />
            <p className="text-sm text-muted">Unable to load conversations.</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : loading && conversations.length === 0 ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted">
            {conversations.length === 0
              ? "No conversations yet. New candidate messages will appear here."
              : query.trim()
                ? "No conversations match your search."
                : "No conversations match this filter."}
          </p>
        ) : (
          <>
            <ConversationGroup
              label="Waiting"
              conversations={waiting}
              selectedId={selectedId}
              onlineVisitorIds={onlineVisitorIds}
              onSelect={onSelect}
            />
            <ConversationGroup
              label="Active"
              conversations={active}
              selectedId={selectedId}
              onlineVisitorIds={onlineVisitorIds}
              onSelect={onSelect}
            />
            <ConversationGroup
              label="Offline / recent"
              conversations={offline}
              selectedId={selectedId}
              onlineVisitorIds={onlineVisitorIds}
              onSelect={onSelect}
            />
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-line p-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="min-w-0 truncate text-xs text-muted">
            Signed in as <span className="text-white">{adminName}</span>
          </span>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {adminEmail ? <p className="truncate text-xs text-muted">{adminEmail}</p> : null}
      </SidebarFooter>
    </Sidebar>
  );
}

function ConversationGroup({
  label,
  conversations,
  selectedId,
  onlineVisitorIds,
  onSelect,
}: {
  label: string;
  conversations: Conversation[];
  selectedId: string | null;
  onlineVisitorIds: Set<string>;
  onSelect: (id: string) => void;
}) {
  if (conversations.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {label} ({conversations.length})
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              online={onlineVisitorIds.has(conversation.visitorId)}
              selected={conversation.id === selectedId}
              onSelect={() => onSelect(conversation.id)}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
