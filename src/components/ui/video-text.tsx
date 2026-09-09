"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Renders `children` as normal accessible text, then — once the video can
 * play and the visitor doesn't prefer reduced motion — paints the video
 * live into the glyph shapes via a canvas using "source-in" compositing
 * (draw text, then draw the video frame only where those pixels exist).
 * The real text stays in the DOM at all times (just made transparent once
 * the canvas is ready), so screen readers, SEO, and no-JS/video-failure
 * fallbacks all see the same single heading — no duplicate announcement.
 */
export function VideoText({
  src,
  children,
  className,
}: {
  src: string;
  children: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const showVideoEffect = canPlay && !videoError && !reduceMotion;

  // The video's `src` is present in the server-rendered HTML, so the browser
  // can start loading (and fire `loadeddata`) before React hydrates and
  // attaches the JSX event handlers below — missing the event entirely.
  // Checking `readyState` on mount catches that race; the handlers below
  // still cover the normal case where loading finishes after hydration.
  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 2) setCanPlay(true);
  }, []);

  useEffect(() => {
    if (!showVideoEffect) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const container = containerRef.current;
    const textEl = textRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !video || !container || !textEl || !ctx) return;

    let raf = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const draw = () => {
      const rect = container.getBoundingClientRect();
      const style = window.getComputedStyle(textEl);

      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.fillText(children, 0, rect.height / 2, rect.width);

      ctx.globalCompositeOperation = "source-in";
      ctx.drawImage(video, 0, 0, rect.width, rect.height);
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(draw);
    };

    video.play().catch(() => setVideoError(true));
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [showVideoEffect, children]);

  return (
    <span ref={containerRef} className={cn("relative inline-block", className)}>
      <span ref={textRef} className={showVideoEffect ? "text-transparent" : undefined}>
        {children}
      </span>
      {showVideoEffect ? (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      ) : null}
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        autoPlay
        playsInline
        preload="auto"
        aria-hidden="true"
        className="hidden"
        onLoadedData={() => setCanPlay(true)}
        onError={() => setVideoError(true)}
      />
    </span>
  );
}
