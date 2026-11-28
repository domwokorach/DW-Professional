// The portfolio home page, composed exactly like src/views/HomeView.tsx + src/app/layout.tsx (minus Next.js / server data).
import './styles';
import { Suspense } from 'react';
import SnowfallLayer from '@/components/christmas';
import { CommentsSection } from '@/components/comments';
import { ContactSection } from '@/components/contact';
import { AboutSection } from '@/components/developer-id';
import { ExperienceSection } from '@/components/experience';
import { GitHubActivitySection } from '@/components/github';
import { HeroSection } from '@/components/hero';
import { BackgroundOrbs, SiteHeader } from '@/components/layout';
import AppFooter from '@/components/layout/AppFooter';
import { AchievementsSection, CertificationsSection, CertificationsSectionSkeleton } from '@/components/learning';
import { PlatformsSection } from '@/components/platforms';
import { CookieConsent } from '@/components/privacy';
import { ProjectsSection } from '@/components/projects';
import { SkillsSection } from '@/components/skills';

export default function Home() {
  return (
    <>
      <SnowfallLayer />
      <main>
        <BackgroundOrbs />
        <SiteHeader />
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ProjectsSection />
        <Suspense fallback={<CertificationsSectionSkeleton />}><CertificationsSection /></Suspense>
        <ExperienceSection />
        <AchievementsSection />
        <GitHubActivitySection />
        <CommentsSection />
        <ContactSection />
        <PlatformsSection />
      </main>
      <AppFooter />
      <CookieConsent />
    </>
  );
}
