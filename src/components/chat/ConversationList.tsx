"use client";

import { useMemo, useState } from "react";
import { Search, LogOut } from "lucide-react";
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
import type { Conversation, ConnectionState } from "@/types/chat";
import ConnectionStatus from "./ConnectionStatus";
import ConversationItem from "./ConversationItem";

function matchesQuery(conversation: Conversation, term: string): boolean {
  return [conversation.name, conversation.email, conversation.lastMessagePreview]
    .filter(Boolean)
    .some((field) => field!.toLowerCase().includes(term));
}

export default function ConversationList({
  conversations,
  loading,
  selectedId,
  onlineVisitorIds,
  connectionState,
  adminName,
  adminEmail,
  className,
  onSelect,
  onSignOut,
}: {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onlineVisitorIds: Set<string>;
  connectionState: ConnectionState;
  adminName: string;
  adminEmail: string;
  className?: string;
  onSelect: (id: string) => void;
  onSignOut: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) => matchesQuery(conversation, term));
  }, [conversations, query]);

  // Presence is currently binary (online/offline; see hooks/use-admin-presence),
  // so "waiting" is approximated from unreadByAdmin rather than a distinct
  // server-tracked state: an online candidate with unread messages hasn't
  // been answered yet, one with none has.
  const { waiting, active, offline } = useMemo(() => {
    const waiting: Conversation[] = [];
    const active: Conversation[] = [];
    const offline: Conversation[] = [];
    for (const conversation of filtered) {
      if (!onlineVisitorIds.has(conversation.visitorId)) {
        offline.push(conversation);
      } else if (conversation.unreadByAdmin > 0) {
        waiting.push(conversation);
      } else {
        active.push(conversation);
      }
    }
    return { waiting, active, offline };
  }, [filtered, onlineVisitorIds]);

  return (
    <Sidebar collapsible="none" className={className}>
      <SidebarHeader className="gap-3 border-b border-line p-3">
        <ConnectionStatus state={connectionState} />

        <div className="relative">
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
      </SidebarHeader>

      <SidebarContent className="gap-0">
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
