"use client";

import { AnimatedSpan, Terminal, TypingAnimation } from "@/components/ui/terminal";
import type { TerminalSpec } from "@/types/caseStudy";

function TerminalFooter({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 bg-white/[0.02] px-4 py-4 sm:px-8">
      <span className="font-mono text-[11px] uppercase tracking-widest text-accent">
        Portfolio Reconstruction
      </span>
      <span className="text-white/20" aria-hidden="true">
        ·
      </span>
      <p className="font-mono text-xs text-white/50">{tags.join(" · ")}</p>
    </div>
  );
}

function TerminalChrome({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:px-5"
      aria-hidden="true"
    >
      <span className="flex gap-1.5">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
      </span>
      <p className="font-mono text-xs text-white/50">{label}</p>
    </div>
  );
}

export default function TerminalCard({ terminal }: { terminal: TerminalSpec }) {
  const elements = terminal.blocks.flatMap((block, bi) => [
    <TypingAnimation key={`cmd-${bi}`} className={bi > 0 ? "mt-5 block" : "block"}>
      {`$ ${block.command}`}
    </TypingAnimation>,
    ...(block.lines ?? []).map((line, li) => (
      <AnimatedSpan
        key={`line-${bi}-${li}`}
        className={`block ${line.kind === "success" ? "text-emerald-400" : "text-neutral-400"}`}
      >
        {line.text}
      </AnimatedSpan>
    )),
  ]);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-neutral-950 shadow-2xl">
      <TerminalChrome label={terminal.label} />

      {/*
        Real, always-present transcript for screen readers, no-JS and search
        engines — the animated copy below is a purely decorative, aria-hidden
        duplicate so the progressive typing effect never hides real content.
      */}
      <div className="sr-only">
        <p>Terminal transcript: {terminal.label}</p>
        {terminal.blocks.map((block, bi) => (
          <p key={bi}>
            {`$ ${block.command}. `}
            {(block.lines ?? []).map((line) => line.text).join(". ")}
          </p>
        ))}
      </div>

      <div
        tabIndex={0}
        role="group"
        aria-label={`${terminal.label} terminal transcript, scrollable`}
        className="w-full max-w-none overflow-x-auto p-4 text-xs leading-7 text-neutral-300 sm:p-8 sm:text-sm md:text-base"
      >
        <Terminal sequence startOnView aria-hidden="true" className="block">
          {elements}
        </Terminal>
      </div>

      <TerminalFooter tags={terminal.tags} />
    </div>
  );
}
