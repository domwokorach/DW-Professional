import { Marquee } from "@/components/magicui/marquee";
import CommentCard from "./CommentCard";
import type { PublicComment } from "@/types/comment";

export default function CommentsMarquee({ comments }: { comments: PublicComment[] }) {
  if (comments.length === 0) return null;

  return (
    <div className="w-full overflow-hidden">
      <Marquee duration={Math.max(40, comments.length * 8)} pauseOnHover>
        {comments.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
      </Marquee>
    </div>
  );
}
