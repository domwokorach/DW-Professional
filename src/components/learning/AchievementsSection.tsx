import AccordionGallery from './AccordionGallery';

export default function AchievementsSection() {
  return (
    <section id="achievements" className="section achievements-section" aria-labelledby="achievements-heading">
      <div className="section-tag achievements-tag"><span>06</span><span>ACHIEVEMENTS</span></div>
      <div className="section-heading"><h2 id="achievements-heading">Proud <em>moments.</em></h2></div>
      <AccordionGallery />
    </section>
  );
}
