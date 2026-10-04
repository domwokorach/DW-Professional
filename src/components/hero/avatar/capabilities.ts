import type * as THREE from 'three';
import { ARKIT, BONES, CLIPS, MORPH_ALIASES, VISEMES, type BoneRole } from './config';

/** Lower-case, separators removed, `mixamorig` prefix dropped: `mixamorig:Left_Eye` → `lefteye`. */
export const normalise = (name: string) => name.toLowerCase().replace(/^mixamorig[:_]?/, '').replace(/[^a-z0-9]/g, '');

export type MorphTarget = { mesh: THREE.Mesh; index: number };

export type Capabilities = {
  bones: Partial<Record<BoneRole, THREE.Bone>>;
  /** Canonical morph name (ARKit / viseme) → the model's matching targets. */
  morphs: Map<string, MorphTarget[]>;
  eyes: 'bones' | 'morphs' | null;
  blink: boolean;
  lipSync: 'visemes' | 'arkit' | 'jaw' | null;
  idleClip?: THREE.AnimationClip;
  talkingClips: THREE.AnimationClip[];
};

const EYE_LOOK = ARKIT.filter((n) => n.startsWith('eyeLook'));
const ARKIT_MOUTH = ARKIT.filter((n) => n.startsWith('mouth') && n !== 'mouthClose');

/** Name variants a canonical morph may appear under. */
function candidates(canonical: string) {
  const base = normalise(canonical);
  const list = [base, base.replace(/left$/, 'l'), base.replace(/right$/, 'r'), ...(MORPH_ALIASES[canonical] ?? []).map(normalise)];
  return [...new Set(list)];
}

/** Inspects a loaded GLB once and works out which avatar features it can drive. */
export function inspectAvatar(root: THREE.Object3D, clips: THREE.AnimationClip[]): Capabilities {
  const bonesByName = new Map<string, THREE.Bone>();
  const morphsByName = new Map<string, MorphTarget[]>();
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) bonesByName.set(normalise(o.name), o as THREE.Bone);
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
      for (const [name, index] of Object.entries(mesh.morphTargetDictionary)) {
        const key = normalise(name);
        morphsByName.set(key, [...(morphsByName.get(key) ?? []), { mesh, index }]);
      }
    }
  });

  const bones: Capabilities['bones'] = {};
  for (const [role, names] of Object.entries(BONES) as [BoneRole, readonly string[]][]) {
    const found = names.map(normalise).map((n) => bonesByName.get(n)).find(Boolean);
    if (found) bones[role] = found;
  }

  const morphs = new Map<string, MorphTarget[]>();
  for (const canonical of [...ARKIT, ...VISEMES]) {
    const found = candidates(canonical).map((n) => morphsByName.get(n)).find(Boolean);
    if (found) morphs.set(canonical, found);
  }

  const has = (n: string) => morphs.has(n);
  const eyes = bones.eyeL && bones.eyeR ? 'bones' : EYE_LOOK.every(has) ? 'morphs' : null;
  const blink = has('eyeBlinkLeft') && has('eyeBlinkRight');
  const lipSync =
    has('viseme_aa') && has('viseme_PP') && has('viseme_O') ? 'visemes'
    : has('jawOpen') && ARKIT_MOUTH.filter(has).length >= 3 ? 'arkit'
    : has('jawOpen') ? 'jaw'
    : null;

  return {
    bones, morphs, eyes, blink, lipSync,
    idleClip: clips.find((c) => CLIPS.idle.test(c.name)),
    talkingClips: clips.filter((c) => CLIPS.talking.test(c.name)),
  };
}

/** One concise development report, plus one warning naming exactly what is missing. */
export function reportCapabilities(caps: Capabilities) {
  const tick = (ok: unknown, label = '') => (ok ? `✓ ${label}`.trim() : '✗ missing');
  const b = caps.bones;
  const visemes = VISEMES.filter((n) => caps.morphs.has(n)).length;
  const arkit = ARKIT.filter((n) => caps.morphs.has(n)).length;
  console.info(
    [
      'Dominic avatar capabilities',
      '',
      `Head bone:       ${tick(b.head, b.head?.name)}`,
      `Neck bone:       ${tick(b.neck, b.neck?.name)}`,
      `Left eye:        ${caps.eyes === 'morphs' ? '✓ eyeLook* morphs' : tick(b.eyeL, b.eyeL?.name)}`,
      `Right eye:       ${caps.eyes === 'morphs' ? '✓ eyeLook* morphs' : tick(b.eyeR, b.eyeR?.name)}`,
      '',
      `Blink left:      ${tick(caps.morphs.has('eyeBlinkLeft'), 'eyeBlinkLeft')}`,
      `Blink right:     ${tick(caps.morphs.has('eyeBlinkRight'), 'eyeBlinkRight')}`,
      '',
      `Visemes:         ${visemes}/${VISEMES.length}`,
      `ARKit shapes:    ${arkit}/${ARKIT.length}`,
      `Lip sync:        ${caps.lipSync ?? '✗ none'}`,
      '',
      `Idle animation:  ${caps.idleClip ? `✓ ${caps.idleClip.name}` : '✗ (procedural pose)'}`,
      `Talking:         ${caps.talkingClips.length ? `✓ ${caps.talkingClips.length} clip(s)` : '✗ (procedural gestures)'}`,
    ].join('\n'),
  );

  const missing: string[] = [];
  if (!caps.eyes) missing.push('Missing LeftEye / RightEye bones and eyeLook* morph targets (eye tracking disabled)');
  if (!caps.blink) missing.push('Missing eyeBlinkLeft / eyeBlinkRight (blinking disabled)');
  if (!caps.lipSync) missing.push('No viseme or mouth morph targets detected (lip sync disabled)');
  else if (caps.lipSync === 'jaw') missing.push('Only jawOpen found: lip sync limited to jaw movement');
  if (!b.neck) missing.push('Missing Neck bone (head tracking uses the head only)');
  if (missing.length) console.warn(`Avatar facial rig incomplete:\n- ${missing.join('\n- ')}`);
}
