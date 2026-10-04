/** Exact spoken script. The voice track must say this verbatim; it is also the screen-reader transcript. */
export const INTRO_SCRIPT =
  'Hi, I’m Dominic I’m a Software Engineer and FrontEnd Developer I build responsive web applications interactive websites, and AI-powered platform.';

/**
 * Asset contract (see README.md in this folder): public URLs, each served from public/ at the same path.
 * Only `model` is required. page.tsx checks which files exist at build time and passes just those
 * down, so missing optional files are never requested.
 */
export const AVATAR_FILES = {
  model: '/avatar/dominic.glb',
  /** Extra clips for the same skeleton (Idle + Talking_*), if they aren't inside the model. */
  animations: '/avatar/animations.glb',
  voice: '/avatar/intro.mp3',
  /** Rhubarb Lip Sync JSON for the voice track; without it the mouth follows audio energy. */
  lipSync: '/avatar/intro.json',
} as const;

export type AvatarAssets ={ model: string; animations?: string; voice?: string; lipSync?: string };

/** Draco decoder (copied from three/examples/jsm/libs/draco/gltf); only fetched for compressed files. */
export const DRACO_PATH = '/draco/';

/** Clip names are matched case-insensitively. Without an idle clip the body is posed and moved procedurally. */
export const CLIPS = { idle: /idle/i, talking: /talk/i };

/**
 * Bone names per role. Matching ignores case, separators and a `mixamorig` prefix, so
 * `mixamorig:LeftEye`, `Left_Eye` and `lefteye` all match `LeftEye`.
 */
export const BONES = {
  head: ['Head'],
  neck: ['Neck'],
  chest: ['Spine2', 'UpperChest', 'Chest'],
  spine: ['Spine'],
  eyeL: ['LeftEye', 'Eye_L', 'EyeLeft', 'L_Eye'],
  eyeR: ['RightEye', 'Eye_R', 'EyeRight', 'R_Eye'],
  armL: ['LeftArm', 'UpperArm_L'],
  foreArmL: ['LeftForeArm', 'LowerArm_L', 'ForeArm_L'],
  handL: ['LeftHand', 'Hand_L'],
  armR: ['RightArm', 'UpperArm_R'],
  foreArmR: ['RightForeArm', 'LowerArm_R', 'ForeArm_R'],
  handR: ['RightHand', 'Hand_R'],
} as const;
export type BoneRole = keyof typeof BONES;

/** The 52 ARKit blendshapes. `…Left`/`…Right` also match `…_L`/`…_R` style names. */
export const ARKIT = [
  'browDownLeft', 'browDownRight', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
  'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight',
  'eyeBlinkLeft', 'eyeBlinkRight', 'eyeLookDownLeft', 'eyeLookDownRight', 'eyeLookInLeft', 'eyeLookInRight',
  'eyeLookOutLeft', 'eyeLookOutRight', 'eyeLookUpLeft', 'eyeLookUpRight',
  'eyeSquintLeft', 'eyeSquintRight', 'eyeWideLeft', 'eyeWideRight',
  'jawForward', 'jawLeft', 'jawOpen', 'jawRight',
  'mouthClose', 'mouthDimpleLeft', 'mouthDimpleRight', 'mouthFrownLeft', 'mouthFrownRight', 'mouthFunnel',
  'mouthLeft', 'mouthLowerDownLeft', 'mouthLowerDownRight', 'mouthPressLeft', 'mouthPressRight', 'mouthPucker',
  'mouthRight', 'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper',
  'mouthSmileLeft', 'mouthSmileRight', 'mouthStretchLeft', 'mouthStretchRight',
  'mouthUpperUpLeft', 'mouthUpperUpRight', 'noseSneerLeft', 'noseSneerRight', 'tongueOut',
] as const;

export const VISEMES = [
  'viseme_sil', 'viseme_PP', 'viseme_FF', 'viseme_TH', 'viseme_DD', 'viseme_kk', 'viseme_CH', 'viseme_SS',
  'viseme_nn', 'viseme_RR', 'viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U',
] as const;

