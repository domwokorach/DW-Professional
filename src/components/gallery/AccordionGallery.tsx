"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { gsap } from "gsap";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cloudinaryImageUrl } from "@/lib/cloudinaryImage";
import type { GalleryItem } from "@/types/gallery";

import "./AccordionGallery.css";

const GalleryLightbox = dynamic(() => import("./GalleryLightbox"), { ssr: false });
const ACTIVE_IMAGE_SIZES = "(max-width: 639px) calc(100vw - 3rem), (max-width: 1023px) 80vw, 52vw";
const COLLAPSED_IMAGE_SIZES = "(max-width: 639px) 400px, (max-width: 1023px) 800px, 76px";
const COLLAPSED_WIDTH = 76;

type Props = {
  items: GalleryItem[];
  defaultIndex?: number;
  expandRatio?: number;
  trigger?: "hover" | "click";
};

// Adapted from the React Bits AccordionGallery-JS-CSS registry component.
export default function AccordionGallery({
  items,
  defaultIndex = 2,
  expandRatio = 0.52,
  trigger = "hover",
}: Props) {
  const [active, setActive] = useState(() => Math.min(Math.max(defaultIndex, 0), items.length - 1));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const viewportRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pointerSelectionRef = useRef<{ index: number; wasActive: boolean } | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const firstRunRef = useRef(true);

  const applyLayout = useCallback(() => {
    timelineRef.current?.kill();
    const compact = window.matchMedia("(max-width: 1023px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (compact) {
      panelRefs.current.forEach((panel) => {
        if (panel) gsap.set(panel, { clearProps: "flexBasis,transform" });
      });
      return;
    }

    const availableWidth = viewportRef.current?.clientWidth ?? window.innerWidth;
    const expandedWidth = Math.min(680, Math.max(320, availableWidth * expandRatio));
    if (firstRunRef.current || reduced) {
      panelRefs.current.forEach((panel, index) => {
        if (panel) gsap.set(panel, { flexBasis: `${index === active ? expandedWidth : COLLAPSED_WIDTH}px` });
      });
      firstRunRef.current = false;
      return;
    }

    const timeline = gsap.timeline();
    panelRefs.current.forEach((panel, index) => {
      if (!panel) return;
      timeline.to(panel, {
        flexBasis: index === active ? expandedWidth : COLLAPSED_WIDTH,
        duration: 0.48,
        ease: "power3.out",
      }, 0);
    });
    timelineRef.current = timeline;
  }, [active, expandRatio]);

  useEffect(() => {
    applyLayout();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(applyLayout);
    observer.observe(viewport);
    return () => {
      observer.disconnect();
      timelineRef.current?.kill();
    };
  }, [applyLayout]);

  const revealPanel = (index: number) => {
    const panel = panelRefs.current[index];
    const viewport = viewportRef.current;
    if (!panel || !viewport) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (window.matchMedia("(max-width: 1023px)").matches) {
      panel.scrollIntoView({ block: "nearest", behavior });
      return;
    }
    const panelRect = panel.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    viewport.scrollTo({
      left: viewport.scrollLeft + panelRect.left - viewportRect.left - (viewportRect.width - panelRect.width) / 2,
      behavior,
    });
  };

  const focusPanel = (index: number) => {
    const next = (index + items.length) % items.length;
    setActive(next);
    panelRefs.current[next]?.focus({ preventScroll: true });
    requestAnimationFrame(() => revealPanel(next));
  };

  const closeLightbox = () => {
    const selectedIndex = lightboxIndex;
    setLightboxIndex(null);
    if (selectedIndex !== null) requestAnimationFrame(() => panelRefs.current[selectedIndex]?.focus());
  };

  return (
    <>
      <div className="gallery-accordion-shell">
        <div ref={viewportRef} className="accordion-gallery-viewport">
          <div className="accordion-gallery" role="group" aria-label="Portfolio image gallery">
            {items.map((item, index) => {
              const selected = index === active;
              return (
                <button
                  key={item.id}
                  ref={(element) => { panelRefs.current[index] = element; }}
                  type="button"
                  className={`ag-panel${selected ? " ag-panel--active" : ""}`}
                  style={{ flexBasis: index === defaultIndex ? `min(${expandRatio * 100}cqw, 680px)` : `${COLLAPSED_WIDTH}px` }}
                  aria-pressed={selected}
                  aria-label={`${item.label}. ${selected ? "Open larger image" : "Select image"}`}
                  onPointerMove={(event) => {
                    if (index !== active && trigger === "hover" && event.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) setActive(index);
                  }}
                  onFocus={() => {
                    setActive(index);
                    requestAnimationFrame(() => revealPanel(index));
                  }}
                  onPointerDown={() => {
                    pointerSelectionRef.current = { index, wasActive: selected };
                  }}
                  onPointerCancel={() => { pointerSelectionRef.current = null; }}
                  onClick={() => {
                    const pointerSelection = pointerSelectionRef.current;
                    pointerSelectionRef.current = null;
                    const wasActive = pointerSelection?.index === index ? pointerSelection.wasActive : selected;
                    if (wasActive) setLightboxIndex(index);
                    else setActive(index);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                      event.preventDefault();
                      focusPanel(index + 1);
                    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                      event.preventDefault();
                      focusPanel(index - 1);
                    }
                  }}
                >
                  <span className="ag-panel__media">
                    {!loaded[item.id] && <span className="ag-panel__placeholder" aria-hidden="true" />}
                    <Image
                      loader={({ src, width }) => cloudinaryImageUrl(src, width)}
                      src={item.image}
                      alt={item.alt}
                      width={item.width}
                      height={item.height}
                      sizes={selected ? ACTIVE_IMAGE_SIZES : COLLAPSED_IMAGE_SIZES}
                      {...(index === defaultIndex ? { priority: true } : { loading: "lazy" as const })}
                      onLoad={() => setLoaded((previous) => ({ ...previous, [item.id]: true }))}
                      className={`ag-panel__image${loaded[item.id] ? " ag-panel__image--loaded" : ""}`}
                      style={{ objectPosition: item.objectPosition ?? "center" }}
                      draggable={false}
                    />
                  </span>
                  <span className="ag-panel__overlay" aria-hidden="true" />
                  <span className="ag-panel__label" aria-hidden="true">
                    <span className="ag-panel__bar" />
                    <span className="ag-panel__text">{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="ag-controls">
          <p className="text-xs text-muted">Select a panel, then select it again to view the larger image.</p>
          <div className="ag-controls__navigation">
            <span className="font-mono text-xs text-muted" aria-live="polite">{active + 1} / {items.length}</span>
            <button type="button" aria-label="Previous gallery panel" onClick={() => focusPanel(active - 1)}><ArrowLeft aria-hidden="true" size={18} /></button>
            <button type="button" aria-label="Next gallery panel" onClick={() => focusPanel(active + 1)}><ArrowRight aria-hidden="true" size={18} /></button>
          </div>
        </div>
      </div>
      {lightboxIndex !== null && (
        <GalleryLightbox items={items} initialIndex={lightboxIndex} onClose={closeLightbox} />
      )}
    </>
  );
}
