import ExperienceTimeline from './ExperienceTimeline';
import { experiences } from '@/data';

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

export default function ExperienceSection() {
  const count = WORDS[experiences.length] ?? String(experiences.length);
  return (
    <section id="experience" className="section experience-section" aria-labelledby="experience-heading">
      <div className="section-tag"><span>05</span><i/>EXPERIENCE</div>
      <div className="section-heading"><h2 id="experience-heading">Career <em>timeline.</em></h2><p>{count} chapters, newest first.</p></div>
      <ExperienceTimeline />
    </section>
  );
}
