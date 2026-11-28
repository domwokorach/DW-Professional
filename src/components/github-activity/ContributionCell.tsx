import { memo } from 'react';
import { describeDay, type ContributionDay } from '@/lib/github-contributions';

type Props = {
  day: ContributionDay;
  week: number;
  row: number;
  tabbable: boolean;
  active: boolean;
  onActivate: (day: ContributionDay, week: number, row: number, el: HTMLElement, touch: boolean) => void;
  onLeave: () => void;
};

/** One day. Its accessible name is the full description, so colour is never the only carrier of the information. */
function ContributionCell({ day, week, row, tabbable, active, onActivate, onLeave }: Props) {
  return (
    <div
      role="gridcell"
      tabIndex={tabbable ? 0 : -1}
      aria-label={describeDay(day)}
      aria-selected={active}
      className="gh-cell"
      data-level={day.level}
      data-active={active || undefined}
      data-pos={`${week}-${row}`}
      style={{ '--c': week } as React.CSSProperties}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onActivate(day, week, row, e.currentTarget, false)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && onLeave()}
      onFocus={(e) => onActivate(day, week, row, e.currentTarget, false)}
      onBlur={onLeave}
      onClick={(e) => onActivate(day, week, row, e.currentTarget, true)}
    />
  );
}

export default memo(ContributionCell);
