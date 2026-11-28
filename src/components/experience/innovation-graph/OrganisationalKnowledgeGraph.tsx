'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import GraphNode, { type NodeState } from './GraphNode';
import GraphRelationship, { type LinkState } from './GraphRelationship';
import { CATEGORY_META, GRAPH_LINKS, GRAPH_NODES, NODE_BY_ID, neighboursOf } from './graph-data';
import layout from './graph-layout.json';

type Pos = Record<string, [number, number]>;
type View = { x: number; y: number; k: number };

const BASE = layout.positions as unknown as Pos;
const BOUNDS = layout.bounds;
const MIN_K = 0.12;
const MAX_K = 3;

export type GraphHandle = {
  fit: () => void;
  zoomBy: (factor: number) => void;
  focusOn: (id: string) => void;
  resetLayout: () => void;
};

type Props = {
  visible: ReadonlySet<string>;
  collapsed: ReadonlySet<string>;
  selectedId: string | null;
  /** Category emphasised by a viewing mode; everything else is gently faded. */
  emphasis: string | null;
  /** Ids matching the search box, or null when the search is empty. */
  matches: ReadonlySet<string> | null;
  wheelZoom: boolean;
  onSelect: (id: string | null) => void;
  onToggleCollapse: (id: string) => void;
};

