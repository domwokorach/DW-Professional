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
  projects?: { name: string; description: string }[];
};

export type Project = {
  id: string;
  title: string;
  headline: string;
  /** One string per paragraph. */
  description: string[];
  /** Primary label shown beside the number; one of `focus`. */
  category: string;
  focus: string[];
  tech: string[];
  /** Live project, opened in a new tab. */
  url?: string;
};

export type Certification = { number: string; name: string; issuer: string };

export type ContactInfoItem = { label: string; value: string; href?: string; /** Iconify id */ icon: string };

export type QuickFact = { label: string; value: string };

export type SocialLink = { label: string; href: string; /** Iconify id */ icon: string };
