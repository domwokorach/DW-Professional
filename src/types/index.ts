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
  /** Optional visible text for the external action; defaults to "View Project". */
  linkLabel?: string;
  /** Optional inline demonstration. MP4 is primary; a fallback asset may also be supplied. */
  video?: {
    src: string;
    fallbackSrc?: string;
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
  /** e.g. "Full-time", "Freelance". */
  employmentType?: string;
  /** e.g. "Remote", "Hybrid". */
  workplaceType?: string;
  /** Skills shown as badges; only list skills that are genuinely part of the role. */
  skills?: string[];
  /** Employer/organisation website, opened in a new tab. */
  website?: string;
  /** Verified logo asset; used instead of `mark` when supplied. */
  logo?: { src: string; alt: string };
  /** Text monogram shown where no authentic logo is available, e.g. "LBG". */
  mark?: string;
  /** Short label for the timeline jump links; defaults to `role`. */
  navLabel?: string;
  /** Education is presented as such, without a duration or employment details. */
  kind?: 'education';
};

/** One employer holding several consecutive roles, rendered as a single expandable card. */
export type ExperienceGroup = {
  employer: string;
  logo?: { src: string; alt: string };
  mark?: string;
  employmentType: string;
  location: string;
  start: Period;
  end?: Period;
  /** Newest first. */
  roles: Experience[];
};

export type ExperienceItem = Experience | ExperienceGroup;

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
  /** Optional visible text for the live link; defaults to "View project". */
  linkLabel?: string;
  /** Optional preview screenshot shown at the top of the card (decorative; the title names the project). */
  image?: { src: string; width: number; height: number };
};

export type Certification = {
  id: string;
  number: string;
  name: string;
  objectKey: string;
  fileType: 'pdf' | 'image';
  issuer?: string;
  technology?: string;
  category?: string;
  level?: string;
  /** ISO calendar date read from S3 object metadata. */
  issuedAt?: string;
  /** Short-lived server-generated URL for the S3 object. */
  url: string;
  /** Optional verification URL read from S3 object metadata. */
  credentialUrl?: string;
};

export type ContactInfoItem = { label: string; value: string; href?: string; /** Iconify id */ icon: string };

export type QuickFact = { label: string; value: string };

export type SocialLink = { label: string; href: string; /** Iconify id */ icon: string };
