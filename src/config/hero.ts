/**
 * Hero character poses. Every source is a 1672×941 render with the character in the same spot, so the same
 * crop (500×941 around the body) keeps each pose at exactly the same size and position.
 */
const CLOUDINARY = 'https://res.cloudinary.com/dkkuwmr42/image/upload';
const CROP = 'c_crop,w_500,h_941,x_573,y_0';
const pose = (path: string) => `${CLOUDINARY}/${CROP}/${path}`;

/** Where the pointer is, as seen from the character (screen directions, y down). */
export type HeroDirection = 'neutral' | 'up' | 'upRight' | 'right' | 'downRight' | 'down' | 'downLeft' | 'left' | 'upLeft';

/** Each direction maps to the render that actually looks that way. No render looks lower-left, so that reuses left. */
export const HERO_POSES: Record<HeroDirection, string> = {
  neutral: pose('v1791023389/Full%20Stack%20Developer/Friendly_3D_Portrait_in_White_Studio_gvv4mj.png'),
  up: pose('v1791070976/Full%20Stack%20Developer/ChatGPT_Image_Oct_4_2026_12_41_58_AM-8_epujkb.png'),
  upRight: pose('v1791070975/Full%20Stack%20Developer/ChatGPT_Image_Oct_4_2026_12_41_57_AM-7_uhnsnb.png'),
  right: pose('v1791070972/Full%20Stack%20Developer/ChatGPT_Image_Oct_4_2026_12_41_55_AM-4_fd54ke.png'),
  downRight: pose('v1791070972/Full%20Stack%20Developer/ChatGPT_Image_Oct_4_2026_12_41_56_AM-5_ohthxy.png'),
  down: pose('v1791070979/Full%20Stack%20Developer/ChatGPT_Image_Oct_4_2026_12_42_00_AM-10_yyi5sk.png'),
  downLeft: pose('v1791070972/Full%20Stack%20Developer/ChatGPT_Image_Oct_4_2026_12_41_53_AM-2_os7l4c.png'),
  left: pose('v1791070972/Full%20Stack%20Developer/ChatGPT_Image_Oct_4_2026_12_41_53_AM-2_os7l4c.png'),
  upLeft: pose('v1791070976/Full%20Stack%20Developer/ChatGPT_Image_Oct_4_2026_12_41_59_AM-9_dxlitm.png'),
};

export const heroAlt = 'Dominic Olanya 3D character';

/**
 * Direction zones. Pointer position is normalised to the viewport centre (-1…1 on each axis). Inside
 * `enter` the character faces forward; it turns once the pointer passes `enter` and only returns to forward
 * inside `exit`. A direction is kept until the pointer is `hysteresis` degrees past its 45° sector.
 */
export const HERO_ZONES = { enter: 0.28, exit: 0.2, hysteresis: 9 } as const;
/** Crossfade between poses, in ms. */
export const HERO_POSE_FADE = 150;
