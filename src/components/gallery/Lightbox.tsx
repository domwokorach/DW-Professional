"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { GalleryCollection } from "@/types/gallery";

export default function Lightbox({
  collection,
  initialIndex,
  onClose,
}: {
  collection: GalleryCollection;
  initialIndex: number;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const total = collection.media.length;
  const current = collection.media[index];

  const goPrev = useCallback(() => {
    videoRef.current?.pause();
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    videoRef.current?.pause();
    setIndex((i) => (i + 1) % total);
  }, [total]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () =>
      dialog?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    focusable()?.[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusable();
      if (!items || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [goPrev, goNext, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 sm:p-8"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${collection.title} — image ${index + 1} of ${total}`}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex h-full w-full max-w-6xl flex-col items-center justify-center"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close full-screen view"
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md transition-colors hover:border-white/30 hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>

          <div className="relative flex h-full max-h-[80vh] w-full items-center justify-center">
            {current.type === "image" ? (
              <div className="relative h-full w-full">
                <Image
                  src={current.src}
                  alt={current.alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            ) : (
              <video
                ref={videoRef}
                controls
                playsInline
                preload="metadata"
                aria-label={current.alt}
                className="h-full max-h-[80vh] w-full object-contain"
              >
                <source src={current.src} type="video/mp4" />
              </video>
            )}
          </div>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous image"
                className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md transition-colors hover:border-white/30 hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:left-2"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next image"
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md transition-colors hover:border-white/30 hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:right-2"
              >
                <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
            </>
          )}

          <p className="mt-4 font-mono text-xs text-white/70 [font-variant-numeric:tabular-nums]">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
