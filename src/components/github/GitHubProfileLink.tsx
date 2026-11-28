import { ArrowUpRight } from 'lucide-react';
import { GITHUB_LOGIN, GITHUB_PROFILE_URL } from '@/lib/github/types';

export default function GitHubProfileLink({ className = '' }: { className?: string }) {
  return (
    <a className={`gh-profile-link ${className}`.trim()} href={GITHUB_PROFILE_URL} target="_blank" rel="noopener noreferrer">
      <span>@{GITHUB_LOGIN} on GitHub</span>
      <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.75} />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
