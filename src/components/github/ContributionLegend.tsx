import { levelRanges, rangeText } from '@/lib/github/client';
import type { ContributionCalendar } from '@/lib/github/types';

/** Less → More, with the real count range of each step as its tooltip and screen-reader text. */
export default function ContributionLegend({ calendar }: { calendar: ContributionCalendar | null }) {
  const ranges = calendar ? levelRanges(calendar) : [];
  return (
    <div className="gh-legend" role="group" aria-label="Contribution intensity">
      <span aria-hidden="true">Less</span>
      <ul className="gh-legend__scale">
        {[0, 1, 2, 3, 4].map((level) => (
          <li key={level} className="gh-cell gh-cell--static" data-level={level} title={calendar ? rangeText(ranges[level] ?? null, level) : undefined}>
            <span className="sr-only">{calendar ? rangeText(ranges[level] ?? null, level) : `Level ${level}`}</span>
          </li>
        ))}
      </ul>
      <span aria-hidden="true">More</span>
    </div>
  );
}
