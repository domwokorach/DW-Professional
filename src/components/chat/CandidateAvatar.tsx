import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function CandidateAvatar({
  label,
  className = "h-10 w-10",
}: {
  label: string;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      <AvatarFallback>{getInitials(label)}</AvatarFallback>
    </Avatar>
  );
}
