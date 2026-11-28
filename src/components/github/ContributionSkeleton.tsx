/** Same footprint as the loaded card, so the page doesn't shift when data arrives. */
export default function ContributionSkeleton() {
  return (
    <div className="gh-skeleton" aria-busy="true">
      <span className="sr-only" role="status">Loading GitHub activity</span>
      <div className="gh-skeleton__grid" aria-hidden="true">{Array.from({ length: 7 * 26 }, (_, i) => <i key={i} />)}</div>
      <div className="gh-skeleton__stats" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <b key={i} />)}</div>
    </div>
  );
}
