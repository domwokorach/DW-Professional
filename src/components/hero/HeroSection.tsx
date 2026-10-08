'use client';

import EncryptedText from '@/components/animations/EncryptedText';
import { DownloadIcon } from '@/components/animate-ui/icons/download';
import { BriefcaseBusinessIcon } from '@/components/ui/briefcase-business';
import { SendIcon } from '@/components/ui/send';
import IconButton from '@/components/ui/IconButton';
import IconLink from '@/components/ui/IconLink';
import { RESUME_URL } from '@/config';
import { scrollToSection } from '@/lib/scroll';
import HeroPhotonBackground from './HeroPhotonBackground';
import HeroPortrait from './HeroPortrait';
import type { AvatarAssets } from './avatar/config';

export default function HeroSection({ heroAvatar }: { heroAvatar?: AvatarAssets }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <HeroPhotonBackground />
      <div className="hero-watermark">DOMINIC</div>
      <div className="hero-copy">
        <div className="kicker"><EncryptedText text="DOMINIC" duration={1000} /></div>
        <h1 id="hero-title">
          <EncryptedText
            text="Software Engineer & Frontend Developer."
            delay={250}
            duration={1150}
            render={(v) => <>{v.slice(0, 8)}<br/>{v.slice(9, 19)}<br/>{v.slice(20, 28)}<br/>{v.slice(29, 38)}<span className="hero-dot">{v.slice(38)}</span></>}
          />
        </h1>
        <p>Creative developer · AI &amp; web technology</p>
      </div>
      <HeroPortrait avatar={heroAvatar} />
      <div className="hero-actions">
        <IconButton className="primary" icon={BriefcaseBusinessIcon} onClick={() => scrollToSection('Work')}>Explore work</IconButton>
        <IconButton icon={SendIcon} onClick={() => scrollToSection('Contact')}>Let&apos;s talk</IconButton>
        <IconLink href={RESUME_URL} target="_blank" rel="noopener noreferrer" icon={DownloadIcon}>Resume</IconLink>
      </div>
      <button className="scroll-mark" onClick={() => scrollToSection('About')} aria-label="Scroll to about">⌄</button>
    </section>
  );
}
