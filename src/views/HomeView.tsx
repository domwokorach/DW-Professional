import { Suspense } from 'react';
import { AchievementsSection, CertificationsSection, CertificationsSectionSkeleton } from '@/components/learning';
import { BackgroundOrbs, SiteHeader } from '@/components/layout';
import { CommentsSection } from '@/components/comments';
import { ContactSection } from '@/components/contact';
import { AboutSection } from '@/components/developer-id';
import { ExperienceSection } from '@/components/experience';
import { HeroSection } from '@/components/hero';
import type { AvatarAssets } from '@/components/hero/avatar/config';
import { ProjectsSection } from '@/components/projects';
import { SkillsSection } from '@/components/skills';

export default function HomeView({ heroAvatar }: { heroAvatar?: AvatarAssets }) {
  return (
    <main>
      <BackgroundOrbs />
      <SiteHeader />
      <HeroSection heroAvatar={heroAvatar} />
      <AboutSection />
      <SkillsSection />
      <ProjectsSection />
      <Suspense fallback={<CertificationsSectionSkeleton />}><CertificationsSection /></Suspense>
      <ExperienceSection />
      <AchievementsSection />
      <CommentsSection />
      <ContactSection />
    </main>
  );
}
