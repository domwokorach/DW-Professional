/** Inclusive month count between two "YYYY-MM" values (Jun–Aug → 3), matching LinkedIn-style durations. */
export function monthsBetween(startIso: string, endIso?: string, now = new Date()): number {
  const [sy, sm] = startIso.split('-').map(Number);
  const [ey, em] = endIso ? endIso.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
  return Math.max(1, (ey - sy) * 12 + (em - sm) + 1);
}

const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** 17 → "1 year 5 months". */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years && unit(years, 'year'), rest && unit(rest, 'month')].filter(Boolean).join(' ');
}
