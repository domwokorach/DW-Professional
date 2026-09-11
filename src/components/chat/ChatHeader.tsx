"use client";

import { useState } from "react";
import { ChevronLeft, EllipsisVertical, MailOpen, Archive, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Conversation } from "@/types/chat";
import { formatChatDate } from "@/lib/chat/helpers";
import CandidateAvatar from "./CandidateAvatar";
import OnlineStatus from "./OnlineStatus";

export default function ChatHeader({
  conversation,
  online,
  onBack,
  onToggleStatus,
  onMarkUnread,
}: {
  conversation: Conversation;
  online: boolean;
  onBack?: () => void;
  onToggleStatus?: () => void;
  onMarkUnread?: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const displayName = conversation.name || conversation.visitorId;

  return (
    <>
      <header className="flex items-center gap-2 border-b border-line px-2 py-2 sm:px-4 sm:py-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:text-white md:hidden"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}

        <CandidateAvatar label={displayName} className="hidden h-9 w-9 sm:flex" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm font-semibold text-white">{displayName}</p>
          {conversation.email ? (
            <p className="hidden truncate text-xs text-muted sm:block">{conversation.email}</p>
          ) : null}
          <OnlineStatus online={online} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Conversation actions"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <EllipsisVertical className="h-5 w-5" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setDetailsOpen(true)}>
              <Info aria-hidden="true" />
              Candidate details
            </DropdownMenuItem>
            {onMarkUnread ? (
              <DropdownMenuItem onSelect={onMarkUnread}>
                <MailOpen aria-hidden="true" />
                Mark as unread
              </DropdownMenuItem>
            ) : null}
            {onToggleStatus ? (
              <DropdownMenuItem onSelect={onToggleStatus}>
                <Archive aria-hidden="true" />
                {conversation.status === "closed" ? "Reopen conversation" : "Close conversation"}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{displayName}</DialogTitle>
            <DialogDescription>Candidate details</DialogDescription>
          </DialogHeader>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Email</dt>
              <dd className="text-white">{conversation.email || "Not provided"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Visitor ID</dt>
              <dd className="break-all text-white">{conversation.visitorId}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Status</dt>
              <dd className="text-white capitalize">{conversation.status.toLowerCase()}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Started</dt>
              <dd className="text-white">{formatChatDate(conversation.createdAt)}</dd>
            </div>
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}
