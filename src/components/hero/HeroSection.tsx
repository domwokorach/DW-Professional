'use client';

import { EncryptedText } from '@/components/animations';
import { scrollToSection } from '@/lib';
import HeroPhotonBackground from './HeroPhotonBackground';
import HeroPortrait from './HeroPortrait';
import type { AvatarAssets } from './avatar/config';

export default function HeroSection({ heroAvatar }: { heroAvatar?: AvatarAssets }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <HeroPhotonBackground />
      <div className="hero-watermark">DOMINIC</div>
      <div className="hero-copy">
        <div className="kicker"><EncryptedText text="DOMINIC OLANYA" duration={1000} /></div>
        <h1 id="hero-title">
          <EncryptedText
            text="Frontend Software Engineer."
            delay={250}
            duration={1150}
            render={(v) => <>{v.slice(0, 8)}<br/>{v.slice(9, 17)}<br/>{v.slice(18, 26)}<span className="hero-dot">{v.slice(26)}</span></>}
          />
        </h1>
        <p>Creative developer · AI &amp; web technology</p>
      </div>
      <HeroPortrait avatar={heroAvatar} />
      <div className="hero-actions">
        <button className="primary" onClick={() => scrollToSection('Work')}>Explore work ↗</button>
        <button onClick={() => scrollToSection('Contact')}>Let&apos;s talk</button>
        <button onClick={() => scrollToSection('About')}>Résumé ↓</button>
      </div>
      <button className="scroll-mark" onClick={() => scrollToSection('About')} aria-label="Scroll to about">⌄</button>
    </section>
  );
}
