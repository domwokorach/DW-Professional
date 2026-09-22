import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PublicComment } from "@/types/comment";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function CommentCard({ comment }: { comment: PublicComment }) {
  return (
    <figure className="w-[320px] shrink-0 rounded-2xl border border-line bg-surface p-6 shadow-lg shadow-black/20 transition-colors duration-200 hover:border-accent/40 sm:w-[380px]">
      <blockquote className="text-sm leading-relaxed text-muted">
        &ldquo;{comment.body}&rdquo;
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <Avatar className="h-11 w-11 shrink-0 border border-line">
          <AvatarImage src={comment.avatarUrl ?? undefined} alt="" />
          <AvatarFallback className="bg-ink text-sm text-paper">{initials(comment.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-paper">{comment.fullName}</p>
          {comment.company ? <p className="truncate text-xs text-muted">{comment.company}</p> : null}
        </div>
      </figcaption>
    </figure>
  );
}
