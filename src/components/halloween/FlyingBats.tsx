// Bats flying across the viewport. Pure server-rendered markup + CSS keyframes (no client JS, no
// hydration risk, nothing to clean up). Flight paths are sampled from smooth curves into keyframes.
type Flight = {
  dir: 1 | -1; // 1 = left→right
  y: number; // baseline height, vh
  amp: number; // wander amplitude, vh
  freq: number; // wander cycles per crossing
  phase: number;
  swoopAt: number; // 0..1 position of the dive
  swoopDepth: number; // vh
  scale: number;
  duration: number; // s for one crossing + off-screen gap
  delay: number;
  flap: number; // s per flap cycle
};

const FLIGHTS: Flight[] = [
  { dir: 1, y: 22, amp: 9, freq: 1.6, phase: 0.4, swoopAt: 0.55, swoopDepth: 22, scale: 1, duration: 26, delay: 1, flap: 2.6 },
  { dir: -1, y: 48, amp: 12, freq: 1.2, phase: 2.1, swoopAt: 0.35, swoopDepth: 26, scale: 0.72, duration: 34, delay: 9, flap: 2.2 },
  { dir: 1, y: 70, amp: 7, freq: 2.1, phase: 4.0, swoopAt: 0.7, swoopDepth: 16, scale: 1.25, duration: 42, delay: 16, flap: 3.1 },
  { dir: -1, y: 15, amp: 8, freq: 1.9, phase: 1.3, swoopAt: 0.5, swoopDepth: 20, scale: 0.55, duration: 30, delay: 23, flap: 1.9 },
  { dir: 1, y: 38, amp: 10, freq: 1.4, phase: 5.2, swoopAt: 0.25, swoopDepth: 24, scale: 0.85, duration: 38, delay: 30, flap: 2.8 },
];

const STEPS = 48;
const ACTIVE = 0.62; // share of each cycle spent crossing; the rest is off-screen so the loop never visibly resets

function keyframes(f: Flight, i: number) {
  const point = (u: number) => {
    // Speed varies along the crossing (bursts and glides).
    const t = u + (0.05 * Math.sin(2 * Math.PI * u * 2 + f.phase)) / (2 * Math.PI) * 2;
    const x0 = f.dir === 1 ? -18 : 118;
    const x = x0 + f.dir * t * 136;
    const swoop = f.swoopDepth * Math.exp(-(((t - f.swoopAt) / 0.09) ** 2));
    const y = f.y + f.amp * Math.sin(2 * Math.PI * f.freq * t + f.phase) + swoop;
    return { x, y };
  };
  const frames: string[] = [];
  for (let s = 0; s <= STEPS; s++) {
    const u = s / STEPS;
    const a = point(u);
    const b = point(Math.min(1, u + 0.01));
    const prev = point(Math.max(0, u - 0.01));
    const slope = ((b.y - prev.y) / Math.max(0.01, Math.abs(b.x - prev.x) * 0.56)) * 16; // vh→vw-ish aspect, degrees
    const tilt = Math.max(-26, Math.min(26, slope)) * f.dir;
    const depth = f.scale * (1 + 0.22 * Math.sin(2 * Math.PI * u + f.phase));
    const pct = (u * ACTIVE * 100).toFixed(2);
    frames.push(
      `${pct}%{transform:translate3d(${a.x.toFixed(2)}vw,${a.y.toFixed(2)}vh,0) rotate(${tilt.toFixed(1)}deg) scale(${(depth * f.dir).toFixed(3)},${depth.toFixed(3)})}`,
    );
  }
  frames.push(`100%{transform:translate3d(${f.dir === 1 ? -18 : 118}vw,${f.y}vh,0) scale(${f.dir * f.scale},${f.scale})}`);
  return `@keyframes hw-fly-${i}{${frames.join('')}}`;
}

const CSS = FLIGHTS.map(keyframes).join('');

function BatSvg({ flap }: { flap: number }) {
  const wing =
    'M52 23C60 12 74 8 98 13C92 17 90 21 92 27C86 24 82 26 80 31C76 27 70 28 66 34C64 31 59 30 54 31Z';
  return (
    <svg viewBox="0 0 100 50" focusable="false" style={{ ['--hw-flap' as string]: `${flap}s` }}>
      <g transform="matrix(-1 0 0 1 100 0)">
        <path className="hw-bat-wing" d={wing} />
      </g>
      <path className="hw-bat-wing" d={wing} />
      <path className="hw-bat-body" d="M46.8 16.5L47.6 11.5L49.6 15.2H50.4L52.4 11.5L53.2 16.5C54.2 18.5 54.2 20.5 53.4 22.5C54 27 52.6 32 50 36C47.4 32 46 27 46.6 22.5C45.8 20.5 45.8 18.5 46.8 16.5Z" />
    </svg>
  );
}

export default function FlyingBats() {
  return (
    <div className="hw-bats" aria-hidden="true">
      <style>{CSS}</style>
      {FLIGHTS.map((f, i) => (
        <div
          key={i}
          className="hw-bat"
          style={{ animation: `hw-fly-${i} ${f.duration}s linear ${f.delay}s infinite` }}
        >
          <BatSvg flap={f.flap} />
        </div>
      ))}
    </div>
  );
}
