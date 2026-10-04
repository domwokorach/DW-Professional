'use client';

import { useEffect, useRef, useState } from 'react';
import { RHUBARB_TO_ARKIT, RHUBARB_TO_JAW, RHUBARB_TO_VISEME, SPRINGS, VISEMES, type MouthCue } from '../config';
import { clamp, follow, spring, type FrameContext, type Spring } from '../motion';

async function loadCues(url?: string): Promise<MouthCue[] | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { mouthCues?: MouthCue[] };
    return data.mouthCues ?? null;
  } catch {
    return null;
  }
}

/**
 * Speech for the intro. The voice is a separate audio file; the mouth is driven from its playback
 * time through a viseme timeline (Rhubarb cues), or from loudness when there is no timeline.
 * Lives outside the canvas so the play button can start audio inside the click (autoplay rules);
 * the scene calls `update` every frame, alongside gaze and blinking, so they all run at once.
 */
export function useLipSync(cuesUrl?: string) {
  const audioRef = useRef<HTMLAudioElement>(null);
  /** For the button only; the render loop reads the audio element directly. */
  const [speaking, setSpeaking] = useState(false);

  const [lipSync] = useState(() => {
    let cues: MouthCue[] | null = null;
    let cueIndex = 0;
    let audioCtx: AudioContext | undefined;
    let analyser: AnalyserNode | undefined;
    const samples = new Float32Array(1024);
    const energy = spring();
    const mouth = new Map<string, Spring>();
    const face = { smile: spring(), brow: spring() };

    const isSpeaking = () => {
      const a = audioRef.current;
      return !!a && !a.paused && !a.ended;
    };

    /** Current Rhubarb mouth shape, or null between cues / without timing data. */
    const currentShape = () => {
      if (!isSpeaking() || !cues?.length) return null;
      const t = audioRef.current!.currentTime;
      while (cueIndex < cues.length - 1 && cues[cueIndex].end <= t) cueIndex++;
      while (cueIndex > 0 && cues[cueIndex].start > t) cueIndex--;
      const cue = cues[cueIndex];
      return cue.start <= t && t < cue.end ? cue.value : null;
    };

    return {
      setCues(next: MouthCue[] | null) {
        cues = next;
        cueIndex = 0;
      },

      get speaking() {
        return isSpeaking();
      },

      /** Must be called from the click that starts playback. */
      start() {
        const audio = audioRef.current;
        if (!audio) return;
        try {
          if (!audioCtx) {
            audioCtx = new AudioContext();
            const source = audioCtx.createMediaElementSource(audio);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = samples.length;
            source.connect(analyser).connect(audioCtx.destination);
          }
          void audioCtx.resume();
        } catch {
          analyser = undefined; // cue-driven lip sync still works without analysis
        }
        audio.currentTime = 0;
        cueIndex = 0;
        void audio.play();
      },

      stop() {
        audioRef.current?.pause();
      },

      /** Smoothed loudness 0…1; also drives nods and gestures. */
      updateEnergy(dt: number) {
        let level = 0;
        if (isSpeaking()) {
          if (analyser) {
            analyser.getFloatTimeDomainData(samples);
            let sum = 0;
            for (const s of samples) sum += s * s;
            level = clamp(Math.sqrt(sum / samples.length) * 6, 0, 1);
          } else {
            level = 0.35;
          }
        }
        follow(energy, level, 14, dt);
        return energy.x;
      },

      /** Mouth shapes plus a light expression layer (smile, brows). */
      update({ dt, time, caps, morphs, reducedMotion: calm, speaking: talking, energy: e0 }: FrameContext) {
        const mode = caps.lipSync;
        const e = talking ? e0 : 0;
        if (mode) {
          const shape = currentShape();
          const targets: Record<string, number> = {};
          const wave = (speed: number, phase = 0) => 0.5 + 0.5 * Math.sin(time * speed + phase);

          if (mode === 'visemes') {
            for (const v of VISEMES) targets[v] = 0;
            if (shape) targets[RHUBARB_TO_VISEME[shape] ?? 'viseme_sil'] = 0.85;
            else if (!cues?.length) {
              // No timeline: blend open/rounded/wide by loudness so it never loops visibly.
              targets.viseme_aa = e * 0.7;
              targets.viseme_O = e * 0.3 * wave(7.3);
              targets.viseme_E = e * 0.25 * wave(5.1, 1);
            }
          } else if (mode === 'arkit') {
            for (const combo of Object.values(RHUBARB_TO_ARKIT)) for (const k of Object.keys(combo)) targets[k] = 0;
            const blend = (s: string, w: number) => {
              for (const [k, v] of Object.entries(RHUBARB_TO_ARKIT[s] ?? {})) targets[k] += (v ?? 0) * w;
            };
            if (shape) blend(shape, 1);
            else if (talking && !cues?.length) {
              blend('C', e * 0.9);
              blend('E', e * 0.5 * wave(7.3));
              blend('D', e * 0.4 * wave(5.1, 1));
            }
          } else {
            targets.jawOpen = shape ? RHUBARB_TO_JAW[shape] ?? 0 : e * 0.5;
          }

          for (const [name, target] of Object.entries(targets)) {
            const s = mouth.get(name) ?? spring();
            follow(s, target, SPRINGS.mouth, dt);
            mouth.set(name, s);
            morphs.add(name, Math.max(0, s.x));
          }
        }

        follow(face.smile, talking ? 0.08 : 0.15, SPRINGS.face, dt);
        follow(face.brow, calm ? 0 : 0.04 + Math.max(0, e - 0.35) * 0.5, SPRINGS.face, dt);
        for (const side of ['Left', 'Right']) {
          morphs.add(`mouthSmile${side}`, face.smile.x);
          morphs.add(`cheekSquint${side}`, face.smile.x * 0.4);
          morphs.add(`browOuterUp${side}`, face.brow.x * 0.6);
        }
        morphs.add('browInnerUp', face.brow.x);
      },

      dispose() {
        audioRef.current?.pause();
        void audioCtx?.close();
        audioCtx = undefined;
        analyser = undefined;
      },
    };
  });

  useEffect(() => {
    let cancelled = false;
    void loadCues(cuesUrl).then((cues) => { if (!cancelled) lipSync.setCues(cues); });
    return () => { cancelled = true; };
  }, [cuesUrl, lipSync]);

  useEffect(() => () => lipSync.dispose(), [lipSync]);

  return {
    lipSync,
    audioRef,
    speaking,
    audioEvents: {
      onPlay: () => setSpeaking(true),
      onPause: () => setSpeaking(false),
      onEnded: () => setSpeaking(false),
    },
  };
}

export type LipSync = ReturnType<typeof useLipSync>['lipSync'];
