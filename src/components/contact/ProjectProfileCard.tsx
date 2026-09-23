"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { Globe } from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";
import { SiGithub } from "react-icons/si";
import { social } from "@/data/navigation";
import { cn } from "@/lib/utils";

// Mirrors the original Vue Bits ProfileCard's tilt-engine timings so the
// hand-ported animation feels identical: a slow initial settle sweeping in
// from an offset corner, then a quick speed-up on first pointer entry.
const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  DEVICE_BETA_OFFSET: 20,
  ENTER_TRANSITION_MS: 180,
} as const;

const SMOOTHING_TAU = 0.14;
const INITIAL_SMOOTHING_TAU = 0.6;

type DeviceOrientationEventConstructorWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

type ProfileCardStyle = CSSProperties & {
  "--behind-glow-color"?: string;
  "--behind-glow-size"?: string;
  "--grain"?: string;
  "--icon"?: string;
  "--inner-gradient"?: string;
};

export interface ProfileCardProps {
  avatarUrl: string;
  iconUrl?: string;
  grainUrl?: string;
  innerGradient?: string;

  behindGlowEnabled?: boolean;
  behindGlowColor?: string;
  behindGlowSize?: string;

  className?: string;

  enableTilt?: boolean;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;

  miniAvatarUrl?: string;

  name?: string;
  title?: string;
  handle?: string;
  status?: string;

  contactText?: string;
  showUserInfo?: boolean;

  onContactClick?: () => void;
}

/**
 * A pointer-tilt "profile card" for the contact section — hand-ported (not
 * installed) from a Vue-only community component (Vue Bits ProfileCard); see
 * the reference source for the original mechanics. Tilt/glow/holo state is
 * driven by CSS custom properties set directly on the wrapper element
 * (src/app/globals.css's .profile-card* rules consume them) rather than
 * React state, so tracking the pointer never triggers a re-render.
 */
