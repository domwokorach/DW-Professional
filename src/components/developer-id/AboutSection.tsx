import { DownloadIcon } from '@/components/animate-ui/icons/download';
import { LinkIcon } from '@/components/animate-ui/icons/link';
import { IconLink } from '@/components/ui';
import { quickFacts, socialLinks } from '@/data';
import DeveloperIdCard from './DeveloperIdCard';
import LondonClock from './LondonClock';

export default function AboutSection() {
  return (
    <section id="about" className="section about">
      <div className="section-tag"><span>01</span><i/>ABOUT</div>
      <div className="about-grid">
        <article className="about-copy">
          <h2>Hi, I&apos;m <em>Dominic.</em></h2>
          <p>Software Engineer and Frontend Developer with commercial experience at Sky and Lloyds Banking Group, specialising in React, TypeScript, and accessible digital products.</p>
          <p>Proven track record of delivering scalable web applications, improving user experiences, and collaborating with Agile teams. Passionate about technology, innovation, and creating inclusive solutions for diverse audiences.</p>
          <div className="button-row">
            <IconLink className="primary" href="/Dominic_Wokorach_Olanya_CV.pdf" download icon={DownloadIcon}>Résumé</IconLink>
            {socialLinks.map(({ label, href }) => <IconLink key={label} href={href} target="_blank" rel="noopener noreferrer" icon={LinkIcon}>{label}</IconLink>)}
          </div>
        </article>

        <DeveloperIdCard />

        <aside className="quick-facts">
          <div className="mini-title">QUICK FACTS</div>
          <dl>
            <div className="quick-fact quick-fact--time">
              <dt>Time <span className="quick-fact-live" aria-hidden="true">Live</span></dt>
              <dd><LondonClock /></dd>
            </div>
            {quickFacts.map(({ label, value }) => (
              <div key={label} className="quick-fact"><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
          <blockquote>“From the database to the last pixel.”</blockquote>
        </aside>
      </div>
    </section>
  );
}
