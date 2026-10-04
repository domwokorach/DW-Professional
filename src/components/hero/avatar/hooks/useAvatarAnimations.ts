'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Capabilities } from '../capabilities';
import { follow, rand, rotateWorld, spring, type FrameContext, type Spring } from '../motion';

const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);
const q = new THREE.Quaternion();

type ProceduralArm = { side: 1 | -1; upper: THREE.Bone; fore: THREE.Bone; raise: Spring; target: number; next: number };

/** Lowers the arms from a T/A bind pose into a relaxed stance, whatever the bone axes are. */
function relaxArms(caps: Capabilities, rest: Map<THREE.Bone, THREE.Quaternion>) {
  const b = caps.bones;
  const aim = (bone: THREE.Bone, child: THREE.Object3D, dir: THREE.Vector3) => {
    bone.parent?.updateWorldMatrix(true, true);
    const from = child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
    rotateWorld(bone, new THREE.Quaternion().setFromUnitVectors(from, dir.normalize()));
  };
  const arms: ProceduralArm[] = [];
  for (const [side, upper, fore, hand] of [[1, b.armL, b.foreArmL, b.handL], [-1, b.armR, b.foreArmR, b.handR]] as const) {
    if (!upper || !fore || !hand) continue;
    aim(upper, fore, new THREE.Vector3(0.2 * side, -1, 0.05));
    aim(fore, hand, new THREE.Vector3(0.06 * side, -1, 0.28));
    rest.set(upper, upper.quaternion.clone());
    rest.set(fore, fore.quaternion.clone());
    arms.push({ side, upper, fore, raise: spring(), target: 0, next: 0 });
  }
  if (b.spine) rest.set(b.spine, b.spine.quaternion.clone());
  return arms;
}

/**
 * Body motion. With an `idle` clip in the GLB it plays it and cross-fades to random `talk` clips
 * while speaking. Without one, the arms are lowered from the bind pose and the body breathes and
 * gestures procedurally. Every frame starts from the rest pose so the additive head/eye rotations
 * applied afterwards never accumulate.
 */
export function useAvatarAnimations(root: THREE.Object3D, caps: Capabilities) {
  const body = useMemo(() => {
    const rest = new Map<THREE.Bone, THREE.Quaternion>();
    for (const role of ['chest', 'neck', 'head', 'eyeL', 'eyeR'] as const) {
      const bone = caps.bones[role];
      if (bone) rest.set(bone, bone.quaternion.clone());
    }

    let mixer: THREE.AnimationMixer | undefined;
    let idle: THREE.AnimationAction | undefined;
    let current: THREE.AnimationAction | undefined;
    let talking: THREE.AnimationAction[] = [];
    let arms: ProceduralArm[] | null = null;
    let actionTime = 0;

    root.updateMatrixWorld(true);
    if (caps.idleClip) {
      mixer = new THREE.AnimationMixer(root);
      idle = current = mixer.clipAction(caps.idleClip).play();
      talking = caps.talkingClips.map((c) => mixer!.clipAction(c));
      mixer.update(0);
    } else {
      arms = relaxArms(caps, rest);
    }
    root.updateMatrixWorld(true);

    return {
      update({ dt, time, reducedMotion: calm, speaking, energy }: FrameContext) {
        for (const [bone, rq] of rest) bone.quaternion.copy(rq);

        if (mixer && idle && current) {
          actionTime += dt;
          if (speaking && talking.length) {
            if (current === idle || actionTime > current.getClip().duration * 1.6) {
              const options = talking.filter((a) => a !== current);
              const next = options[Math.floor(Math.random() * options.length)] ?? talking[0];
              if (next !== current) {
                next.reset().setEffectiveWeight(1).play();
                current.crossFadeTo(next, 0.6, true);
                current = next;
              }
              actionTime = 0;
            }
          } else if (current !== idle) {
            idle.reset().setEffectiveWeight(1).play();
            current.crossFadeTo(idle, 0.8, true);
            current = idle;
            actionTime = 0;
          }
          mixer.update(dt);
          root.updateMatrixWorld(true);
          return;
        }

        root.updateMatrixWorld(true);
        if (!arms) return;
        const spine = caps.bones.spine;
        if (spine && !calm) rotateWorld(spine, q.setFromAxisAngle(AXIS_Z, Math.sin(time * 0.37) * 0.012));
        const gesturing = speaking && !calm;
        for (const arm of arms) {
          if (gesturing && time > arm.next) {
            // Beats follow loud stretches of speech; each arm on its own random rhythm.
            arm.target = energy > 0.18 && Math.random() < 0.7 ? rand(0.35, 1) : rand(0, 0.2);
            arm.next = time + rand(0.7, 1.9);
          } else if (!gesturing) {
            arm.target = 0;
          }
          follow(arm.raise, arm.target, 3.5, dt);
          const breathe = calm ? 0 : Math.sin((time * Math.PI * 2) / 4.2 + (arm.side > 0 ? 0 : 0.6)) * 0.008;
          // Negative rotation about +X swings a hanging limb forward (towards the camera).
          rotateWorld(arm.upper, q.setFromAxisAngle(AXIS_X, -arm.raise.x * 0.18 - breathe));
          rotateWorld(arm.fore, q.setFromAxisAngle(AXIS_X, -arm.raise.x * 0.75));
        }
      },

      dispose() {
        mixer?.stopAllAction();
      },
    };
  }, [root, caps]);

  useEffect(() => () => body.dispose(), [body]);
  return body;
}
