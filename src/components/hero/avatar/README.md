# Hero live avatar

A real-time 3D presenter that speaks the intro and follows the pointer with his eyes and head
(React Three Fiber + Drei). It switches on by itself when `public/avatar/dominic.glb` exists and is a real GLB; until then
the hero keeps the still portrait (whose head still follows the pointer). `src/app/page.tsx` checks which of the files below
exist at build time and only those are requested.

| File (in `public/avatar/`) | Required | What it is |
| --- | --- | --- |
| `dominic.glb` | yes | The rigged character (see below) |
| `animations.glb` | if the clips aren't inside `dominic.glb` | Body clips for the same skeleton |
| `intro.mp3` | for the intro | Voice track. Without it there is no Play intro button |
| `intro.json` | no | Rhubarb Lip Sync output for `intro.mp3`. Without it the mouth follows loudness |

## Code

| File | Role |
| --- | --- |
| `HeroAvatar.tsx` | DOM shell: WebGL check, visibility, audio element, Play intro button, portrait fallback |
| `AvatarCanvas.tsx` | R3F `<Canvas>`, lights, error boundary (loaded with `next/dynamic`) |
| `AvatarScene.tsx` | Loads/inspects the GLB, frames the camera, runs the single `useFrame` loop |
| `hooks/usePointerTracking.ts` | `pointermove` → normalised -1…1 ref; null on leave/blur, touch-only devices, reduced motion |
| `hooks/useGaze.ts` | Eyes (fast, wide), head (slower, smaller), neck (slowest), saccades, speech nods |
| `hooks/useBlink.ts` | Irregular blinks, occasional double blink, lids follow downward gaze |
| `hooks/useLipSync.ts` | Voice playback, loudness, Rhubarb cue → viseme/ARKit/jaw mapping, smile/brows |
| `hooks/useAvatarAnimations.ts` | Idle/talk clips with cross-fades, or procedural pose, breathing and gestures |
| `motion.ts` | Critically damped springs, bone rotation helpers, per-frame morph accumulator |

Frame order: body → gaze → blink → lip sync, then morphs are written once. Speech and gaze are
independent, so he keeps following the cursor while talking.

## Character model (`dominic.glb`)

The model is inspected once on load (`capabilities.ts`). In development the console shows a
capability report, plus one warning listing anything missing. Each feature switches on by itself
when the model supports it, so a better model needs no code changes:

| Feature | Needs | Without it |
| --- | --- | --- |
| Head + neck tracking | `Head` bone (`Neck` optional) | avatar not used, portrait stays |
| Eye tracking | `LeftEye`/`RightEye` bones, or the 8 ARKit `eyeLook*` morphs | eyes stay still |
| Blinking | `eyeBlinkLeft` / `eyeBlinkRight` morphs | no blinking |
| Lip sync | 15 Oculus `viseme_*` morphs; else ARKit mouth shapes; else `jawOpen` | mouth stays still |
| Body | an `idle` clip (+ `talk` clips for gestures) | arms lowered from the T-pose, procedural breathing and gestures |

Names are matched loosely: case, separators and a `mixamorig` prefix are ignored, `…Left`/`…Right`
also match `…_L`/`…_R`, and common aliases are listed in `config.ts` (`BONES`, `MORPH_ALIASES`).
The model should face **+Z** (Blender's glTF export does this), Y up, in metres.

Keep it light: `npx @gltf-transform/cli optimize in.glb dominic.glb --compress draco --texture-compress webp`.
Draco files decode with `public/draco/` (copied from `three/examples/jsm/libs/draco/gltf`).

## Voice (`intro.mp3`)

It must say `INTRO_SCRIPT` in `config.ts` word for word (it is also the screen-reader transcript).
Record it or generate it, then trim leading/trailing silence.

## Lip sync (`intro.json`)

[Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync), given the script for accuracy:

```sh
ffmpeg -i intro.mp3 intro.wav
rhubarb -f json -r phonetic -d script.txt -o intro.json intro.wav
```

## Tuning

`config.ts` holds the limits and spring speeds. Defaults: eyes ±12° / ±8°, head ±7° / ±4°,
neck ±3° / ±2°; eyes respond fastest, the neck slowest. The pointer is normalised to the viewport.
