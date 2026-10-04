import { TextType } from '@/components/animations';
import ProjectGrid from './ProjectGrid';

export default function ProjectsSection() {
  return (
    <section id="work" className="section work-section" aria-labelledby="work-heading">
      <div className="section-tag"><span>03</span><i/>PROJECTS</div>
      <div className="section-heading"><TextType id="work-heading" prefix="Things I've" emphasis="built." duration={0.8} /><p>Six projects spanning accessibility, search, UX, and release quality.</p></div>
      <ProjectGrid />
    </section>
  );
}
