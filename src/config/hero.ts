/**
 * Hero character. The body is one fixed render, cropped to 500×941 around the character from a 1672×941 source; it
 * never changes or moves. Only the head changes: each other direction is a head-and-shoulders crop from another render,
 * laid over the head box (x 130, y 0, 260×290 px of the body crop; placed in hero.css) and blended in through a mask
 * that is solid over the head and fades out across the collar and shoulders.
 *
 * The renders don't all frame the character identically, so each head crop was fitted to the body render's collar and
 * shoulders (scale and offset); the crop is the box that lands exactly on the head box, padded at the top with the
 * renders' own #fefefe background where it would start above the image. Their sizes differ by a few pixels; each is
 * stretched to the box, which is the fitted scale.
 */
const CLOUDINARY = 'https://res.cloudinary.com/dkkuwmr42/image/upload';
const FOLDER = 'Full%20Stack%20Developer';
const img = (transform: string, version: string, file: string) => `${CLOUDINARY}/${transform}/${version}/${FOLDER}/${file}`;

export const HERO_BODY = img('c_crop,w_500,h_941,x_573,y_0', 'v1791023389', 'Friendly_3D_Portrait_in_White_Studio_gvv4mj.png');

/** Which way the head looks, as seen on screen: a 3×3 grid around the forward-facing body render. */
export type HeroLook = 'upLeft' | 'up' | 'upRight' | 'left' | 'centre' | 'right' | 'downLeft' | 'down' | 'downRight';

/** Head crops per direction, chosen by where each render's head actually looks. 'centre' is the body render itself. */
export const HERO_HEADS: Record<Exclude<HeroLook, 'centre'>, string> = {
  upLeft: img('c_crop,w_263,h_282,x_703,y_0/c_pad,w_263,h_293,g_south,b_rgb:fefefe', 'v1791070972', 'ChatGPT_Image_Oct_4_2026_12_41_53_AM-2_os7l4c.png'),
  up: img('c_crop,w_262,h_280,x_703,y_0/c_pad,w_262,h_292,g_south,b_rgb:fefefe', 'v1791070975', 'ChatGPT_Image_Oct_4_2026_12_41_57_AM-7_uhnsnb.png'),
  upRight: img('c_crop,w_255,h_281,x_703,y_0/c_pad,w_255,h_284,g_south,b_rgb:fefefe', 'v1791070976', 'ChatGPT_Image_Oct_4_2026_12_41_58_AM-8_epujkb.png'),
  left: img('c_crop,w_261,h_290,x_702,y_0/c_pad,w_261,h_291,g_south,b_rgb:fefefe', 'v1791070971', 'ChatGPT_Image_Oct_4_2026_12_41_52_AM-1_f09xwz.png'),
  right: img('c_crop,w_251,h_279,x_700,y_0/c_pad,w_251,h_280,g_south,b_rgb:fefefe', 'v1791070972', 'ChatGPT_Image_Oct_4_2026_12_41_55_AM-4_fd54ke.png'),
  downLeft: img('c_crop,w_254,h_270,x_693,y_0/c_pad,w_254,h_283,g_south,b_rgb:fefefe', 'v1791070972', 'ChatGPT_Image_Oct_4_2026_12_41_55_AM-3_abdmlj.png'),
  down: img('c_crop,w_262,h_269,x_696,y_0/c_pad,w_262,h_292,g_south,b_rgb:fefefe', 'v1791070979', 'ChatGPT_Image_Oct_4_2026_12_42_00_AM-10_yyi5sk.png'),
  downRight: img('c_crop,w_254,h_270,x_705,y_0/c_pad,w_254,h_284,g_south,b_rgb:fefefe', 'v1791070973', 'ChatGPT_Image_Oct_4_2026_12_41_57_AM-6_xo9mku.png'),
};

export const heroAlt = 'DOMINIC WOKORACH OLANYA 3D character';

/**
 * Where the pointer must be (anywhere in the hero) for each direction. Columns: within `centre` (share of the hero's
 * width) either side of the character it looks straight ahead, past that left or right. Rows: above `up` or below
 * `down` (shares of the hero's height) it looks up or down. A direction is kept until the pointer is `hysteresis` past
 * a boundary, so it never flickers when the pointer rests on one.
 */
export const HERO_LOOK_ZONES = { centre: 0.12, up: 0.33, down: 0.67, hysteresis: 0.03 } as const;
/** Crossfade between head directions, in ms. */
export const HERO_LOOK_FADE = 200;
