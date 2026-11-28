import { memo, type KeyboardEvent } from 'react';
import { CATEGORY_META, type GraphNodeData } from './graph-data';

export type NodeState = 'normal' | 'selected' | 'related' | 'faded' | 'hidden';

/** One entity. Circles are SVG; the node is keyboard-operable and carries an accessible description. */
function GraphNodeBase({ node, x, y, state, collapsed, label, labelSize, hit, tabbable, ariaLabel, onKeyDown }: {
  node: GraphNodeData; x: number; y: number; state: NodeState; collapsed: boolean; label: boolean; labelSize: number; hit: number;
  tabbable: boolean; ariaLabel: string; onKeyDown: (e: KeyboardEvent<SVGGElement>, id: string) => void;
}) {
  const meta = CATEGORY_META[node.category];
  const r = meta.radius;
  return (
    <g
      className={`ig-node ig-node--${state}`}
      transform={`translate(${x} ${y})`}
      data-node={node.id}
      role="button"
      tabIndex={state === 'hidden' ? -1 : tabbable ? 0 : -1}
      aria-label={ariaLabel}
      aria-pressed={state === 'selected'}
      onKeyDown={(e) => onKeyDown(e, node.id)}
    >
      <circle className="ig-node__hit" r={hit} />
      {state === 'selected' && <circle className="ig-node__halo" r={r + 9} stroke={meta.colour} />}
      <circle className="ig-node__dot" r={r} fill={meta.colour} />
      {collapsed && <text className="ig-node__plus" y={6} textAnchor="middle">+</text>}
      {label && (
        <text className="ig-node__label" y={r + labelSize + 4} textAnchor="middle" fontSize={labelSize}>{node.name}</text>
      )}
    </g>
  );
}
export default memo(GraphNodeBase);
