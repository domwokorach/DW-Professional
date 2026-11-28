import { Accessibility, Blocks, Braces, FlaskConical, GitBranch, GitPullRequestArrow, Network, Rocket, ScanSearch, ShieldCheck, Workflow, type LucideIcon } from 'lucide-react';
import type { EngineeringIcon as IconName } from '@/data/engineering';

const ICONS: Record<IconName, LucideIcon> = {
  testing: FlaskConical, jenkins: Workflow, actions: GitPullRequestArrow, typescript: Braces, quality: ScanSearch,
  security: ShieldCheck, accessibility: Accessibility, vercel: Rocket, source: GitBranch, architecture: Network,
};

/** One stroke width for all ten icons so the set reads as one family. Decorative: the card title carries the meaning. */
export default function EngineeringIcon({ name }: { name: IconName }) {
  const Icon = ICONS[name] ?? Blocks;
  return <Icon className="eng-icon" size={22} strokeWidth={1.5} aria-hidden="true" focusable="false" />;
}
