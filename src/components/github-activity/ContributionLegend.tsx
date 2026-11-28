/** Less → More key for the five intensity levels. */
export default function ContributionLegend() {
  return (
    <div className="gh-legend" role="img" aria-label="Contribution intensity from less to more, five levels">
      <span aria-hidden="true">Less</span>
      {[0, 1, 2, 3, 4].map((l) => (
        <i key={l} className="gh-cell gh-cell--key" data-level={l} aria-hidden="true" />
      ))}
      <span aria-hidden="true">More</span>
    </div>
  );
}
