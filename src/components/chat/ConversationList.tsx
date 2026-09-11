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
  if (loading && conversations.length === 0) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return <p className="p-4 text-sm text-muted">No candidates yet.</p>;
  }

  return (
    <ScrollArea className="h-full">
      <ul className="divide-y divide-line" aria-label="Conversations">
        {conversations.map((conversation) => (
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
  );
}
