/**
 * Hero character: transparent cut-outs (public/hero, alpha WebP) layered over the hero scene. The body is one fixed
 * render, 500×941, with the head area above the collar removed; it never changes or moves. The head is a separate
 * cut-out in the head box (x 130, y 0, 260×290 px of the body; placed in hero.css): `centre` is the body render's own
 * head, and each other direction is a head-and-shoulders cut-out from another render, fitted to the body's collar and
 * shoulders, stacked in the same box and blended in through a mask that is solid over the head and fades out across
 * the collar and shoulders. Their sizes differ by a few pixels; each is stretched to the box, which is the fitted scale.
 */
export const HERO_BODY = '/hero/body.webp';
export const HERO_HEAD_CENTRE = '/hero/head-centre.webp';

/** Which way the head looks, as seen on screen: a 3×3 grid around the forward-facing body render. */
export type HeroLook = 'upLeft' | 'up' | 'upRight' | 'left' | 'centre' | 'right' | 'downLeft' | 'down' | 'downRight';

/** Head crops per direction, chosen by where each render's head actually looks. 'centre' is the body render itself. */
export const HERO_HEADS: Record<Exclude<HeroLook, 'centre'>, string> = {
  upLeft: '/hero/head-upLeft.webp',
  up: '/hero/head-up.webp',
  upRight: '/hero/head-upRight.webp',
  left: '/hero/head-left.webp',
  right: '/hero/head-right.webp',
  downLeft: '/hero/head-downLeft.webp',
  down: '/hero/head-down.webp',
  downRight: '/hero/head-downRight.webp',
};

export const heroAlt = 'DOMINIC 3D character';

/**
 * Where the pointer must be (anywhere in the hero) for each direction. Columns: within `centre` (share of the hero's
 * width) either side of the character it looks straight ahead, past that left or right. Rows: above `up` or below
 * `down` (shares of the hero's height) it looks up or down. A direction is kept until the pointer is `hysteresis` past
 * a boundary, so it never flickers when the pointer rests on one.
 */
export const HERO_LOOK_ZONES = { centre: 0.12, up: 0.33, down: 0.67, hysteresis: 0.01 } as const;
/** Crossfade between head directions, in ms. */
export const HERO_LOOK_FADE = 150;
