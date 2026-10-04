import ProudMoments from './ProudMoments';

export default function AchievementsSection() {
  return (
    <section id="achievements" className="section achievements-section" aria-labelledby="achievements-heading">
      <div className="section-tag"><span>06</span><i/>ACHIEVEMENTS</div>
      <div className="section-heading"><h2 id="achievements-heading">Proud <em>moments.</em></h2></div>
      <ProudMoments />
    </section>
  );
}