/** Extra names some exporters use, beyond the automatic `_L`/`_R` handling. */
export const MORPH_ALIASES: Record<string, string[]> = {
  eyeBlinkLeft: ['Blink_Left', 'BlinkLeft', 'EyeClosedLeft', 'eyesClosedLeft', 'Eye_Close_L'],
  eyeBlinkRight: ['Blink_Right', 'BlinkRight', 'EyeClosedRight', 'eyesClosedRight', 'Eye_Close_R'],
  jawOpen: ['MouthOpen', 'Mouth_Open'],
};

const deg = (d: number) => (d * Math.PI) / 180;

/** Maximum rotation per system (radians). Eyes move most, then head, then neck. Tune per rig. */
export const LIMITS = {
  eyeYaw: deg(12),
  eyePitch: deg(8),
  headYaw: deg(7),
  headPitch: deg(4),
  neckYaw: deg(3),
  neckPitch: deg(2),
  /** Eye angle at which eyeLook* morphs reach 1 (roughly ARKit's full look). */
  eyeMorphFull: deg(20),
};

/** Spring stiffness (ω, 1/s), all critically damped. Eyes fastest, then head, then neck. */
export const SPRINGS = { eyes: 18, head: 6, neck: 3, mouth: 28, face: 6 };

export type MouthCue = { start: number; end: number; value: string };

/** Rhubarb mouth shapes → Oculus visemes (Ready Player Me / Avaturn naming). */
export const RHUBARB_TO_VISEME: Record<string, string> = {
  A: 'viseme_PP', B: 'viseme_kk', C: 'viseme_I', D: 'viseme_aa',
  E: 'viseme_O', F: 'viseme_U', G: 'viseme_FF', H: 'viseme_TH', X: 'viseme_sil',
};

/** Rhubarb mouth shapes → ARKit combinations, for models without visemes. Missing shapes are skipped. */
export const RHUBARB_TO_ARKIT: Record<string, Partial<Record<(typeof ARKIT)[number], number>>> = {
  // Closed lips: P, B, M
  A: { mouthClose: 0.45, mouthPressLeft: 0.35, mouthPressRight: 0.35 },
  // Slightly open, teeth together: K, S, T, EE
  B: { jawOpen: 0.1, mouthStretchLeft: 0.3, mouthStretchRight: 0.3, mouthUpperUpLeft: 0.15, mouthUpperUpRight: 0.15, mouthLowerDownLeft: 0.2, mouthLowerDownRight: 0.2 },
  // Open: EH, AE
  C: { jawOpen: 0.3, mouthLowerDownLeft: 0.3, mouthLowerDownRight: 0.3, mouthUpperUpLeft: 0.12, mouthUpperUpRight: 0.12, mouthStretchLeft: 0.15, mouthStretchRight: 0.15 },
  // Wide open: AA
  D: { jawOpen: 0.58, mouthLowerDownLeft: 0.35, mouthLowerDownRight: 0.35, mouthUpperUpLeft: 0.2, mouthUpperUpRight: 0.2 },
  // Slightly rounded: AO, ER
  E: { jawOpen: 0.28, mouthFunnel: 0.45, mouthPucker: 0.15 },
  // Puckered: UW, OW, W
  F: { jawOpen: 0.12, mouthPucker: 0.7, mouthFunnel: 0.3 },
  // Lower lip under upper teeth: F, V
  G: { jawOpen: 0.06, mouthRollLower: 0.55, mouthUpperUpLeft: 0.18, mouthUpperUpRight: 0.18 },
  // Tongue up: L
  H: { jawOpen: 0.25, mouthLowerDownLeft: 0.2, mouthLowerDownRight: 0.2, tongueOut: 0.08 },
  X: {},
};

/** Final fallback when only a jaw shape exists. */
export const RHUBARB_TO_JAW: Record<string, number> = { A: 0, B: 0.12, C: 0.28, D: 0.55, E: 0.38, F: 0.2, G: 0.1, H: 0.25, X: 0 };
