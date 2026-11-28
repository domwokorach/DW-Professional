import { TextType } from '@/components/animations';
import { projects } from '@/data/projects';
import ProjectCarousel from './ProjectCarousel';

/** First project with a screenshot, so the carousel opens on real imagery rather than a placeholder. */
const initialIndex = Math.max(0, projects.findIndex((p) => p.image));

export default function ProjectsSection() {
  return (
    <section id="work" className="section work-section" aria-labelledby="work-heading">
      <div className="section-tag"><span>03</span><i/>PROJECTS</div>
      <div className="section-heading"><TextType id="work-heading" prefix="Things I've" emphasis="built." duration={0.8} /><p>Eight projects across telecom, fintech, banking, monitoring, media and DevOps.</p></div>
      <ProjectCarousel projects={projects} initialIndex={initialIndex} />
    </section>
  );
}
