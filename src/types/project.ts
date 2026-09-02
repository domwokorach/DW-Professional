export interface Project {
  slug: string;
  title: string;
  technology: string[];
  description: string;
  features: string[];
  image: string;
  imageAlt: string;
  liveUrl: string;
  repoUrl?: string;
  overview?: string;
  challenge?: string;
  approach?: string;
  outcome?: string;
}
