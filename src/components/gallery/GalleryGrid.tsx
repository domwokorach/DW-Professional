"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Expand } from "lucide-react";
import type { GalleryCollection, GalleryMedia } from "@/types/gallery";
import Lightbox from "./Lightbox";

const GRID_SIZE = 9;
const IMAGE_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

export default function GalleryGrid({ collections }: { collections: GalleryCollection[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const items: GalleryMedia[] = collections
    .flatMap((collection) => collection.media.filter((item) => item.type === "image"))
    .slice(0, GRID_SIZE);

  const flatCollection: GalleryCollection = {
    id: "gallery-grid",
    title: "Gallery",
    year: collections[0]?.year ?? 0,
    description: "",
    media: items,
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
        {items.map((item, i) => (
          <motion.button
            key={item.src}
            type="button"
            onClick={() => setLightboxIndex(i)}
            aria-label={`Open full-screen view: ${item.alt}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: (i % 3) * 0.06 }}
            className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              loading={i < 3 ? "eager" : "lazy"}
              sizes={IMAGE_SIZES}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100"
              aria-hidden
            >
              <Expand className="h-4 w-4" />
            </span>
          </motion.button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          collection={flatCollection}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
