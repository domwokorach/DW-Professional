import FlyingBats from './FlyingBats';
import HalloweenSpiderwebs from './HalloweenSpiderwebs';

/** Seasonal decoration layer. Remove this component (and halloween.css) from app/layout.tsx to retire it. */
export default function HalloweenLayer() {
  return (
    <div className="hw-layer" aria-hidden="true">
      <HalloweenSpiderwebs />
      <FlyingBats />
    </div>
  );
}

export { FlyingBats, HalloweenSpiderwebs };
