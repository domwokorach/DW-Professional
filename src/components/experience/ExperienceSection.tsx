import ExperienceTimeline, { EducationEntries, TimelineNav } from './ExperienceTimeline';

export default function ExperienceSection() {
  return (
    <section id="experience" className="section experience-section" aria-labelledby="experience-heading">
      <div className="section-tag"><span>05</span><i/>EXPERIENCE</div>
      <div className="section-heading">
        <h2 id="experience-heading">My professional journey.</h2>
        <p>A journey through software engineering, digital transformation, technology innovation and continuous professional development — building accessible, scalable and meaningful digital experiences.</p>
      </div>
      <TimelineNav />
      <ExperienceTimeline />
      <section id="xp-education" className="xp-education" aria-labelledby="xp-education-heading">
        <h3 id="xp-education-heading" className="xp-education__title">Education &amp; Qualifications</h3>
        <EducationEntries />
      </section>
    </section>
  );
}
