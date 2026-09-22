/**
 * Shared fixed-positioning offsets for the live chat launcher and its panel.
 *
 * The launcher sits bottom-right, stacked above the global `BackToTopButton`
 * (which occupies `bottom-6 right-6`, ~64px tall including its border) so the
 * two never overlap. The panel then anchors just above the launcher and
 * grows upward, capped by the viewport.
 */
export const LAUNCHER_SIZE_PX = 52;
export const LAUNCHER_GAP_PX = 12;
export const BACK_TO_TOP_CLEARANCE_PX = 88;

export const LAUNCHER_BOTTOM_CSS = `max(${BACK_TO_TOP_CLEARANCE_PX}px, calc(env(safe-area-inset-bottom) + ${BACK_TO_TOP_CLEARANCE_PX}px))`;
export const LAUNCHER_RIGHT_CSS = "max(16px, env(safe-area-inset-right))";

const PANEL_CLEARANCE_PX = BACK_TO_TOP_CLEARANCE_PX + LAUNCHER_SIZE_PX + LAUNCHER_GAP_PX;
export const PANEL_BOTTOM_CSS = `max(${PANEL_CLEARANCE_PX}px, calc(env(safe-area-inset-bottom) + ${PANEL_CLEARANCE_PX}px))`;
export const PANEL_RIGHT_CSS = "max(16px, env(safe-area-inset-right))";
