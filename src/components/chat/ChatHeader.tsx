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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/animate-ui/components/radix/sheet";
import type { Conversation } from "@/types/chat";
import { getPresenceStatus } from "@/lib/chat/helpers";
import CandidateAvatar from "./CandidateAvatar";
import OnlineStatus from "./OnlineStatus";
import CustomerDetails from "./CustomerDetails";

export default function ChatHeader({
  conversation,
  online,
  currentAdminId,
  currentAdminName,
  onBack,
  onToggleStatus,
  onMarkUnread,
}: {
  conversation: Conversation;
  online: boolean;
  currentAdminId: string;
  currentAdminName: string;
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
          {conversation.email || conversation.mobile ? (
            <p className="hidden truncate text-xs text-muted sm:block">
              {[conversation.email, conversation.mobile].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          <OnlineStatus status={getPresenceStatus(conversation, online)} />
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
            <DropdownMenuItem className="min-[1200px]:hidden" onSelect={() => setDetailsOpen(true)}>
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

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="right" className="w-[320px] p-0 min-[1200px]:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>{displayName}</SheetTitle>
            <SheetDescription>Candidate details</SheetDescription>
          </SheetHeader>
          <CustomerDetails
            conversation={conversation}
            online={online}
            currentAdminId={currentAdminId}
            currentAdminName={currentAdminName}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
