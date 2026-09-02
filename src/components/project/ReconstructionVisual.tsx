const panels = [
  { label: "UI", detail: "Desktop / Mobile" },
  { label: "Review", detail: "Issue tracking" },
  { label: "Testing", detail: "Release status" },
  { label: "Release", detail: "Git · Jenkins" },
];

export default function ReconstructionVisual() {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-xl border border-line bg-gradient-to-br from-white/[0.04] to-transparent p-5">
      <span className="absolute right-4 top-4 rounded-full border border-line bg-ink/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
        Portfolio Reconstruction
      </span>

      <div className="mt-8 grid grid-cols-2 gap-2.5">
        {panels.map((panel) => (
          <div
            key={panel.label}
            className="rounded-lg border border-line bg-ink/40 px-3 py-2.5"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              {panel.label}
            </p>
            <p className="mt-1 text-xs text-muted">{panel.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-1.5" aria-hidden>
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="h-1.5 flex-1 rounded-full bg-white/10">
          <span className="block h-full w-2/3 rounded-full bg-accent/60" />
        </span>
      </div>
    </div>
  );
}
