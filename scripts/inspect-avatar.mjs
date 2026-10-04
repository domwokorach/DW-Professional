#!/usr/bin/env node
// Checks a GLB against what the hero avatar needs.   node scripts/inspect-avatar.mjs [file.glb]
import { readFileSync } from 'node:fs';
const file = process.argv[2] ?? 'public/avatar/dominic.glb';
const b = readFileSync(file);
if (b.subarray(0, 4).toString() !== 'glTF') { console.error(`${file} is not a GLB (it does not start with the glTF header).`); process.exit(1); }
const json = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());
const norm = (n) => n.toLowerCase().replace(/^mixamorig[:_]?/, '').replace(/[^a-z0-9]/g, '');
const bones = new Set();
for (const s of json.skins ?? []) for (const j of s.joints) bones.add(norm(json.nodes[j].name));
const morphs = new Set();
for (const m of json.meshes ?? []) {
  const names = m.extras?.targetNames ?? m.primitives?.[0]?.extras?.targetNames ?? [];
  names.forEach((n) => morphs.add(norm(n)));
}
const clips = (json.animations ?? []).map((a) => a.name ?? '');
const has = (set, ...names) => names.map(norm).some((n) => set.has(n));
const VIS = ['sil','PP','FF','TH','DD','kk','CH','SS','nn','RR','aa','E','I','O','U'].map((v) => `viseme_${v}`);
const rows = [
  ['Head bone', has(bones, 'Head')], ['Neck bone', has(bones, 'Neck')],
  ['LeftEye bone', has(bones, 'LeftEye', 'Eye_L', 'EyeLeft', 'L_Eye')], ['RightEye bone', has(bones, 'RightEye', 'Eye_R', 'EyeRight', 'R_Eye')],
  ['eyeBlinkLeft/Right', has(morphs, 'eyeBlinkLeft', 'eyeBlink_L') && has(morphs, 'eyeBlinkRight', 'eyeBlink_R')],
  ['jawOpen', has(morphs, 'jawOpen')],
  [`visemes (${VIS.filter((v) => morphs.has(norm(v))).length}/15)`, VIS.filter((v) => morphs.has(norm(v))).length >= 12],
  ['Idle clip', clips.some((c) => /idle/i.test(c))], ['Talking clip', clips.some((c) => /talk/i.test(c))],
];
console.log(`${file}  (${(b.length / 1e6).toFixed(1)} MB, ${morphs.size} morph targets, ${bones.size} bones, clips: ${clips.join(', ') || 'none'})`);
for (const [label, ok] of rows) console.log(`${ok ? '✓' : '✗'} ${label}`);
console.log('\n(Missing Idle/Talking clips are fine: the avatar then breathes and gestures procedurally.)');
