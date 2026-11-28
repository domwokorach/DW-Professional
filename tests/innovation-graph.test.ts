import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, test } from 'node:test';
import { CATEGORY_META, GRAPH_LINKS, GRAPH_NODES, HIERARCHY, NODE_BY_ID, PARENT_OF, RELATIONSHIP_LABEL, cypherFor, graphStatistics, neighboursOf } from '../src/components/experience/innovation-graph/graph-data';
import layout from '../src/components/experience/innovation-graph/graph-layout.json';

describe('innovation graph demonstration data', () => {
  test('node ids are unique and every link references existing nodes with a known relationship type', () => {
    assert.equal(new Set(GRAPH_NODES.map((n) => n.id)).size, GRAPH_NODES.length);
    for (const link of GRAPH_LINKS) {
      assert.ok(NODE_BY_ID.has(link.source), `unknown source ${link.source}`);
      assert.ok(NODE_BY_ID.has(link.target), `unknown target ${link.target}`);
      assert.ok(link.type in RELATIONSHIP_LABEL, `unknown type ${link.type}`);
    }
    assert.equal(new Set(GRAPH_LINKS.map((l) => `${l.source}|${l.type}|${l.target}`)).size, GRAPH_LINKS.length, 'duplicate relationship');
  });

  test('uses every requested entity and all nine relationship types', () => {
    const names = GRAPH_NODES.map((n) => n.name);
    for (const expected of ['Innovation Community', 'Technology & Engineering', 'Data & Analytics', 'Frontend Engineering', 'Innovation Labs', 'Software Engineer', 'DevOps Engineer', 'Innovation Conferences', 'Proof of Concept']) assert.ok(names.includes(expected), expected);
    assert.equal(new Set(GRAPH_LINKS.map((l) => l.type)).size, 9);
  });

  test('statistics are calculated from the dataset and every node is connected', () => {
    const s = graphStatistics();
    assert.deepEqual(s, { nodes: GRAPH_NODES.length, relationships: GRAPH_LINKS.length, departments: 6, teams: 8, roles: 12, activities: 6 });
    for (const n of GRAPH_NODES) assert.ok(neighboursOf(n.id).length > 0, `${n.name} is isolated`);
  });

  test('the graph is not a simple tree: it has cross-department relationships', () => {
    const cross = GRAPH_LINKS.filter((l) => !HIERARCHY.includes(l.type) && l.type !== 'ORGANISES');
    assert.ok(cross.length > GRAPH_NODES.length / 2);
    for (const l of GRAPH_LINKS.filter((x) => x.type === 'HAS_TEAM' || x.type === 'HAS_ROLE')) assert.equal(PARENT_OF.get(l.target), l.source);
  });

  test('every category has colour metadata and a stored layout position', () => {
    for (const n of GRAPH_NODES) {
      assert.ok(CATEGORY_META[n.category].colour.startsWith('#'));
      const p = (layout.positions as unknown as Record<string, number[]>)[n.id];
      assert.ok(p && Number.isFinite(p[0]) && Number.isFinite(p[1]), `no position for ${n.id}`);
    }
    assert.equal(CATEGORY_META.community.colour, '#e0a526');
  });

  test('illustrative Cypher names the selected entity', () => {
    assert.match(cypherFor(NODE_BY_ID.get('d-tech')!), /MATCH \(n:Department \{name: "Technology & Engineering"\}\)/);
  });

  test('the published preview assets exist', () => {
    for (const f of ['innovation-community-graph.gif', 'innovation-community-graph.webm', 'innovation-community-graph.mp4', 'innovation-community-graph-poster.webp']) {
      assert.ok(existsSync(`public/previews/lloyds/${f}`), f);
    }
  });
});
