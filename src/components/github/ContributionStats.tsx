'use client';

import { useMemo } from 'react';
import { computeStats, formatShortDate, plural } from '@/lib/github/stats';
import type { ContributionsPayload } from '@/lib/github/types';
import AnimatedNumber from './AnimatedNumber';

/** Statistics for the selected period only, all derived from the real calendar days. */
export default function ContributionStats({ data }: { data: ContributionsPayload }) {
  const s = useMemo(() => computeStats(data.calendar), [data.calendar]);
  const past = data.period.kind === 'year' && (data.period.year ?? 0) < new Date().getUTCFullYear();
  const items: { label: string; value: React.ReactNode; unit?: string; note: React.ReactNode }[] = [
    { label: 'Total contributions', value: <AnimatedNumber value={s.total} />, note: `${plural(s.totalDays, 'day')} in this period` },
    { label: past ? 'Streak at year end' : 'Current streak', value: <AnimatedNumber value={s.currentStreak} />, unit: s.currentStreak === 1 ? 'day' : 'days', note: s.currentStreak ? 'Consecutive days with activity' : 'No active streak' },
    { label: 'Longest streak', value: <AnimatedNumber value={s.longestStreak} />, unit: s.longestStreak === 1 ? 'day' : 'days', note: s.longestStreakRange ? `${formatShortDate(s.longestStreakRange.start)} – ${formatShortDate(s.longestStreakRange.end)}` : 'No activity yet' },
    { label: 'Most active day', value: <AnimatedNumber value={s.mostActiveDay?.count ?? 0} />, unit: s.mostActiveDay?.count === 1 ? 'contribution' : 'contributions', note: s.mostActiveDay ? <time dateTime={s.mostActiveDay.date}>{formatShortDate(s.mostActiveDay.date)}</time> : 'No activity yet' },
    { label: 'Active days', value: <AnimatedNumber value={s.activeDays} />, unit: `of ${s.totalDays.toLocaleString('en-GB')}`, note: s.totalDays ? `${Math.round((s.activeDays / s.totalDays) * 100)}% of days` : '' },
  ];
  return (
    <section className="gh-stats" aria-label="GitHub statistics">
      {s.range ? <p className="gh-period">Reporting period: <time dateTime={s.range.start}>{formatShortDate(s.range.start)}</time> – <time dateTime={s.range.end}>{formatShortDate(s.range.end)}</time> (UTC)</p> : null}
      <dl className="gh-stat-grid">
        {items.map((i) => (
          <div key={i.label} className="gh-stat">
            <dt>{i.label}</dt>
            <dd><span className="gh-stat__value">{i.value}</span>{i.unit ? <span className="gh-stat__unit"> {i.unit}</span> : null}</dd>
            <dd className="gh-stat__note">{i.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
