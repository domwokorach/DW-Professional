'use client';

interface Props {
  years: number[];
  /** null = rolling last 12 months. */
  value: number | null;
  onChange: (year: number | null) => void;
  disabled?: boolean;
}

/** Period picker: the rolling year plus every year GitHub reports activity for. A pressed-button group, one tab stop each. */
export default function ContributionYearSelector({ years, value, onChange, disabled }: Props) {
  const options: { key: string; label: string; year: number | null }[] = [{ key: 'rolling', label: 'Last 12 months', year: null }, ...years.map((y) => ({ key: String(y), label: String(y), year: y }))];
  return (
    <div className="gh-years" role="group" aria-label="Reporting period">
      {options.map((o) => (
        <button key={o.key} type="button" className="gh-year" aria-pressed={o.year === value} disabled={disabled && o.year !== value} onClick={() => o.year !== value && onChange(o.year)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
