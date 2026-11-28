import { LinkIcon } from '@/components/animate-ui/icons/link';
import { IconLink } from '@/components/ui';
import type { Project } from '@/types';

/** The project's live site, opened in a new tab. Renders nothing for projects without a URL. */
export default function ProjectExternalLink({ project: p }: { project: Project }) {
  if (!p.url) return null;
  return (
    <IconLink
      className="xp-link"
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${p.linkLabel ?? 'View project'}: ${p.title} live project (opens in a new tab)`}
      icon={LinkIcon}
      iconSize={14}
    >
      {p.linkLabel ?? 'View project'}
    </IconLink>
  );
}
