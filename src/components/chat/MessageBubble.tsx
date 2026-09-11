import { Check, CheckCheck } from "lucide-react";
import type { ChatMessage } from "@/types/chat";
import { formatChatDate } from "@/lib/chat/helpers";

const SENDER_LABEL: Record<ChatMessage["sender"], string> = {
  admin: "Dominic",
  visitor: "Candidate",
  bot: "Assistant",
};

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isAdmin = message.sender === "admin";

  return (
    <div className={`flex flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}>
      <span className="px-1 text-[11px] font-medium text-muted">{SENDER_LABEL[message.sender]}</span>
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm md:max-w-[75%] lg:max-w-[65%] ${
          isAdmin ? "bg-accent text-ink" : "border border-line bg-ink text-white"
        }`}
      >
        {message.content}
      </div>
      <span className="flex items-center gap-1 px-1 text-[11px] text-muted">
        {formatChatDate(message.createdAt)}
        {isAdmin ? (
          message.status === "read" ? (
            <CheckCheck className="h-3 w-3 text-accent3" aria-label="Read" />
          ) : (
            <Check className="h-3 w-3" aria-label={message.status === "delivered" ? "Delivered" : "Sent"} />
          )
        ) : null}
      </span>
    </div>
  );
}
