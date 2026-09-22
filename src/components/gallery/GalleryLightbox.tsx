"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { cloudinaryImageUrl } from "@/lib/cloudinaryImage";
import type { GalleryItem } from "@/types/gallery";

export default function GalleryLightbox({
  items,
  initialIndex,
  onClose,
}: {
  items: GalleryItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const item = items[index];

  const goPrev = useCallback(() => setIndex((current) => (current - 1 + items.length) % items.length), [items.length]);
  const goNext = useCallback(() => setIndex((current) => (current + 1) % items.length), [items.length]);

  useEffect(() => setLoaded(false), [index]);

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const focusable = () => Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])") ?? [],
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "Tab") {
        const controls = focusable();
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!dialogRef.current?.contains(event.target as Node)) closeRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [goNext, goPrev]);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-3 text-white sm:p-6"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-lightbox-title"
        aria-describedby="gallery-lightbox-count"
        className="relative flex h-full w-full max-w-7xl flex-col"
        onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const distance = event.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(distance) > 50) (distance > 0 ? goPrev : goNext)();
          touchStartX.current = null;
        }}
      >
        <div className="flex items-center justify-between gap-4 pb-3">
          <div className="min-w-0">
            <h2 id="gallery-lightbox-title" className="truncate text-base font-medium sm:text-lg">{item.title}</h2>
            <p id="gallery-lightbox-count" className="font-mono text-xs text-white/70">
              {item.year ? `${item.year} · ` : ""}{index + 1} of {items.length}
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close gallery lightbox" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 hover:bg-white/20 focus-visible:outline-white">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="relative min-h-0 flex-1">
          {!loaded && <span className="absolute inset-0 animate-pulse rounded-lg bg-white/10 motion-reduce:animate-none" aria-hidden="true" />}
          <Image
            key={item.id}
            loader={({ src, width }) => cloudinaryImageUrl(src, width)}
            src={item.image}
            alt={item.alt}
            fill
            sizes="100vw"
            onLoad={() => setLoaded(true)}
            className={`object-contain transition-opacity duration-200 motion-reduce:transition-none ${loaded ? "opacity-100" : "opacity-0"}`}
          />
          <button type="button" onClick={goPrev} aria-label="Previous image" className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/70 hover:bg-black focus-visible:outline-white sm:left-3">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={goNext} aria-label="Next image" className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/70 hover:bg-black focus-visible:outline-white sm:right-3">
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
