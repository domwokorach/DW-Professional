"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Expand } from "lucide-react";
import { cloudinaryImageUrl } from "@/lib/cloudinaryImage";
import type { GalleryItem } from "@/types/gallery";

const GalleryLightbox = dynamic(() => import("./GalleryLightbox"), { ssr: false });
const IMAGE_SIZES = "(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 45vw, 30vw";

export default function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const closeLightbox = () => {
    const selectedIndex = lightboxIndex;
    setLightboxIndex(null);
    if (selectedIndex !== null) requestAnimationFrame(() => cardRefs.current[selectedIndex]?.focus());
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
        {items.map((item, index) => (
          <figure
            key={item.id}
            className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
          >
            <button
              ref={(element) => { cardRefs.current[index] = element; }}
              type="button"
              onClick={() => setLightboxIndex(index)}
              aria-label={`Open larger image: ${item.title}${item.year ? `, ${item.year}` : ""}`}
              className="group relative block aspect-[4/3] w-full overflow-hidden bg-paper/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-accent"
            >
              {!loaded[item.id] && (
                <span className="absolute inset-0 animate-pulse bg-paper/[0.07] motion-reduce:animate-none" aria-hidden="true" />
              )}
              <Image
                loader={({ src, width }) => cloudinaryImageUrl(src, width)}
                src={item.image}
                alt={item.alt}
                fill
                sizes={IMAGE_SIZES}
                loading="lazy"
                onLoad={() => setLoaded((previous) => ({ ...previous, [item.id]: true }))}
                className={`object-contain transition-[opacity,transform] duration-300 motion-reduce:transition-none ${loaded[item.id] ? "opacity-100" : "opacity-0"} group-hover:scale-[1.02] group-focus-visible:scale-[1.02]`}
              />
              <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/80 text-paper opacity-80 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" aria-hidden="true">
                <Expand className="h-4 w-4" />
              </span>
            </button>
            <figcaption className="flex min-h-20 flex-col justify-center px-4 py-3 sm:px-5">
              {item.year && <span className="font-mono text-xs text-muted">{item.year}</span>}
              <span className="text-sm font-medium leading-snug text-paper sm:text-base">{item.title}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {lightboxIndex !== null && (
        <GalleryLightbox items={items} initialIndex={lightboxIndex} onClose={closeLightbox} />
      )}
    </>
  );
}
