'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { inspectAvatar, reportCapabilities } from './capabilities';
import { DRACO_PATH, type AvatarAssets } from './config';
import { MorphMixer, clamp, type FrameContext } from './motion';
import { useAvatarAnimations } from './hooks/useAvatarAnimations';
import { useBlink } from './hooks/useBlink';
import { useGaze } from './hooks/useGaze';
import type { LipSync } from './hooks/useLipSync';
import { usePointerTracking } from './hooks/usePointerTracking';

type Props = { assets: AvatarAssets; lipSync: LipSync; reducedMotion: boolean; onReady: () => void };

/** Loads the GLB(s), keeps only animation tracks for nodes the model has, and inspects its rig. */
function useAvatarModel(assets: AvatarAssets) {
  const urls = assets.animations ? [assets.model, assets.animations] : [assets.model];
  const [model, extra] = useGLTF(urls, DRACO_PATH);

  return useMemo(() => {
    // A private copy, so remounts (and HMR) start from the untouched bind pose.
    const root = cloneSkinned(model.scene);
    const nodes = new Set<string>();
    root.traverse((o) => {
      nodes.add(o.name);
      if ((o as THREE.Mesh).isMesh) o.frustumCulled = false; // skinned bounds don't follow the animated pose
    });
    // Drop tracks for nodes this model doesn't have (e.g. finger tips), which three would warn about.
    const clips = [...model.animations, ...(extra?.animations ?? [])].map((clip) => {
      const tracks = clip.tracks.filter((t) => nodes.has(THREE.PropertyBinding.parseTrackName(t.name).nodeName));
      return new THREE.AnimationClip(clip.name, clip.duration, tracks);
    });
    const caps = inspectAvatar(root, clips);
    if (process.env.NODE_ENV !== 'production') reportCapabilities(caps);
    // Thrown into AvatarCanvas's error boundary, which keeps the portrait.
    if (!caps.bones.head) throw new Error('Avatar is missing a Head bone');
    return { root, caps };
  }, [model, extra]);
}

/** Frames the full body like `object-fit: contain; object-position: bottom`. */
function useFullBodyFraming(root: THREE.Object3D) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const bounds = useMemo(() => {
    root.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(root, true);
  }, [root]);

  useLayoutEffect(() => {
    if (!size.width || !size.height) return;
    const aspect = size.width / size.height;
    const dims = bounds.getSize(new THREE.Vector3());
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max((dims.y * 1.04) / 2 / tan, (dims.x * 1.04) / 2 / (tan * aspect));
    const center = bounds.getCenter(new THREE.Vector3());
    const y = bounds.min.y - dims.y * 0.01 + dist * tan; // feet on the bottom edge
    camera.position.set(center.x, y, bounds.max.z + dist);
    camera.lookAt(center.x, y, center.z);
    camera.updateProjectionMatrix();
  }, [camera, bounds, size]);
}

/**
 * The avatar inside the R3F canvas. One useFrame runs the systems in a fixed order: body (clips or
 * procedural), head/neck/eye gaze, blinking, then lip sync + expression. Morph contributions are
 * summed and written once, so all of them run at the same time without overwriting each other.
 * Frame state lives in refs and closures; nothing here sets React state per frame.
 */
export default function AvatarScene({ assets, lipSync, reducedMotion, onReady }: Props) {
  const { root, caps } = useAvatarModel(assets);
  useFullBodyFraming(root);

  // Under reduced motion the pointer isn't followed: the avatar stays in a calm neutral pose.
  const pointer = usePointerTracking(!reducedMotion);
  const body = useAvatarAnimations(root, caps);
  const gaze = useGaze(pointer);
  const blink = useBlink();
  const morphs = useMemo(() => new MorphMixer(caps), [caps]);
  const ctx = useRef<FrameContext>({ dt: 0, time: 0, caps, morphs, reducedMotion, speaking: false, energy: 0 });

  useEffect(() => {
    ctx.current.caps = caps;
    ctx.current.morphs = morphs;
    ctx.current.reducedMotion = reducedMotion;
  }, [caps, morphs, reducedMotion]);

  useEffect(onReady, [onReady]);

  useFrame((_, delta) => {
    const c = ctx.current;
    // Capped so a slow frame or a resumed tab never jumps the springs.
    c.dt = clamp(delta, 0, 1 / 20);
    c.time += c.dt;
    c.speaking = lipSync.speaking;
    c.energy = lipSync.updateEnergy(c.dt);

    body.update(c); //           1. clips or procedural body (resets to rest pose first)
    gaze.update(c); //           2. head + neck + eyes
    blink.update(c, gaze.eyePitch); // 3. eyelids
    lipSync.update(c); //        4. visemes + expression
    morphs.write();
  });

  return <primitive object={root} />;
}