export default function ProjectProfileCard({
  avatarUrl,
  iconUrl,
  grainUrl,
  innerGradient,
  behindGlowEnabled = true,
  behindGlowColor,
  behindGlowSize,
  className,
  enableTilt = true,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  miniAvatarUrl,
  name = "Dominic Wokorach",
  title = "Full Stack Developer",
  handle = "domwokorach",
  status = "Available",
  contactText = "Start a Project",
  showUserInfo = true,
  onContactClick,
}: ProfileCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [miniAvatarSrc, setMiniAvatarSrc] = useState(miniAvatarUrl || avatarUrl);
  const [miniAvatarFailed, setMiniAvatarFailed] = useState(false);
  const miniFellBackRef = useRef(false);

  useEffect(() => {
    setMiniAvatarSrc(miniAvatarUrl || avatarUrl);
    setMiniAvatarFailed(false);
    miniFellBackRef.current = false;
  }, [miniAvatarUrl, avatarUrl]);

  const handleMiniAvatarError = () => {
    if (miniFellBackRef.current || miniAvatarSrc === avatarUrl) {
      // Already on the fallback (or there is none) — stop trying so we
      // never loop onError against the same broken source.
      setMiniAvatarFailed(true);
      return;
    }
    miniFellBackRef.current = true;
    setMiniAvatarSrc(avatarUrl);
  };

  useEffect(() => {
    if (!enableTilt) return;
    // Reduced-motion users get the fully static card — no pointer tracking,
    // no tilt, no device-orientation listener.
    if (reduceMotion) return;
    if (typeof window === "undefined") return;

    const wrap = wrapRef.current;
    const shell = shellRef.current;
    if (!wrap || !shell) return;

    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer && !enableMobileTilt) return;

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

    const offsetsFor = (clientX: number, clientY: number) => {
      const rect = shell.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handlePointerEnter = (event: PointerEvent) => {
      wrap.classList.add("active");
      shell.classList.add("entering");
      if (enterTimer) clearTimeout(enterTimer);
      enterTimer = setTimeout(() => shell.classList.remove("entering"), ANIMATION_CONFIG.ENTER_TRANSITION_MS);
      const { x, y } = offsetsFor(event.clientX, event.clientY);
      setTarget(x, y);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const { x, y } = offsetsFor(event.clientX, event.clientY);
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

    let removeDeviceOrientation: (() => void) | null = null;
    let removeMobileEnableListener: (() => void) | null = null;

    if (isFinePointer) {
      shell.addEventListener("pointerenter", handlePointerEnter);
      shell.addEventListener("pointermove", handlePointerMove);
      shell.addEventListener("pointerleave", handlePointerLeave);
    } else if (enableMobileTilt) {
      // Mobile tilt rides the device's gyroscope rather than touch-drag, so
      // it never has to fight normal page scrolling.
      const handleOrientation = (event: DeviceOrientationEvent) => {
        if (event.beta === null || event.gamma === null) return;
        wrap.classList.add("active");
        const beta = event.beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET;
        const gamma = event.gamma;
        const x = clamp(50 + gamma * mobileTiltSensitivity, 0, 100) * (shell.clientWidth / 100);
        const y = clamp(50 + beta * mobileTiltSensitivity, 0, 100) * (shell.clientHeight / 100);
        setTarget(x, y);
      };

      const attachOrientationListener = () => {
        window.addEventListener("deviceorientation", handleOrientation);
        removeDeviceOrientation = () => window.removeEventListener("deviceorientation", handleOrientation);
      };

      const DeviceOrientationEventWithPermission =
        typeof DeviceOrientationEvent !== "undefined"
          ? (DeviceOrientationEvent as DeviceOrientationEventConstructorWithPermission)
          : undefined;

      if (typeof DeviceOrientationEventWithPermission?.requestPermission === "function") {
        // iOS requires an explicit user gesture before granting motion access.
        const requestOnFirstTouch = () => {
          DeviceOrientationEventWithPermission.requestPermission?.()
            .then((permission) => {
              if (permission === "granted") attachOrientationListener();
            })
            .catch(() => {});
        };
        shell.addEventListener("touchstart", requestOnFirstTouch, { once: true });
        removeMobileEnableListener = () => shell.removeEventListener("touchstart", requestOnFirstTouch);
      } else if (typeof window.DeviceOrientationEvent !== "undefined") {
        attachOrientationListener();
      }
    }

    currentX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    currentY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    applyVars(currentX, currentY);
    initialUntil = performance.now() + ANIMATION_CONFIG.INITIAL_DURATION;
    toCenter();

    return () => {
      shell.removeEventListener("pointerenter", handlePointerEnter);
      shell.removeEventListener("pointermove", handlePointerMove);
      shell.removeEventListener("pointerleave", handlePointerLeave);
      removeDeviceOrientation?.();
      removeMobileEnableListener?.();
      wrap.classList.remove("active");
      shell.classList.remove("entering");
      if (enterTimer) clearTimeout(enterTimer);
      if (leaveRafId) cancelAnimationFrame(leaveRafId);
      if (rafId) cancelAnimationFrame(rafId);
      running = false;
    };
  }, [reduceMotion, enableTilt, enableMobileTilt, mobileTiltSensitivity]);

  const staticStyle: ProfileCardStyle = {
    "--behind-glow-color": behindGlowColor,
    "--behind-glow-size": behindGlowSize,
    "--grain": grainUrl ? `url(${grainUrl})` : undefined,
    "--icon": iconUrl ? `url(${iconUrl})` : undefined,
    "--inner-gradient": innerGradient,
  };

  return (
    <div
      ref={wrapRef}
      className={cn("profile-card-wrap w-full max-w-[380px] self-start", className)}
      style={staticStyle}
    >
      {behindGlowEnabled && <div className="profile-card-glow" aria-hidden="true" />}
      <div ref={shellRef} className="profile-card-shell">
        <div className="profile-card">
          <div className="profile-card-avatar-frame">
            {!avatarFailed && (
              <Image
                src={avatarUrl}
                alt={name}
                fill
                sizes="(min-width: 1024px) 380px, (min-width: 640px) 380px, 100vw"
                quality={80}
                className="profile-card-avatar object-cover object-bottom"
                onError={() => setAvatarFailed(true)}
              />
            )}
            <div className="profile-card-top-scrim" aria-hidden="true" />
            <div className="profile-card-bottom-scrim" aria-hidden="true" />
          </div>

          {grainUrl && <div className="profile-card-grain" aria-hidden="true" />}
          {iconUrl && <div className="profile-card-icon" aria-hidden="true" />}
          <div className="profile-card-holo" aria-hidden="true" />
          <div className="profile-card-glare" aria-hidden="true" />

          <div className="profile-card-header">
            <h3 className="text-xl font-semibold text-white drop-shadow-sm">{name}</h3>
            <p className="text-sm text-white/70 drop-shadow-sm">{title}</p>
          </div>

          {showUserInfo && (
            <div className="profile-card-user-info">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-black/60 ring-1 ring-white/20">
                    {!miniAvatarFailed && (
                      <Image
                        src={miniAvatarSrc}
                        alt={`${name} mini avatar`}
                        fill
                        sizes="32px"
                        quality={75}
                        className="object-cover"
                        onError={handleMiniAvatarError}
                      />
                    )}
                  </span>
                  <span className="truncate text-sm font-medium text-white">@{handle}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <a
                    href={social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn profile"
                    className="text-white/60 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <FaLinkedin className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a
                    href={social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub profile"
                    className="text-white/60 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <SiGithub className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a
                    href={social.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Portfolio website"
                    className="text-white/60 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <Globe className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-xs font-medium text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  {status}
                </span>
                <button
                  type="button"
                  onClick={onContactClick}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-medium text-black transition-colors hover:bg-accent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {contactText}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
