// Single source of truth: the website's data modules, imported straight from ../../src/data.
// (The barrel `index.ts` is avoided so web-only modules are never pulled into the native bundle.)
import { achievements } from '@/data/achievements';
import { CONTACT_EMAIL, contactInfo } from '@/data/contact';
import { coreTechGroups } from '@/data/core-tech';
import { education, experiences } from '@/data/experience';
import { projects } from '@/data/projects';
import { quickFacts } from '@/data/quick-facts';
import { socialLinks } from '@/data/social';
import { stackIcons } from '@/data/stack-icons';
import { testimonials } from '@/data/testimonials';
import certificationList from '@/data/certifications.generated.json';

export { achievements, CONTACT_EMAIL, contactInfo, coreTechGroups, education, experiences, projects, quickFacts, socialLinks, stackIcons, testimonials };

export type CertificationItem = { id: string; name: string; url: string; issuer: string; technology: string; category: string; level?: string; issuedAt: string };
export const certifications = certificationList as CertificationItem[];

export const ABOUT = [
  'Software Engineer and Frontend Developer with commercial experience at Sky and Lloyds Banking Group, specialising in React, TypeScript, and accessible digital products.',
  'Proven track record of delivering scalable web applications, improving user experiences, and collaborating with Agile teams. Passionate about technology, innovation, and creating inclusive solutions for diverse audiences.',
];
