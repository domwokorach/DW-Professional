'use client';

import { Component, Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import AvatarScene from './AvatarScene';
import type { AvatarAssets } from './config';
import type { LipSync } from './hooks/useLipSync';

class AvatarErrorBoundary extends Component<{ onError: (error: unknown) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type Props = {
  assets: AvatarAssets;
  lipSync: LipSync;
  reducedMotion: boolean;
  /** Off-screen the loop stops entirely. */
  visible: boolean;
  onReady: () => void;
  onError: (error: unknown) => void;
};

/** The WebGL canvas. Loaded on demand (next/dynamic) so three.js stays out of the initial bundle. */
export default function AvatarCanvas({ assets, lipSync, reducedMotion, visible, onReady, onError }: Props) {
  return (
    <Canvas
      frameloop={visible ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ fov: 16, near: 0.1, far: 100 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.domElement.setAttribute('aria-hidden', 'true');
      }}
    >
      <hemisphereLight args={[0xffffff, 0xd9d2c3, 1.6]} />
      <directionalLight position={[1.5, 3, 4]} intensity={2.2} />
      <directionalLight position={[-2, 1, 2]} intensity={0.6} />
      <AvatarErrorBoundary onError={onError}>
        <Suspense fallback={null}>
          <AvatarScene assets={assets} lipSync={lipSync} reducedMotion={reducedMotion} onReady={onReady} />
        </Suspense>
      </AvatarErrorBoundary>
    </Canvas>
  );
}
