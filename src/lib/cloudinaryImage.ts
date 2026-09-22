/**
 * Builds a responsive Cloudinary delivery URL for a given target width.
 *
 * - `c_limit` scales down to fit `width` but never enlarges past the
 *   asset's own resolution — a small source stays at its natural size
 *   instead of being upscaled (and going soft) to match a larger panel.
 * - `f_auto` serves the best format the browser supports (AVIF/WebP/etc).
 * - `q_auto:good` lets Cloudinary pick a high-fidelity quality per image
 *   instead of a fixed, potentially low, compression level.
 *
 * DPR is intentionally left to next/image: it already requests multiple
 * `width` values (matching next.config's imageSizes/deviceSizes) and the
 * browser picks the right one for the viewer's device pixel ratio via the
 * `srcset` width descriptors, so adding `dpr_auto` here would double-apply
 * pixel-density scaling on top of that.
 */
export function cloudinaryImageUrl(source: string, width: number): string {
  const target = Math.max(1, Math.round(width));
  return source.replace(
    "/image/upload/",
    `/image/upload/c_limit,w_${target}/f_auto,q_auto:good/`,
  );
}
