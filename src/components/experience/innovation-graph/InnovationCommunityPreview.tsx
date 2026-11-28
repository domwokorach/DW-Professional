'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AnimatedGraphPreview from './AnimatedGraphPreview';
import GraphFilters from './GraphFilters';
import GraphLegend from './GraphLegend';
import GraphNodeDetails from './GraphNodeDetails';
import GraphSearch from './GraphSearch';
import GraphStatistics from './GraphStatistics';
import GraphToolbar from './GraphToolbar';
import OrganisationalKnowledgeGraph, { type GraphHandle } from './OrganisationalKnowledgeGraph';
import { CATEGORY_META, GRAPH_NODES, PARENT_OF, neighboursOf, type GraphCategory } from './graph-data';
import '@/styles/innovation-graph.css';

type Mode = 'graph' | 'animation' | 'department' | 'team' | 'role' | 'event';

const MODES: { id: Mode; label: string }[] = [
  { id: 'graph', label: 'Interactive Graph' },
  { id: 'animation', label: 'Animated Preview' },
  { id: 'department', label: 'Departments' },
  { id: 'team', label: 'Teams' },
  { id: 'role', label: 'Roles' },
  { id: 'event', label: 'Conferences & Events' },
];

const DISCLAIMER = 'Illustrative organisational knowledge graph created for portfolio demonstration purposes. Not an official Lloyds Banking Group organisational structure.';

function hiddenByCollapse(id: string, collapsed: ReadonlySet<string>) {
  for (let p = PARENT_OF.get(id); p; p = PARENT_OF.get(p)) if (collapsed.has(p)) return true;
  return false;
}

/** Interactive and animated views of a fictional organisational knowledge graph. */
export default function InnovationCommunityPreview() {
  const rootRef = useRef<HTMLDivElement>(null);
  const graph = useRef<GraphHandle>(null);
  const [mode, setMode] = useState<Mode>('graph');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [hiddenCats, setHiddenCats] = useState<ReadonlySet<GraphCategory>>(new Set());
  const [query, setQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  useEffect(() => {
    setCanFullscreen(document.fullscreenEnabled === true);
    const sync = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const visible = useMemo(
    () => new Set(GRAPH_NODES.filter((n) => n.category === 'community' || (!hiddenCats.has(n.category) && !hiddenByCollapse(n.id, collapsed))).map((n) => n.id)),
    [collapsed, hiddenCats],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return new Set(GRAPH_NODES.filter((n) => n.name.toLowerCase().includes(q) || CATEGORY_META[n.category].label.toLowerCase().includes(q)).map((n) => n.id));
  }, [query]);

  const emphasis = mode === 'department' || mode === 'team' || mode === 'role' || mode === 'event' ? mode : null;

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => { const next = new Set(prev); if (!next.delete(id)) next.add(id); return next; });
  }, []);

  /** Selecting from the list or a neighbour reveals the entity first if a filter or collapse is hiding it. */
  const reveal = useCallback((id: string) => {
    const node = GRAPH_NODES.find((n) => n.id === id)!;
    setHiddenCats((prev) => { if (!prev.has(node.category)) return prev; const next = new Set(prev); next.delete(node.category); return next; });
    setCollapsed((prev) => {
      const next = new Set(prev);
      for (let p = PARENT_OF.get(id); p; p = PARENT_OF.get(p)) next.delete(p);
      return next.size === prev.size ? prev : next;
    });
    setSelectedId(id);
    requestAnimationFrame(() => graph.current?.focusOn(id));
  }, []);

  const reset = useCallback(() => {
    setCollapsed(new Set());
    setHiddenCats(new Set());
    setQuery('');
    setSelectedId(null);
    setMode('graph');
    graph.current?.resetLayout();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.();
  }, []);

  const listed = GRAPH_NODES.filter((n) => !hiddenCats.has(n.category) || n.category === 'community').filter((n) => !matches || matches.has(n.id));

  return (
    <div ref={rootRef} className="ig" data-fullscreen={isFullscreen}>
      <GraphStatistics />
      <div className="ig-modes" role="group" aria-label="Viewing mode">
        {MODES.map((m) => (
          <button key={m.id} type="button" className="ig-mode" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      {mode === 'animation' && <AnimatedGraphPreview />}

      <div hidden={mode === 'animation'}>
        <div className="ig-controls">
          <GraphSearch value={query} onChange={setQuery} count={matches ? matches.size : null} />
          <GraphFilters hidden={hiddenCats} onToggle={(c) => setHiddenCats((prev) => { const next = new Set(prev); if (!next.delete(c)) next.add(c); return next; })} />
        </div>
        <div className="ig-main">
          <div className="ig-canvas">
            <GraphToolbar
              onZoomIn={() => graph.current?.zoomBy(1.3)}
              onZoomOut={() => graph.current?.zoomBy(1 / 1.3)}
              onFit={() => graph.current?.fit()}
              onCollapseAll={() => setCollapsed(new Set(GRAPH_NODES.filter((n) => n.category === 'department').map((n) => n.id)))}
              onExpandAll={() => setCollapsed(new Set())}
              onReset={reset}
              onFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
              canFullscreen={canFullscreen}
            />
            <OrganisationalKnowledgeGraph
              ref={graph}
              visible={visible}
              collapsed={collapsed}
              selectedId={selectedId}
              emphasis={emphasis}
              matches={matches}
              wheelZoom={isFullscreen}
              onSelect={setSelectedId}
              onToggleCollapse={toggleCollapse}
            />
            <p className="ig-hint" aria-hidden="true">Drag to pan · Ctrl/⌘ + scroll or pinch to zoom · click a node to explore</p>
          </div>
          <GraphNodeDetails id={selectedId} collapsed={selectedId ? collapsed.has(selectedId) : false} onSelect={reveal} onToggleCollapse={toggleCollapse} />
        </div>
        <GraphLegend />
        <details className="ig-list">
          <summary>Searchable list of all entities (text alternative to the graph)</summary>
          <ul>
            {listed.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => reveal(n.id)}>
                  <span className="ig-dot" style={{ background: CATEGORY_META[n.category].colour }} aria-hidden="true" />
                  <span>{n.name}</span>
                  <small>{CATEGORY_META[n.category].label} · {neighboursOf(n.id).length} connections</small>
                </button>
              </li>
            ))}
            {listed.length === 0 && <li className="ig-list__empty">No entities match.</li>}
          </ul>
        </details>
      </div>

      <p className="ig-disclaimer">{DISCLAIMER}</p>
    </div>
  );
}
