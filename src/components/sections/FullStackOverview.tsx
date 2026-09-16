"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import MotionReveal from "@/components/ui/MotionReveal";
import { IconCloud } from "@/components/ui/icon-cloud";
import ProtectedParagraph from "@/components/ui/ProtectedParagraph";
import { fullStackTech } from "@/data/fullStackTech";

/**
 * Reads the resolved theme after mount so the icon cloud's brand marks are
 * rendered in a color that stays legible against the section background in
 * both modes (server render defaults to dark to avoid a flash on the more
 * common theme).
 */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export default function FullStackOverview() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isLight = mounted && resolvedTheme === "light";
  const iconColor = isLight ? "#171717" : "#f5f5f5";

  const labels = useMemo(() => fullStackTech.map((tech) => tech.name), []);

  const icons = useMemo(
    () =>
      fullStackTech.map(({ Icon, name }) => (
        <Icon key={name} size={40} color={iconColor} title={name} />
      )),
    [iconColor]
  );

  return (
    <div className="mt-16 border-t border-line pt-16">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <MotionReveal className="text-center lg:text-left">
          <p className="font-mono text-xs tracking-widest text-muted">
            FULL STACK OVERVIEW
          </p>
          <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
            A broad, connected engineering toolkit.
          </h3>
          <ProtectedParagraph className="mx-auto mt-4 max-w-md text-base leading-[1.7] text-muted lg:mx-0">
            Technologies, frameworks, platforms, tools, and engineering
            practices across my full-stack development workflow.
          </ProtectedParagraph>
          <p className="mt-4 hidden text-xs text-muted lg:block">
            Drag to rotate, hover an icon for its name, or pause the motion.
          </p>
        </MotionReveal>

        <MotionReveal delay={0.1} className="flex justify-center">
          <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
            <IconCloud icons={icons} labels={labels} minSize={220} maxSize={400} />
          </div>
        </MotionReveal>
      </div>
    </div>
  );
}
