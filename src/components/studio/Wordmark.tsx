/** Brand name set letter by letter so it can justify across the full width and spread on scroll. */
export default function Wordmark({ name }: { name: string }) {
  return (
    <div className="wordmark" role="img" aria-label={name}>
      {name.toUpperCase().split('').map((c, i) => (
        <span key={i} className="wm-letter" aria-hidden="true">
          {c}
        </span>
      ))}
    </div>
  );
}
