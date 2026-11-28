import { describePeriod, formatShortDate, type ContributionPeriod, type ContributionStats as Stats } from '@/lib/github-contributions';
import CountUp from './CountUp';

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Totals and streaks for the selected period, with the exact date range stated. */
export default function ContributionStats({ stats, period }: { stats: Stats; period: ContributionPeriod }) {
  const items = [
    { k: 'Total contributions', v: <CountUp value={stats.total} />, note: 'in this period' },
    { k: stats.streakIsCurrent ? 'Current streak' : 'Streak at period end', v: <CountUp value={stats.currentStreak} />, note: plural(stats.currentStreak, 'day', 'days') },
    { k: 'Longest streak', v: <CountUp value={stats.longestStreak} />, note: plural(stats.longestStreak, 'day', 'days') },
    {
      k: 'Most active day',
      v: stats.mostActive ? <CountUp value={stats.mostActive.count} /> : <span>—</span>,
      note: stats.mostActive ? `on ${formatShortDate(stats.mostActive.date)}` : 'no activity',
    },
    { k: 'Active days', v: <CountUp value={stats.activeDays} />, note: plural(stats.activeDays, 'day with activity', 'days with activity') },
  ];
  return (
    <div className="gh-stats-block">
      <p className="gh-range">Reporting period: <time dateTime={period.from}>{describePeriod(period).split(' – ')[0]}</time> – <time dateTime={period.to}>{describePeriod(period).split(' – ')[1]}</time> (UTC)</p>
      <dl className="gh-stats">
        {items.map((i) => (
          <div key={i.k} className="gh-stat">
            <dt>{i.k}</dt>
            <dd><b>{i.v}</b><small>{i.note}</small></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
