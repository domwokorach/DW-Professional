import { Badge } from "@/components/ui/badge";

export default function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <Badge
      variant="default"
      className="min-w-5 justify-center rounded-full px-1.5 py-0"
      aria-label={`${count} unread message${count === 1 ? "" : "s"}`}
    >
      {count > 9 ? "9+" : count}
    </Badge>
  );
}
