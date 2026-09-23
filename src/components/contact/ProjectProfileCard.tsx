"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { Globe } from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";
import { SiGithub } from "react-icons/si";
import { social } from "@/data/navigation";
import { cn } from "@/lib/utils";

// Matches the reference design's feel: a slow initial settle, then a quick
// speed-up on the very first pointer entry so subsequent tilting feels snappy.
const INITIAL_TILT_DURATION_MS = 1200;
const ENTER_TRANSITION_MS = 180;
const SMOOTHING_TAU = 0.14;
const INITIAL_SMOOTHING_TAU = 0.6;

export interface ProjectProfileCardProps {
  name?: string;
  title?: string;
  tagline?: string;
  avatarUrl: string;
  avatarAlt: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  className?: string;
}

/**
 * A pointer-tilt "profile card" for the contact section — hand-ported (not
 * installed) from a Vue-only community component; see the reference source
 * for the original mechanics. Tilt is driven by CSS custom properties set
 * directly on the wrapper element (src/app/globals.css's .profile-card*
 * rules consume them) rather than React state, so tracking the pointer
 * never triggers a re-render.
 */
export default function ProjectProfileCard({
  name = "Dominic Wokorach",
  title = "Full Stack Developer",
  tagline = "Available for freelance projects, collaboration and opportunities.",
  avatarUrl,
  avatarAlt,
  ctaLabel = "Start a Project",
  onCtaClick,
  className,
}: ProjectProfileCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // Reduced-motion users and touch/coarse-pointer devices get the static
    // card — no pointer tracking, no tilt. (framer-motion's useReducedMotion
    // is this project's established convention; see MotionReveal.tsx.)
    if (reduceMotion) return;
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) return;

    const wrap = wrapRef.current;
    const shell = shellRef.current;
    if (!wrap || !shell) return;

    let rafId: number | null = null;
    let running = false;
    let lastTimestamp = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let initialUntil = 0;
    let enterTimer: ReturnType<typeof setTimeout> | null = null;
    let leaveRafId: number | null = null;

    const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);
    const round = (value: number, precision = 3) => parseFloat(value.toFixed(precision));
    const adjust = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) =>
      round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));

    const applyVars = (x: number, y: number) => {
      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;
      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);
      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const vars: Record<string, string> = {
        "--pointer-x": `${percentX}%`,
        "--pointer-y": `${percentY}%`,
        "--background-x": `${adjust(percentX, 0, 100, 35, 65)}%`,
        "--background-y": `${adjust(percentY, 0, 100, 35, 65)}%`,
        "--pointer-from-center": `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        "--pointer-from-top": `${percentY / 100}`,
        "--pointer-from-left": `${percentX / 100}`,
        "--rotate-x": `${round(-(centerX / 5))}deg`,
        "--rotate-y": `${round(centerY / 4)}deg`,
      };
      for (const [key, value] of Object.entries(vars)) wrap.style.setProperty(key, value);
    };

    const step = (timestamp: number) => {
      if (!running) return;
      if (lastTimestamp === 0) lastTimestamp = timestamp;
      const dt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const tau = timestamp < initialUntil ? INITIAL_SMOOTHING_TAU : SMOOTHING_TAU;
      const k = 1 - Math.exp(-dt / tau);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;
      applyVars(currentX, currentY);

      const stillMoving = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;
      if (stillMoving || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTimestamp = 0;
        rafId = null;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTimestamp = 0;
      rafId = requestAnimationFrame(step);
    };

    const setTarget = (x: number, y: number) => {
      targetX = x;
      targetY = y;
      start();
    };

    const toCenter = () => setTarget(shell.clientWidth / 2, shell.clientHeight / 2);

    const offsetsFor = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const handlePointerEnter = (event: PointerEvent) => {
      wrap.classList.add("active");
      shell.classList.add("entering");
      if (enterTimer) clearTimeout(enterTimer);
      enterTimer = setTimeout(() => shell.classList.remove("entering"), ENTER_TRANSITION_MS);
      const { x, y } = offsetsFor(event);
      setTarget(x, y);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const { x, y } = offsetsFor(event);
      setTarget(x, y);
    };

    const handlePointerLeave = () => {
      toCenter();
      const checkSettled = () => {
        const settled = Math.hypot(targetX - currentX, targetY - currentY) < 0.6;
        if (settled) {
          wrap.classList.remove("active");
          leaveRafId = null;
        } else {
          leaveRafId = requestAnimationFrame(checkSettled);
        }
      };
      if (leaveRafId) cancelAnimationFrame(leaveRafId);
      leaveRafId = requestAnimationFrame(checkSettled);
    };

    shell.addEventListener("pointerenter", handlePointerEnter);
    shell.addEventListener("pointermove", handlePointerMove);
    shell.addEventListener("pointerleave", handlePointerLeave);

    currentX = (shell.clientWidth || 0) - 70;
    currentY = 60;
    applyVars(currentX, currentY);
    initialUntil = performance.now() + INITIAL_TILT_DURATION_MS;
    toCenter();

    return () => {
      shell.removeEventListener("pointerenter", handlePointerEnter);
      shell.removeEventListener("pointermove", handlePointerMove);
      shell.removeEventListener("pointerleave", handlePointerLeave);
      wrap.classList.remove("active");
      shell.classList.remove("entering");
      if (enterTimer) clearTimeout(enterTimer);
      if (leaveRafId) cancelAnimationFrame(leaveRafId);
      if (rafId) cancelAnimationFrame(rafId);
      running = false;
    };
  }, [reduceMotion]);

  return (
    <div ref={wrapRef} className={cn("profile-card-wrap w-full max-w-[380px] self-start", className)}>
      <div className="profile-card-glow" aria-hidden="true" />
      <div ref={shellRef} className="profile-card-shell">
        <div className="profile-card">
          <div className="profile-card-glare" aria-hidden="true" />

          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src={avatarUrl}
              alt={avatarAlt}
              fill
              sizes="(min-width: 1024px) 380px, (min-width: 640px) 380px, 100vw"
              quality={80}
              className="profile-card-avatar object-cover"
            />
            <div className="profile-card-scrim" aria-hidden="true" />
          </div>

          <div className="relative z-10 flex flex-col gap-4 p-5">
            <div>
              <h3 className="text-xl font-semibold text-paper">{name}</h3>
              <p className="text-sm text-muted">{title}</p>
            </div>

            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line bg-ink/40 px-2.5 py-1 text-xs font-medium text-paper">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Available for work
            </span>

            <p className="text-sm leading-relaxed text-muted">{tagline}</p>

            <button
              type="button"
              onClick={onCtaClick}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cta px-5 py-3 text-sm font-medium text-cta-fg transition-colors hover:bg-accent hover:text-accent-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
            >
              {ctaLabel}
            </button>

            <div className="flex items-center gap-4 pt-1">
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-muted transition-colors hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <FaLinkedin className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href={social.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-muted transition-colors hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <SiGithub className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href={social.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Portfolio"
                className="text-muted transition-colors hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Globe className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
