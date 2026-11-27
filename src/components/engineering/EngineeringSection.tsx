import { ArrowUpRight } from 'lucide-react';
import { engineeringCards, engineeringLinks } from './engineering-data';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

export default function EngineeringSection() {
  return (
    <section id="engineering" className="section engineering-section" aria-labelledby="engineering-heading">
      <div className="section-tag"><span>10</span><i/>ENGINEERING</div>
      <div className="section-heading">
        <h2 id="engineering-heading">Built. Tested. <em>Delivered.</em></h2>
        <p>Engineering beyond the interface. Automated quality assurance, maintainable architecture and reliable delivery workflows.</p>
      </div>
      <ul className="engineering-grid">
        {engineeringCards.map((card) => (
          <li key={card.title} className="engineering-card">
            <h3>{card.title}</h3>
            <p>{card.text}</p>
            <a href={card.link.href} aria-label={`${card.title}: ${card.link.label} (opens in a new tab)`} {...external}>
              {card.link.label} <ArrowUpRight aria-hidden="true" size={16} />
            </a>
          </li>
        ))}
      </ul>
      <nav className="engineering-links" aria-label="Engineering evidence">
        {Object.values(engineeringLinks).map((link) => (
          <a key={link.href} href={link.href} {...external}>
            {link.label}<span className="sr-only"> (opens in a new tab)</span> <ArrowUpRight aria-hidden="true" size={16} />
          </a>
        ))}
      </nav>
      <p className="engineering-note">Build and test status is published by the live workflows linked above. Nothing is displayed here that has not been run.</p>
    </section>
  );
}
