import { CATEGORY_META, RELATIONSHIP_LABEL, type GraphCategory, type RelationshipType } from './graph-data';

const ORDER: GraphCategory[] = ['community', 'department', 'team', 'role', 'event', 'project'];

/** Colour key for node categories, plus the relationship vocabulary used by the graph. */
export default function GraphLegend() {
  return (
    <div className="ig-legend">
      <ul className="ig-legend__nodes" aria-label="Node colours">
        {ORDER.map((c) => (
          <li key={c}><span className="ig-dot" style={{ background: CATEGORY_META[c].colour }} aria-hidden="true" />{CATEGORY_META[c].plural}</li>
        ))}
      </ul>
      <p className="ig-legend__rels"><span>Relationships:</span> {(Object.keys(RELATIONSHIP_LABEL) as RelationshipType[]).join(' · ')}</p>
    </div>
  );
}
