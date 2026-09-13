"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { Conversation } from "@/types/chat";
import { formatChatDate, getPresenceStatus } from "@/lib/chat/helpers";
import CandidateAvatar from "./CandidateAvatar";
import OnlineStatus from "./OnlineStatus";

const STATUS_LABEL: Record<Conversation["status"], string> = {
  open: "Open",
  pending: "Pending",
  closed: "Resolved",
};

function assignedAdminLabel(conversation: Conversation, currentAdminId: string, currentAdminName: string): string {
  if (!conversation.assignedAdminId) return "Unassigned";
  if (conversation.assignedAdminId === currentAdminId) return `You (${currentAdminName})`;
  return "Another admin";
}

function useLocalNotes(conversationId: string | null) {
  const key = conversationId ? `admin-chat-notes:${conversationId}` : null;
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!key) {
      setNotes("");
      return;
    }
    setNotes(window.localStorage.getItem(key) ?? "");
  }, [key]);

  const update = (value: string) => {
    setNotes(value);
    if (key) window.localStorage.setItem(key, value);
  };

  return [notes, update] as const;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm text-white">{value}</dd>
    </div>
  );
}

export default function CustomerDetails({
  conversation,
  online,
  currentAdminId,
  currentAdminName,
}: {
  conversation: Conversation;
  online: boolean;
  currentAdminId: string;
  currentAdminName: string;
}) {
  const [notes, setNotes] = useLocalNotes(conversation.id);
  const displayName = conversation.name || conversation.visitorId;

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 py-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <CandidateAvatar label={displayName} className="h-16 w-16 text-base" />
        <div>
          <p className="font-mono text-sm font-semibold text-white">{displayName}</p>
          {conversation.email ? <p className="text-xs text-muted">{conversation.email}</p> : null}
          {conversation.companyName ? (
            <p className="text-xs text-muted">{conversation.companyName}</p>
          ) : null}
        </div>
        <OnlineStatus status={getPresenceStatus(conversation, online)} />
      </div>

      <Separator className="bg-line" />

      <dl className="grid grid-cols-1 gap-3">
        <Field label="Conversation ID" value={<span className="break-all">{conversation.id}</span>} />
        <Field label="Visitor ID" value={<span className="break-all">{conversation.visitorId}</span>} />
        {conversation.companyName ? (
          <Field label="Company" value={conversation.companyName} />
        ) : null}
        {conversation.mobile ? <Field label="Mobile" value={conversation.mobile} /> : null}
        <Field
          label="Status"
          value={
            <Badge variant={conversation.status === "closed" ? "secondary" : "default"}>
              {STATUS_LABEL[conversation.status]}
            </Badge>
          }
        />
        <Field label="Assigned admin" value={assignedAdminLabel(conversation, currentAdminId, currentAdminName)} />
        <Field label="Conversation started" value={formatChatDate(conversation.createdAt)} />
        <Field
          label="Last active"
          value={conversation.lastMessageAt ? formatChatDate(conversation.lastMessageAt) : "No messages yet"}
        />
      </dl>

      <Separator className="bg-line" />

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="group flex w-full items-center justify-between text-left text-xs font-medium text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
          Internal notes
          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes about this candidate (only visible to you, on this device)…"
            className="min-h-24 resize-none text-sm"
            aria-label="Internal notes"
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
