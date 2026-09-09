export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="animated-blob-a absolute -top-40 right-[-10%] h-[36rem] w-[36rem] rounded-full bg-accent/25 blur-[120px]" />
      <div className="animated-blob-b absolute top-1/3 left-[-15%] h-[30rem] w-[30rem] rounded-full bg-accent2/20 blur-[120px]" />
      <div className="animated-blob-c absolute bottom-[-10%] right-1/4 h-[26rem] w-[26rem] rounded-full bg-accent3/10 blur-[120px]" />
      <div className="grid-bg absolute inset-0 opacity-40" />
    </div>
  );
}
