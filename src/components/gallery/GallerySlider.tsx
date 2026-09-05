"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Expand, Play } from "lucide-react";
import type { GalleryCollection } from "@/types/gallery";
import Lightbox from "./Lightbox";

const IMAGE_SIZES = "(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px";

export default function GallerySlider({ collection }: { collection: GalleryCollection }) {
  const reduceMotion = useReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    duration: reduceMotion ? 1 : 22,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const total = collection.media.length;

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    videoRefs.current.forEach((video, i) => {
      if (video && i !== index) video.pause();
    });
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`${collection.title} gallery`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <div className="relative aspect-[16/10] md:aspect-[16/9]" ref={emblaRef}>
          <div className="flex h-full">
            {collection.media.map((item, i) => (
              <div
                key={item.src}
                className="relative h-full min-w-0 flex-[0_0_100%]"
                aria-hidden={i !== selectedIndex}
              >
                {item.type === "image" ? (
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    priority={i === 0}
                    loading={i === 0 ? "eager" : "lazy"}
                    sizes={IMAGE_SIZES}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out md:hover:scale-[1.02]"
                  />
                ) : (
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el;
                    }}
                    controls
                    playsInline
                    preload="metadata"
                    aria-label={item.alt}
                    className="h-full w-full object-cover"
                  >
                    <source src={item.src} type="video/mp4" />
                  </video>
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-5 sm:p-7">
          <div>
            <p className="text-lg font-medium text-white sm:text-xl">{collection.title}</p>
            <p className="mt-0.5 font-mono text-xs text-white/70">
              {collection.year} · {String(selectedIndex + 1).padStart(2, "0")} /{" "}
              {String(total).padStart(2, "0")}
            </p>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5">
            {collection.media.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === selectedIndex ? "true" : undefined}
                className="flex h-11 min-w-11 items-center justify-center px-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ease-out ${
                    i === selectedIndex ? "w-5 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Previous image"
          className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:-translate-x-0.5"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next image"
          className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5"
        >
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>

        <div className="absolute right-5 top-5 flex items-center gap-2 sm:right-7 sm:top-7">
          <span
            className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-xs text-white backdrop-blur-md [font-variant-numeric:tabular-nums]"
            aria-hidden
          >
            {String(selectedIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Open full-screen view"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors duration-200 hover:border-white/30 hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Expand className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {collection.media.length > 1 && (
        <div className="mt-3 hidden gap-2 md:flex">
          {collection.media.map((item, i) => (
            <button
              key={item.src}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Show slide ${i + 1}: ${item.alt}`}
              aria-current={i === selectedIndex ? "true" : undefined}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition-colors duration-200 ${
                i === selectedIndex ? "border-accent" : "border-white/10 hover:border-white/30"
              }`}
            >
              {item.type === "image" ? (
                <Image src={item.src} alt="" fill sizes="96px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-surface text-white">
                  <Play className="h-4 w-4" aria-hidden />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 max-w-xl text-sm leading-[1.7] text-muted">{collection.description}</p>

      {lightboxOpen && (
        <Lightbox
          collection={collection}
          initialIndex={selectedIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </motion.div>
  );
}
