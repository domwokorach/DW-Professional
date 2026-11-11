import ExperienceTimeline, { TimelineNav } from './ExperienceTimeline';

export default function ExperienceSection() {
  return (
    <section id="experience" className="section experience-section" aria-labelledby="experience-heading">
      <div className="section-tag"><span>05</span><i/>EXPERIENCE</div>
      <div className="section-heading"><h2 id="experience-heading">Experience</h2><p>My professional journey from 2005 to Present.</p></div>
      <TimelineNav />
      <ExperienceTimeline />
    </section>
  );
}
