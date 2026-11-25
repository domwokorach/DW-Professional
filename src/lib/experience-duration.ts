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

/** Months covered by a set of periods; overlaps (e.g. Sky vs freelance) are counted once, not summed. */
export function totalMonths(periods: { start: string; end?: string }[], now = new Date()): number {
  const index = (iso: string) => { const [y, m] = iso.split('-').map(Number); return y * 12 + m - 1; };
  const nowIndex = now.getFullYear() * 12 + now.getMonth();
  const spans = periods.map((p) => [index(p.start), p.end ? index(p.end) : nowIndex] as const).sort((a, b) => a[0] - b[0]);
  let total = 0;
  let [from, to] = spans[0] ?? [0, -1];
  for (const [s, e] of spans.slice(1)) {
    if (s <= to + 1) to = Math.max(to, e);
    else { total += to - from + 1; [from, to] = [s, e]; }
  }
  return spans.length ? total + to - from + 1 : 0;
}