/** Pan/zoom/drag SVG graph. Positions come from a precomputed layout: no live simulation runs in the browser. */
const OrganisationalKnowledgeGraph = forwardRef<GraphHandle, Props>(function OrganisationalKnowledgeGraph(
  { visible, collapsed, selectedId, emphasis, matches, wheelZoom, onSelect, onToggleCollapse }, ref,
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pos, setPos] = useState<Pos>(BASE);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 0.5 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const viewRef = useRef(view);
  const posRef = useRef(pos);
  const raf = useRef(0);
  const reduced = useRef(false);
  const touched = useRef(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ kind: 'pan' | 'node' | 'pinch'; id?: string; moved: boolean; start: { x: number; y: number }; origin: View; dist?: number } | null>(null);

  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { posRef.current = pos; }, [pos]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { reduced.current = query.matches; };
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const animateTo = useCallback((target: View) => {
    touched.current = true;
    cancelAnimationFrame(raf.current);
    const from = viewRef.current;
    if (reduced.current) { setView(target); return; }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 600);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setView({ x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, k: from.k * Math.pow(target.k / from.k, e) });
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, []);

  const fitView = useCallback((w: number, h: number): View => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of GRAPH_NODES) {
      if (!visible.has(n.id)) continue;
      const [x, y] = posRef.current[n.id];
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    if (!isFinite(minX)) { minX = BOUNDS.minX; maxX = BOUNDS.maxX; minY = BOUNDS.minY; maxY = BOUNDS.maxY; }
    const padX = 120, padY = 90;
    minX -= padX; maxX += padX; minY -= padY; maxY += padY;
    const k = Math.min(MAX_K, Math.max(MIN_K, Math.min(w / (maxX - minX), h / (maxY - minY))));
    return { k, x: w / 2 - ((minX + maxX) / 2) * k, y: h / 2 - ((minY + maxY) / 2) * k };
  }, [visible]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
      // Keep the whole graph in view until the visitor interacts (the accordion may open after mount).
      if (!touched.current && width > 120 && height > 120) setView(fitView(width, height));
    });
    observer.observe(el);
    return () => { observer.disconnect(); cancelAnimationFrame(raf.current); };
  }, [fitView]);

  const zoomAt = useCallback((cx: number, cy: number, factor: number, animate = false) => {
    touched.current = true;
    const v = viewRef.current;
    const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
    const next = { k, x: cx - ((cx - v.x) / v.k) * k, y: cy - ((cy - v.y) / v.k) * k };
    if (animate) animateTo(next); else setView(next);
  }, [animateTo]);

  useImperativeHandle(ref, () => ({
    fit: () => animateTo(fitView(size.w, size.h)),
    zoomBy: (f) => zoomAt(size.w / 2, size.h / 2, f, true),
    focusOn: (id) => {
      const p = posRef.current[id];
      if (!p) return;
      const k = Math.max(viewRef.current.k, 0.55);
      animateTo({ k, x: size.w / 2 - p[0] * k, y: size.h / 2 - p[1] * k });
    },
    resetLayout: () => { setPos(BASE); animateTo(fitView(size.w, size.h)); },
  }), [animateTo, fitView, size, zoomAt]);

  // Ctrl/⌘ + wheel always zooms; a plain wheel zooms only when enabled (full screen) so the page can still scroll.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(wheelZoom || e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0015));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [wheelZoom, zoomAt]);

  const local = (e: { clientX: number; clientY: number }) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    touched.current = true;
    cancelAnimationFrame(raf.current);
    svgRef.current!.setPointerCapture(e.pointerId);
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { kind: 'pinch', moved: true, start: p, origin: viewRef.current, dist: Math.hypot(a.x - b.x, a.y - b.y) };
      return;
    }
    const id = (e.target as Element).closest('[data-node]')?.getAttribute('data-node') ?? undefined;
    gesture.current = { kind: id ? 'node' : 'pan', id, moved: false, start: p, origin: viewRef.current };
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    if (g.kind === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const factor = dist / (g.dist || dist);
      g.dist = dist;
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, factor);
      return;
    }
    const dx = p.x - g.start.x;
    const dy = p.y - g.start.y;
    if (!g.moved && Math.hypot(dx, dy) < 4) return;
    g.moved = true;
    if (g.kind === 'pan') setView({ ...g.origin, x: g.origin.x + dx, y: g.origin.y + dy });
    else if (g.kind === 'node' && g.id) {
      const id = g.id;
      const v = viewRef.current;
      setPos((prev) => ({ ...prev, [id]: [(p.x - v.x) / v.k, (p.y - v.y) / v.k] }));
    }
  };

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return;
    gesture.current = null;
    if (!g || g.moved) return;
    if (g.kind === 'node' && g.id) onSelect(g.id === selectedId ? null : g.id);
    else if (g.kind === 'pan') onSelect(null);
  };

  const onNodeKey = useCallback((e: KeyboardEvent<SVGGElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id); }
    else if (e.key === 'Escape') onSelect(null);
    else if ((e.key === '+' || e.key === '=') ) zoomAt(size.w / 2, size.h / 2, 1.25, true);
    else if (e.key === '-') zoomAt(size.w / 2, size.h / 2, 0.8, true);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const ids = GRAPH_NODES.filter((n) => visible.has(n.id)).map((n) => n.id);
      const i = ids.indexOf(id);
      const next = ids[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : ids.length - 1)) % ids.length];
      (svgRef.current?.querySelector(`[data-node="${next}"]`) as SVGGElement | null)?.focus();
    } else if (e.key.toLowerCase() === 'c' && (NODE_BY_ID.get(id)?.category === 'department' || NODE_BY_ID.get(id)?.category === 'team')) onToggleCollapse(id);
  }, [onSelect, onToggleCollapse, size, visible, zoomAt]);

  const related = useMemo(() => {
    if (!selectedId) return null;
    const ids = new Set<string>([selectedId]);
    for (const n of neighboursOf(selectedId)) ids.add(n.node.id);
    return ids;
  }, [selectedId]);

  const k = view.k;
  const labelSize = Math.min(44, Math.max(15, 11 / k));
  const tabbableId = selectedId && visible.has(selectedId) ? selectedId : 'ic';

  const nodeState = (id: string): NodeState => {
    if (!visible.has(id)) return 'hidden';
    if (id === selectedId) return 'selected';
    if (related) return related.has(id) ? 'related' : 'faded';
    if (matches) return matches.has(id) ? 'related' : 'faded';
    if (emphasis && NODE_BY_ID.get(id)!.category !== emphasis && id !== 'ic') return 'faded';
    return 'normal';
  };
  const labelVisible = (id: string, state: NodeState) => {
    if (state === 'hidden') return false;
    if (state === 'selected' || state === 'related') return true;
    const c = NODE_BY_ID.get(id)!.category;
    if (emphasis && c === emphasis) return true;
    if (k < 0.3) return c === 'community' || c === 'department';
    if (k < 0.5) return c === 'community' || c === 'department' || c === 'team';
    if (k < 0.7) return c !== 'role';
    return true;
  };

  return (
    <svg
      ref={svgRef}
      className="ig-svg"
      role="group"
      aria-label="Organisational knowledge graph. Use the searchable list below for a text alternative."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
        {GRAPH_LINKS.map((link) => {
          const a = pos[link.source];
          const b = pos[link.target];
          let state: LinkState = 'normal';
          if (!visible.has(link.source) || !visible.has(link.target)) state = 'hidden';
          else if (selectedId) state = link.source === selectedId || link.target === selectedId ? 'highlight' : 'faded';
          else if (matches) state = matches.has(link.source) && matches.has(link.target) ? 'normal' : 'faded';
          else if (emphasis) state = NODE_BY_ID.get(link.source)!.category === emphasis && NODE_BY_ID.get(link.target)!.category === emphasis ? 'highlight' : 'faded';
          return (
            <GraphRelationship key={`${link.source}-${link.type}-${link.target}`} type={link.type} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
              r1={CATEGORY_META[NODE_BY_ID.get(link.source)!.category].radius} r2={CATEGORY_META[NODE_BY_ID.get(link.target)!.category].radius} state={state} scale={state === 'highlight' ? Math.min(2.6, Math.max(1, 0.55 / k)) : 1} />
          );
        })}
        {GRAPH_NODES.map((node) => {
          const state = nodeState(node.id);
          const [x, y] = pos[node.id];
          const count = neighboursOf(node.id).length;
          return (
            <GraphNode key={node.id} node={node} x={x} y={y} state={state} collapsed={collapsed.has(node.id)} label={labelVisible(node.id, state)}
              labelSize={labelSize} hit={Math.max(CATEGORY_META[node.category].radius, 16 / k)} tabbable={node.id === tabbableId}
              ariaLabel={`${node.name}, ${CATEGORY_META[node.category].label}, ${count} connections. ${node.description}`} onKeyDown={onNodeKey} />
          );
        })}
      </g>
    </svg>
  );
});

export default OrganisationalKnowledgeGraph;
