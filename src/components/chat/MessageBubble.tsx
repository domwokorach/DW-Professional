"use client";

import { useState } from "react";
import { Check, CheckCheck, Clock, Copy, EllipsisVertical, Trash2 } from "lucide-react";
import { Message, MessageContent } from "@/components/ui/message";
import { ChatButton } from "@/components/ui/chat-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { formatChatDate } from "@/lib/chat/helpers";
import ConfirmDialog from "./ConfirmDialog";
import MessageAttachment from "./MessageAttachment";

const SENDER_LABEL: Record<ChatMessage["sender"], string> = {
  admin: "Dominic",
  visitor: "Candidate",
  bot: "Assistant",
};

export default function MessageBubble({
  message,
  showMeta = true,
  onDelete,
}: {
  message: ChatMessage;
  /** False for messages grouped under the previous one (same sender, no date/gap break) — hides the repeated sender label and tightens spacing. */
  showMeta?: boolean;
  onDelete?: (messageId: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  // group-hover never fires on a touchscreen, so the actions trigger needs a
  // tap-driven way to appear too — but showing it permanently on every bubble
  // (rather than only this message, on tap) would clutter the whole thread.
  const [tapRevealed, setTapRevealed] = useState(false);
  const isAdmin = message.sender === "admin";
  const isDeleted = Boolean(message.deleted);

  const handleCopy = () => {
    void navigator.clipboard?.writeText(message.content);
  };

  return (
    <Message
      className={cn(
        "group/message flex-col gap-1",
        isAdmin ? "items-end" : "items-start",
        showMeta ? "mt-3" : "mt-0.5"
      )}
    >
      <div className={cn("flex w-full items-center gap-1", isAdmin ? "flex-row-reverse" : "flex-row")}>
        {showMeta ? (
          <span className="px-1 text-[11px] font-medium text-muted">{SENDER_LABEL[message.sender]}</span>
        ) : null}
        {!isDeleted && onDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ChatButton
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Message actions"
                className={cn(
                  "h-6 w-6 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/message:opacity-100",
                  tapRevealed && "opacity-100"
                )}
              >
                <EllipsisVertical className="h-3.5 w-3.5" aria-hidden="true" />
              </ChatButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAdmin ? "end" : "start"}>
              <DropdownMenuItem onSelect={handleCopy}>
                <Copy aria-hidden="true" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-400 focus:text-red-400"
                onSelect={() => setConfirmOpen(true)}
              >
                <Trash2 aria-hidden="true" />
                Delete message
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <div className="contents" onClick={onDelete ? () => setTapRevealed((r) => !r) : undefined}>
        {!isDeleted && (message.content || !message.attachments?.length) ? (
          <MessageContent
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm md:max-w-[75%] lg:max-w-[65%]",
              isAdmin ? "bg-accent text-accent-fg" : "border border-line bg-ink text-paper"
            )}
          >
            {message.content}
          </MessageContent>
        ) : null}
        {isDeleted ? (
          <MessageContent className="max-w-[85%] rounded-2xl border border-dashed border-line px-4 py-2.5 text-sm italic text-muted md:max-w-[75%] lg:max-w-[65%]">
            Message deleted
          </MessageContent>
        ) : null}
        {!isDeleted && message.attachments?.length
          ? message.attachments.map((attachment) => <MessageAttachment key={attachment.id} attachment={attachment} />)
          : null}
      </div>
      <span className="flex items-center gap-1 px-1 text-[11px] text-muted">
        {formatChatDate(message.createdAt)}
        {isAdmin && !isDeleted ? (
          message.localStatus === "failed" ? (
            <span role="alert">Message failed to send. Use Retry in the notification.</span>
          ) : message.localStatus === "sending" ? (
            <Clock className="h-3 w-3" aria-label="Sending" />
          ) : message.status === "read" ? (
            <CheckCheck className="h-3 w-3 text-accent3" aria-label="Read" />
          ) : (
            <Check className="h-3 w-3" aria-label={message.status === "delivered" ? "Delivered" : "Sent"} />
          )
        ) : null}
      </span>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete message?"
        description="This message will be removed from the conversation."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete?.(message.id);
        }}
      />
    </Message>
  );
}
