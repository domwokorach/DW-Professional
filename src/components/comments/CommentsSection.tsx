import { TextType } from '@/components/animations';
import { avatarsEnabled } from '@/lib/avatar-store.server';
import CommentsBoard from './CommentsBoard';

/** "What people are saying": an Add Comment form and the feed of approved comments (candidate side only). */
export default function CommentsSection() {
  return (
    <section id="comments" className="section comments-section" aria-labelledby="comments-heading">
      <div className="section-tag"><span>07</span><i/>TESTIMONIALS</div>
      <div className="section-heading">
        <TextType id="comments-heading" prefix="What people are" emphasis="saying." duration={0.9} />
        <p>Worked with me or seen my work? Leave a comment. New comments are reviewed before they appear here.</p>
      </div>
      <CommentsBoard avatarsEnabled={avatarsEnabled()} />
    </section>
  );
}
