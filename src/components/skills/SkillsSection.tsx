import { TextType } from '@/components/animations';
import CoreTech from './CoreTech';

export default function SkillsSection() {
  return (
    <section id="skills" className="section skills-section" aria-labelledby="skills-heading">
      <div className="section-tag"><span>02</span><i/>SKILLS</div>
      <div className="section-heading"><TextType id="skills-heading" prefix="The periodic table" emphasis="of my stack." duration={1.2} /></div>
      <CoreTech />
    </section>
  );
}
