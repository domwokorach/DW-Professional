/**
 * Fixed, blurred decorative colour fields behind the page. The orbs sit partly off-screen, so a
 * fixed, clipped layer holds them: off-screen parts can't widen the page (iOS Safari can pan
 * sideways to fixed content that overflows).
 */
export default function BackgroundOrbs() {
  return (
    <div className="orbs" aria-hidden="true">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
    </div>
  );
}
