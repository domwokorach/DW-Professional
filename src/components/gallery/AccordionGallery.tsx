"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types/gallery";

const DESKTOP_SIZES = "(max-width: 767px) 78vw, (max-width: 1023px) 40vw, 30vw";

export default function AccordionGallery({ items }: { items: GalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const panelRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusPanel = (index: number) => {
    const clamped = (index + items.length) % items.length;
    panelRefs.current[clamped]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusPanel(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusPanel(index - 1);
    }
  };

  return (
    <>
      {/* Mobile: scrollable snap cards */}
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative h-[300px] w-[78vw] shrink-0 snap-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
          >
            <Image
              src={item.image}
              alt={item.alt}
              fill
              loading="lazy"
              sizes={DESKTOP_SIZES}
              className="object-cover"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
              aria-hidden
            />
            <GalleryCaption item={item} />
          </div>
        ))}
      </div>

      {/* Tablet & desktop: horizontal accordion */}
      <div aria-label="Gallery" className="hidden h-[440px] gap-2 overflow-x-auto md:flex lg:h-[520px]">
        {items.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={item.id}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
              type="button"
              aria-pressed={isActive}
              aria-label={buildAccessibleLabel(item)}
              onMouseEnter={() => setActiveIndex(i)}
              onFocus={() => setActiveIndex(i)}
              onClick={() => setActiveIndex(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className={cn(
                "group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-[flex-grow,flex-basis] duration-500 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none",
                isActive ? "flex-[1_1_auto]" : "flex-[0_0_72px] lg:flex-[0_0_88px]",
              )}
            >
              <Image
                src={item.image}
                alt={item.alt}
                fill
                loading={i === 0 ? "eager" : "lazy"}
                sizes={DESKTOP_SIZES}
                className={cn(
                  "object-cover transition-transform duration-700 ease-out motion-reduce:transition-none",
                  isActive && "scale-[1.03]",
                )}
              />
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent transition-opacity duration-500 motion-reduce:transition-none",
                  isActive ? "opacity-100" : "opacity-0",
                )}
                aria-hidden
              />
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 transition-all duration-500 motion-reduce:transition-none",
                  isActive ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
                )}
                aria-hidden
              >
                <GalleryCaption item={item} />
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function GalleryCaption({ item }: { item: GalleryItem }) {
  return (
    <div className="relative p-4 sm:p-6">
      {item.category && (
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
          {item.category}
        </p>
      )}
      {item.title && (
        <p className="mt-1 text-base font-medium text-white sm:text-lg">{item.title}</p>
      )}
      {item.description && (
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-white/70 sm:text-sm">
          {item.description}
        </p>
      )}
    </div>
  );
}

function buildAccessibleLabel(item: GalleryItem) {
  const parts = [item.category, item.title].filter(Boolean);
  return parts.length > 0 ? `${parts.join(" — ")}: ${item.alt}` : item.alt;
}
