import { useTheme } from '~/theme';

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');

/** The five intensity steps from the website's gold token (same ramp as src/styles/github.css). */
export function useContributionColors() {
  const t = useTheme();
  const gold = rgb(t.accent);
  const empty = t.dark ? 'rgba(236,232,217,0.08)' : 'rgba(37,35,63,0.07)';
  return { levels: [empty, `rgba(${gold},0.38)`, `rgba(${gold},0.62)`, `rgba(${gold},0.84)`, t.accent] as const, t };
}
