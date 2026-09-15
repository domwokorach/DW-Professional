export interface ExperienceItem {
  year: string;
  role: string;
  org: string;
  location: string;
  period: string;
  focus: string;
  points: string[];
  tags: string[];
  /** Reduces visual emphasis for non-engineering entries (e.g. a career break) while keeping the timeline transparent. */
  muted?: boolean;
}
