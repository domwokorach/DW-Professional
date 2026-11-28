'use client';

import { CATEGORY_META, NODE_BY_ID, RELATIONSHIP_LABEL, cypherFor, neighboursOf } from './graph-data';

/** Selected entity: name, category, description, illustrative Cypher and its connected entities. */
export default function GraphNodeDetails({ id, collapsed, onSelect, onToggleCollapse }: {
  id: string | null; collapsed: boolean; onSelect: (id: string) => void; onToggleCollapse: (id: string) => void;
}) {
  const node = id ? NODE_BY_ID.get(id) : undefined;
  if (!node) {
    return (
      <div className="ig-details" aria-live="polite">
        <p className="ig-details__empty">Select a node to see its description and connected entities. Drag nodes to rearrange, drag the background to pan, and use Ctrl/⌘ + scroll or pinch to zoom.</p>
      </div>
    );
  }
  const meta = CATEGORY_META[node.category];
  const neighbours = neighboursOf(node.id);
  const collapsible = node.category === 'department' || node.category === 'team';
  return (
    <div className="ig-details" aria-live="polite">
      <p className="ig-details__cat"><span className="ig-dot" style={{ background: meta.colour }} aria-hidden="true" />{meta.label}</p>
      <h5>{node.name}</h5>
      <p>{node.description}</p>
      {collapsible && (
        <button type="button" className="ig-small-btn" onClick={() => onToggleCollapse(node.id)}>{collapsed ? 'Expand children' : 'Collapse children'}</button>
      )}
      <pre className="ig-cypher" aria-label="Illustrative Cypher query"><code>{cypherFor(node)}</code></pre>
      <p className="ig-details__sub">{neighbours.length} connected {neighbours.length === 1 ? 'entity' : 'entities'}</p>
      <ul className="ig-neighbours">
        {neighbours.map(({ node: other, type, outgoing }) => (
          <li key={`${other.id}-${type}-${outgoing}`}>
            <button type="button" onClick={() => onSelect(other.id)}>
              <span className="ig-dot" style={{ background: CATEGORY_META[other.category].colour }} aria-hidden="true" />
              <span>{other.name}</span>
              <small>{outgoing ? '' : '← '}{RELATIONSHIP_LABEL[type]}{outgoing ? ' →' : ''}</small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
