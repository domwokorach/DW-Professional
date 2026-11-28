// Computes a deterministic force-directed layout for the Innovation Community graph and saves it as JSON, so the
// browser never runs a simulation (stable positions, no timers to leak). Run: npx tsx scripts/previews/generate-innovation-graph-layout.ts
import { forceCollide, forceRadial, forceSimulation, type SimulationNodeDatum } from 'd3-force';
import { writeFileSync } from 'node:fs';
import { CATEGORY_META, GRAPH_NODES, PARENT_OF } from '../../src/components/experience/innovation-graph/graph-data';

const STRETCH = 1.75; // ellipse: the graph is laid out in a circle then widened to fit a 16:9 frame
const RING: Record<string, number> = { community: 0, event: 170, project: 170, department: 340, team: 560, role: 770 };
const DEPT_ORDER = ['d-tech', 'd-arch', 'd-bo', 'd-dt', 'd-ri', 'd-da'];
const rad = (deg: number) => (deg * Math.PI) / 180;

type N = SimulationNodeDatum & { id: string; category: string; r: number; angle: number };
const angleOf = new Map<string, number>();
DEPT_ORDER.forEach((id, i) => angleOf.set(id, -90 + i * 60));
const kids = (parent: string) => GRAPH_NODES.filter((n) => PARENT_OF.get(n.id) === parent);
for (const dept of DEPT_ORDER) {
  const teams = kids(dept).filter((n) => n.category === 'team');
  const base = angleOf.get(dept)!;
  teams.forEach((t, i) => angleOf.set(t.id, base + (teams.length === 1 ? 0 : (i - (teams.length - 1) / 2) * 24)));
  const direct = kids(dept).filter((n) => n.category === 'role');
  direct.forEach((r, i) => angleOf.set(r.id, base + (i - (direct.length - 1) / 2) * 20));
  for (const t of teams) {
    const roles = kids(t.id);
    roles.forEach((r, i) => angleOf.set(r.id, angleOf.get(t.id)! + (roles.length === 1 ? 0 : (i - (roles.length - 1) / 2) * 13)));
  }
}
GRAPH_NODES.filter((n) => n.category === 'event' || n.category === 'project').forEach((n, i) => angleOf.set(n.id, -60 + i * 60));

const nodes: N[] = GRAPH_NODES.map((n) => {
  const ring = n.category === 'role' && PARENT_OF.get(n.id)?.startsWith('d-') ? 660 : RING[n.category];
  const a = rad(angleOf.get(n.id) ?? 0);
  return { id: n.id, category: n.category, r: CATEGORY_META[n.category].radius, angle: a, x: Math.cos(a) * ring, y: Math.sin(a) * ring };
});
const byId = new Map(nodes.map((n) => [n.id, n]));
nodes[0].fx = 0;
nodes[0].fy = 0;

// Sector-based radial layout (department sectors, teams and roles fanned out beyond them). The simulation only resolves
// collisions and keeps each node near its ring; links and charge are deliberately left out so relationships stay untangled.
const sim = forceSimulation(nodes)
  .randomSource(() => 0.5)
  .force('collide', forceCollide<N>((d) => d.r + (d.category === 'role' ? 40 : 46)).strength(0.8))
  .force('radial', forceRadial<N>((d) => (d.category === 'role' && PARENT_OF.get(d.id)?.startsWith('d-') ? 660 : RING[d.category]), 0, 0).strength((d) => (d.category === 'community' ? 0 : 0.6)))
  .stop();
for (let i = 0; i < 200; i++) sim.tick();

const positions: Record<string, [number, number]> = {};
for (const n of nodes) positions[n.id] = [Math.round(n.x! * STRETCH), Math.round(n.y!)];

// The inner ring (events and projects) sits among the department labels, so search its radius, rotation and order
// for the arrangement with the least label overlap (labels sized as at the animation's final zoom).
const LABEL_FONT = 26;
const nameOf = new Map(GRAPH_NODES.map((n) => [n.id, n.name]));
const rect = (id: string, p: [number, number]) => {
  const w = nameOf.get(id)!.length * LABEL_FONT * 0.56 + 16;
  const r = byId.get(id)!.r;
  return { x1: p[0] - w / 2, x2: p[0] + w / 2, y1: p[1] - r, y2: p[1] + r + LABEL_FONT + 10 };
};
const overlapArea = (a: ReturnType<typeof rect>, b: ReturnType<typeof rect>) => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
const innerIds = GRAPH_NODES.filter((n) => n.category === 'event' || n.category === 'project').map((n) => n.id);
const fixedIds = GRAPH_NODES.filter((n) => !innerIds.includes(n.id)).map((n) => n.id);
const permutations = <T,>(xs: T[]): T[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((rest) => [x, ...rest])));
let best = { cost: Infinity, place: {} as Record<string, [number, number]> };
for (let radius = 150; radius <= 300; radius += 10) {
  for (let offset = 0; offset < 60; offset += 5) {
    for (const order of permutations(innerIds)) {
      const place: Record<string, [number, number]> = {};
      order.forEach((id, i) => { const a = rad(offset + i * 60); place[id] = [Math.round(Math.cos(a) * radius * STRETCH), Math.round(Math.sin(a) * radius)]; });
      let cost = 0;
      const rects = new Map<string, ReturnType<typeof rect>>();
      for (const id of fixedIds) rects.set(id, rect(id, positions[id]));
      for (const id of innerIds) rects.set(id, rect(id, place[id]));
      for (const id of innerIds) for (const other of rects.keys()) if (other !== id && !(innerIds.includes(other) && other < id)) cost += overlapArea(rects.get(id)!, rects.get(other)!);
      if (cost < best.cost) best = { cost, place };
    }
  }
}
Object.assign(positions, best.place);
console.log('inner ring overlap cost', Math.round(best.cost));
const xs = Object.values(positions).map((p) => p[0]);
const ys = Object.values(positions).map((p) => p[1]);
const bounds = { minX: Math.min(...xs) - 110, maxX: Math.max(...xs) + 110, minY: Math.min(...ys) - 90, maxY: Math.max(...ys) + 90 };
writeFileSync('src/components/experience/innovation-graph/graph-layout.json', JSON.stringify({ positions, bounds }, null, 1) + '\n');
console.log('bounds', bounds, 'nodes', Object.keys(positions).length, byId.size);
