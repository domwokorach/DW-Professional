import { db } from "@/lib/database/db";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import CommentsMarquee from "@/components/comments/CommentsMarquee";
import CommentForm from "@/components/comments/CommentForm";
import { toPublicComment } from "@/lib/comments/toPublicComment";
import type { PublicComment } from "@/types/comment";

async function getApprovedComments(): Promise<PublicComment[]> {
  const comments = await db.comment.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return comments.map(toPublicComment);
}

export default async function Testimonials() {
  const comments = await getApprovedComments();

  return (
    <section id="testimonials" className="relative border-t border-line py-28 sm:py-36">
      <Container>
        <SectionHeading
          index="07"
          label="Testimonials"
          heading="What candidates & colleagues say."
          animateHeading
          headingEffect="typing"
        />
      </Container>

      {comments.length > 0 ? (
        <div className="mt-14">
          <CommentsMarquee comments={comments} />
        </div>
      ) : (
        <Container>
          <p className="mt-8 text-sm text-muted">Be the first to leave a comment.</p>
        </Container>
      )}

      <Container className="mt-14 max-w-2xl">
        <h3 className="text-lg font-semibold text-white">Leave a comment</h3>
        <p className="mt-2 text-sm text-muted">
          Worked with me? Share a few words — it&rsquo;s reviewed before it appears here.
        </p>
        <div className="mt-6">
          <CommentForm />
        </div>
      </Container>
    </section>
  );
}
