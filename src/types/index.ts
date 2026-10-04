export type CoreTech = {
  name: string;
  /** Iconify id. Brands use simple-icons (or logos for multi-colour marks); concepts use tabler. */
  icon: string;
  /** Icon colour; omitted for multi-colour logos, which carry their own colours. */
  color?: string;
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

/** One "Proud moments" item. All share one frame; the media is an image, a video, or (for items
 *  without footage) a stat tile. */
type AchievementBase = {
  /** Display number, e.g. "05 / 05". */
  number: string;
  title: string;
  description: string;
};

type AchievementMedia = {
  src: string;
  /** Image alt text, or the video's accessible name. */
  alt: string;
};

export type Achievement = AchievementBase & (
  /** `position`: CSS object-position, for photos whose subject sits off-centre in the cropped frame. */
  | ({ mediaType: 'image'; position?: string } & AchievementMedia)
  /** Videos are letterboxed (object-fit: contain), never cropped. */
  | ({
      mediaType: 'video';
      poster: string;
      /** Full version with sound, played in the pop-out player (`src` is the muted preview). */
      fullSrc: string;
    } & AchievementMedia)
  | { mediaType: 'stat'; stat: { value: string; badge?: string } }
);

export type Certification = { number: string; name: string; issuer: string };

export type ContactInfoItem = { label: string; value: string; href?: string; /** Iconify id */ icon: string };

export type QuickFact = { label: string; value: string };

export type SocialLink = { label: string; href: string; /** Iconify id */ icon: string };
