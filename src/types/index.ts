export type CoreTech = {
  name: string;
  /** Iconify id. Brands use simple-icons (or logos for multi-colour marks); concepts use tabler. */
  icon: string;
  /** Icon colour; omitted for multi-colour logos, which carry their own colours. */
  color?: string;
  /** Icon colour in dark mode (a lighter variant); falls back to `color`. */
  colorDark?: string;
};

/** A labelled group of technologies in the Skills section. */
export type TechGroup = { title: string; items: CoreTech[] };

export type Period = {
  /** Display text, e.g. "01/2026" */
  label: string;
  /** Machine-readable value for <time dateTime>, e.g. "2026-01" */
  iso: string;
};

export type ExperienceImage = {
  src: string;
  fallbackSrc: string;
  originalSrc: string;
  alt: string;
  width: number;
  height: number;
};

export type ExperienceProject = {
  name: string;
  description: string;
  /** Non-interactive public-facing notice for work that cannot be linked or demonstrated. */
  visibility?: 'confidential' | 'professional-development';
  /** External project or demonstration, opened in a new tab. */
  url?: string;
  /** Optional explicit accessible name for the external action. */
  actionLabel?: string;
  /** Optional inline demonstration. MP4 is primary; `fallbackSrc` retains the original asset. */
  video?: {
    src: string;
    fallbackSrc: string;
    poster?: string;
    width: number;
    height: number;
  };
  /** Optional card image with an enlarged, accessible preview. */
  image?: ExperienceImage;
};

export type Experience = {
  role: string;
  company?: string;
  /** Secondary line for entries without an employer, e.g. a career break. */
  description?: string;
  location?: string;
  start: Period;
  /** Omitted for the current role. */
  end?: Period;
  bullets: string[];
  /** Heading for `projects`, e.g. "Freelance projects"; the count is added automatically. */
  projectsLabel?: string;
  projects?: ExperienceProject[];
  /** Optional image gallery displayed with this role's project group. */
  projectGallery?: ExperienceImage[];
};

export type Project = {
  id: string;
  title: string;
  headline?: string;
  /** One string per paragraph. */
  description: string[];
  /** Primary label shown beside the number; one of `focus`. */
  category: string;
  focus: string[];
  tech: string[];
  /** Non-interactive public-facing notice for work that cannot be linked or demonstrated. */
  confidential?: boolean;
  /** Live project, opened in a new tab. */
  url?: string;
};

export type Certification = { number: string; name: string; issuer: string };

export type ContactInfoItem = { label: string; value: string; href?: string; /** Iconify id */ icon: string };

export type QuickFact = { label: string; value: string };

export type SocialLink = { label: string; href: string; /** Iconify id */ icon: string };
