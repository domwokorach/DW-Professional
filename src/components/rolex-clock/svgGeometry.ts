/**
 * Normalises computed SVG coordinates before React serialises them.
 * Server and browser math engines can otherwise differ at the final
 * floating-point digit and trigger a hydration attribute mismatch.
 */
export function svgCoordinate(value: number) {
  return value.toFixed(3);
}
