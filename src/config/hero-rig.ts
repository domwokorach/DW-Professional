/**
 * Layered hero rig (public/hero-rig). Every layer is a transparent PNG on the same canvas as `manifest.json`'s
 * width × height. Stacking, bottom first: background, body (no head or neck, collar painted complete), neck,
 * eyes (larger than the sockets so the iris can slide under the lids), head (sockets cut out), eyelids (closed-lid
 * plate, faded in for blinks). Pivot and eye travel are in canvas pixels.
 */
export const HERO_RIG_DIR = '/hero-rig';

export type HeroRigManifest = {
  width: number;
  height: number;
  layers: Record<'background' | 'body' | 'neck' | 'head' | 'eyes' | 'eyelids', string>;
  /** Neck base: the point the head rotates around. */
  pivot: { x: number; y: number };
  /** Largest eye shift in canvas px, each way. */
  eyeTravel: { x: number; y: number };
};

export const HERO_RIG_LIMITS = {
  /** Horizontal turn, degrees each way. */
  yaw: 15,
  /** Vertical tilt, degrees each way. */
  pitch: 10,
  /** Sideways roll that accompanies a turn, as a share of the yaw. */
  roll: 0.2,
  /** The head lags the eyes by this many ms. */
  headDelay: 80,
} as const;

export function isHeroRigManifest(value: unknown): value is HeroRigManifest {
  const m = value as HeroRigManifest | null;
  const num = (n: unknown) => typeof n === 'number' && Number.isFinite(n);
  return Boolean(
    m && num(m.width) && num(m.height) && m.width > 0 && m.height > 0 && num(m.pivot?.x) && num(m.pivot?.y) &&
    num(m.eyeTravel?.x) && num(m.eyeTravel?.y) &&
    (['background', 'body', 'neck', 'head', 'eyes', 'eyelids'] as const).every((k) => typeof m.layers?.[k] === 'string'),
  );
}
