const nodes = [
  { cx: 50, cy: 18, r: 6, color: "#5b8def" },
  { cx: 22, cy: 40, r: 4.5, color: "#8b7bf0" },
  { cx: 50, cy: 40, r: 4.5, color: "#8b7bf0" },
  { cx: 78, cy: 40, r: 4.5, color: "#8b7bf0" },
  { cx: 12, cy: 62, r: 3, color: "#6ee7ff" },
  { cx: 32, cy: 62, r: 3, color: "#6ee7ff" },
  { cx: 42, cy: 62, r: 3, color: "#e2e8f0" },
  { cx: 58, cy: 62, r: 3, color: "#e2e8f0" },
  { cx: 68, cy: 62, r: 3, color: "#6ee7ff" },
  { cx: 88, cy: 62, r: 3, color: "#34d399" },
];

const links: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 4],
  [1, 5],
  [2, 6],
  [2, 7],
  [3, 8],
  [3, 9],
];

export default function OrgGraphPreview() {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-xl border border-line bg-gradient-to-br from-white/[0.04] to-transparent p-5">
      <span className="absolute right-4 top-4 rounded-full border border-line bg-ink/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
        Organisation Graph
      </span>

      <svg
        viewBox="0 0 100 78"
        className="mt-6 h-full w-full"
        role="img"
        aria-label="Preview of an interactive organisation graph"
      >
        {links.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={nodes[a].cx}
            y1={nodes[a].cy}
            x2={nodes[b].cx}
            y2={nodes[b].cy}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={0.6}
          />
        ))}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.cx}
            cy={n.cy}
            r={n.r}
            fill={n.color}
            fillOpacity={0.22}
            stroke={n.color}
            strokeWidth={0.8}
          />
        ))}
      </svg>

      <div className="mt-4 flex items-center gap-1.5" aria-hidden>
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="h-1.5 flex-1 rounded-full bg-white/10">
          <span className="block h-full w-3/4 rounded-full bg-accent/60" />
        </span>
      </div>
    </div>
  );
}
