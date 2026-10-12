// Corner cobwebs: radial strands plus sagging concentric threads, generated deterministically at module load
// so server and client markup always match.
const SIZE = 220;
const ANGLES = [2, 15, 28, 42, 56, 70, 83].map((d) => (d * Math.PI) / 180);
const RINGS = [20, 42, 66, 92, 122, 156];

const pt = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;

const radials = ANGLES.map((a) => `M0 0L${pt(SIZE * 1.1, a)}`).join('');

// Each ring thread bows toward the corner between neighbouring strands, with a small fixed irregularity.
const rings = RINGS.map((r, i) =>
  ANGLES.slice(0, -1)
    .map((a, j) => {
      const wobble = 1 + 0.04 * Math.sin(i * 2.3 + j * 1.7);
      const b = ANGLES[j + 1];
      const mid = (a + b) / 2;
      return `M${pt(r * wobble, a)}Q${pt(r * 0.86 * wobble, mid)} ${pt(r * (1 + 0.03 * Math.cos(j + i)), b)}`;
    })
    .join(''),
);

const highlightRings = new Set([1, 3, 5]);

function Web({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`hw-web hw-web-${side}`}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} focusable="false">
        <g className="hw-web-sway">
          <path className="hw-web-radial" d={radials} />
          {rings.map((d, i) => (
            <path key={i} className={highlightRings.has(i) ? 'hw-web-ring hw-web-ring-hi' : 'hw-web-ring'} d={d} />
          ))}
        </g>
      </svg>
    </div>
  );
}

export default function HalloweenSpiderwebs() {
  return (
    <div className="hw-webs" aria-hidden="true">
      <Web side="left" />
      <Web side="right" />
    </div>
  );
}
