import { memo } from 'react';
import { describeDay, type CalendarCell } from '@/lib/github/stats';

interface Props {
  cell: CalendarCell;
  tabbable: boolean;
  selected: boolean;
  register: (date: string, el: HTMLButtonElement | null) => void;
}

/** One day. Memoised: moving the pointer re-renders only the cells whose tabbable/selected flag changed. */
const ContributionCell = memo(function ContributionCell({ cell, tabbable, selected, register }: Props) {
  const { day, week, row, level } = cell;
  return (
    <button
      ref={(el) => register(day.date, el)}
      type="button"
      className="gh-cell"
      data-level={level}
      data-date={day.date}
      aria-label={describeDay(day)}
      aria-pressed={selected}
      tabIndex={tabbable ? 0 : -1}
      style={{ gridColumn: week + 2, gridRow: row + 2, ['--gh-delay' as string]: `${week * 9 + row * 3}ms` }}
    />
  );
});

export default ContributionCell;
