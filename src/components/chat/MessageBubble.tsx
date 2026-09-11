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
        className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${
          isAdmin ? "bg-accent text-ink" : "border border-line bg-ink text-white"
        }`}
      >
        {message.content}
      </div>
      <span className="px-1 text-[11px] text-muted">{formatChatDate(message.createdAt)}</span>
    </div>
  );
}
