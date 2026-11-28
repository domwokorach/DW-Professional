import { ArrowUpRight } from 'lucide-react';
import { GITHUB_PROFILE_URL, GITHUB_USERNAME } from '@/lib/github-contributions';

export default function GitHubProfileLink({ className = 'gh-profile' }: { className?: string }) {
  return (
    <a className={className} href={GITHUB_PROFILE_URL} target="_blank" rel="noopener noreferrer">
      @{GITHUB_USERNAME} on GitHub<span className="sr-only"> (opens in a new tab)</span> <ArrowUpRight aria-hidden="true" size={16} />
    </a>
  );
}
