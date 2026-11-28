import { graphStatistics } from './graph-data';

/** Counts calculated from the demonstration dataset, not real organisational figures. */
export default function GraphStatistics() {
  const s = graphStatistics();
  const items: [string, number][] = [['Nodes', s.nodes], ['Relationships', s.relationships], ['Departments', s.departments], ['Teams', s.teams], ['Roles', s.roles], ['Activities', s.activities]];
  return (
    <dl className="ig-stats" aria-label="Demonstration dataset statistics">
      {items.map(([label, value]) => (
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
      ))}
    </dl>
  );
}
