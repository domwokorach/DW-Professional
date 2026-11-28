import { memo } from 'react';
import { RELATIONSHIP_LABEL, type RelationshipType } from './graph-data';

export type LinkState = 'normal' | 'highlight' | 'faded' | 'hidden';

/** One relationship: a line trimmed to the node edges, with an arrowhead and a type label when highlighted. */
function GraphRelationshipBase({ type, x1, y1, x2, y2, r1, r2, state, scale }: {
  type: RelationshipType; x1: number; y1: number; x2: number; y2: number; r1: number; r2: number; state: LinkState; scale: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const sx = x1 + ux * r1;
  const sy = y1 + uy * r1;
  const ex = x2 - ux * (r2 + 3);
  const ey = y2 - uy * (r2 + 3);
  const hi = state === 'highlight';
  const label = RELATIONSHIP_LABEL[type].toUpperCase().replace(/ /g, '_');
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const w = (type.length * 8.2 + 16) * scale;
  const h = 24 * scale;
  return (
    <g className={`ig-link ig-link--${state}`} aria-hidden="true">
      <line x1={sx} y1={sy} x2={ex} y2={ey} />
      {hi && (
        <>
          <polygon points={`${ex},${ey} ${ex - ux * 14 - uy * 6},${ey - uy * 14 + ux * 6} ${ex - ux * 14 + uy * 6},${ey - uy * 14 - ux * 6}`} />
          <rect className="ig-link__pill" x={mx - w / 2} y={my - h / 2} width={w} height={h} rx={h / 2} />
          <text className="ig-link__label" x={mx} y={my + 4.5 * scale} textAnchor="middle" fontSize={13 * scale}>{label}</text>
        </>
      )}
    </g>
  );
}
export default memo(GraphRelationshipBase);
