import type { ClipboardEvent, MouseEvent } from "react";

/**
 * Deterrent only — text already delivered to the browser can still be read
 * via devtools, view-source, accessibility tools or screenshots.
 */
export function handleCopy(event: ClipboardEvent<HTMLElement>) {
  event.preventDefault();
}

export function handleContextMenu(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
}
