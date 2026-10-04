import * as THREE from 'three';
import type { Capabilities } from './capabilities';

export type Spring = { x: number; v: number };
export const spring = (): Spring => ({ x: 0, v: 0 });

/** Closed-form critically damped spring step: smooth, never overshoots, stable at any frame time. */
export function follow(s: Spring, target: number, omega: number, dt: number) {
  const x = s.x - target;
  const exp = Math.exp(-omega * dt);
  const tmp = (s.v + omega * x) * dt;
  s.v = (s.v - omega * tmp) * exp;
  s.x = target + (x + tmp) * exp;
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const rand = (min: number, max: number) => min + Math.random() * (max - min);

const wq = new THREE.Quaternion();
const pq = new THREE.Quaternion();
const dq = new THREE.Quaternion();
const euler = new THREE.Euler();

/** Applies a world-space rotation on top of the bone's current pose. */
export function rotateWorld(bone: THREE.Bone, delta: THREE.Quaternion) {
  if (!bone.parent) return;
  bone.getWorldQuaternion(wq);
  bone.parent.getWorldQuaternion(pq);
  bone.quaternion.copy(pq.invert().multiply(dq.copy(delta).multiply(wq)));
  bone.updateMatrixWorld(true);
}

/** Rotates a bone by yaw/pitch in the character's frame (+X his left, +Y up, +Z towards the camera). */
export function turn(bone: THREE.Bone | undefined, yaw: number, pitch: number) {
  if (bone) rotateWorld(bone, dq.setFromEuler(euler.set(-pitch, yaw, 0, 'YXZ')));
}

/**
 * Per-frame morph accumulator. Every system adds its contribution; the sum is clamped and written
 * once at the end of the frame, so blinking, gaze, lip sync and expression never overwrite each other.
 */
export class MorphMixer {
  private out = new Map<string, number>();
  constructor(private caps: Capabilities) {}

  add(name: string, value: number) {
    if (this.caps.morphs.has(name)) this.out.set(name, (this.out.get(name) ?? 0) + value);
  }

  write() {
    for (const [name, value] of this.out) {
      for (const { mesh, index } of this.caps.morphs.get(name)!) mesh.morphTargetInfluences![index] = clamp(value, 0, 1);
    }
    this.out.clear();
  }
}

/** Shared per-frame context handed to every avatar system. */
export type FrameContext = {
  dt: number;
  time: number;
  caps: Capabilities;
  morphs: MorphMixer;
  reducedMotion: boolean;
  speaking: boolean;
  /** Smoothed speech loudness, 0…1. */
  energy: number;
};
