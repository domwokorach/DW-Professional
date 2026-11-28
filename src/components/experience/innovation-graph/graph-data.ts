/**
 * Fictional demonstration data for the Innovation Community knowledge graph.
 * Not a verified Lloyds Banking Group organisational structure: every entity and relationship is invented for illustration.
 */

export type GraphCategory = 'community' | 'department' | 'team' | 'role' | 'event' | 'project';

export type RelationshipType =
  | 'HAS_DEPARTMENT'
  | 'HAS_TEAM'
  | 'HAS_ROLE'
  | 'COLLABORATES_WITH'
  | 'PARTICIPATES_IN'
  | 'ORGANISES'
  | 'CONTRIBUTES_TO'
  | 'SUPPORTS'
  | 'SHARES_KNOWLEDGE_WITH';

export type GraphNodeData = { id: string; name: string; category: GraphCategory; description: string };
export type GraphLinkData = { source: string; target: string; type: RelationshipType };

export const CATEGORY_META: Record<GraphCategory, { label: string; plural: string; colour: string; radius: number }> = {
  community: { label: 'Innovation Community', plural: 'Innovation Community', colour: '#e0a526', radius: 44 },
  department: { label: 'Department', plural: 'Departments', colour: '#3fae6b', radius: 30 },
  team: { label: 'Team', plural: 'Teams', colour: '#4a8fe0', radius: 22 },
  role: { label: 'Professional role', plural: 'Professional roles', colour: '#9a73e6', radius: 14 },
  event: { label: 'Conference or event', plural: 'Conferences & events', colour: '#ef7d3d', radius: 22 },
  project: { label: 'Innovation project', plural: 'Innovation projects', colour: '#22a6a0', radius: 22 },
};

/** Relationship types that form the containment hierarchy used for collapsing departments and teams. */
export const HIERARCHY: RelationshipType[] = ['HAS_DEPARTMENT', 'HAS_TEAM', 'HAS_ROLE'];

export const RELATIONSHIP_LABEL: Record<RelationshipType, string> = {
  HAS_DEPARTMENT: 'Has department',
  HAS_TEAM: 'Has team',
  HAS_ROLE: 'Has role',
  COLLABORATES_WITH: 'Collaborates with',
  PARTICIPATES_IN: 'Participates in',
  ORGANISES: 'Organises',
  CONTRIBUTES_TO: 'Contributes to',
  SUPPORTS: 'Supports',
  SHARES_KNOWLEDGE_WITH: 'Shares knowledge with',
};

export const GRAPH_NODES: GraphNodeData[] = [
  { id: 'ic', name: 'Innovation Community', category: 'community', description: 'The central hub that brings people from different departments together to share ideas, run events and explore new technology.' },

  { id: 'd-tech', name: 'Technology & Engineering', category: 'department', description: 'Builds and runs the software, platforms and infrastructure that digital services depend on.' },
  { id: 'd-arch', name: 'Architecture & Strategy', category: 'department', description: 'Sets technical direction, standards and long-term technology strategy.' },
  { id: 'd-dt', name: 'Digital Transformation', category: 'department', description: 'Modernises ways of working and customer journeys through digital change.' },
  { id: 'd-ri', name: 'Research & Innovation', category: 'department', description: 'Explores emerging technology and tests new ideas before they are adopted more widely.' },
  { id: 'd-bo', name: 'Business & Operations', category: 'department', description: 'Keeps day-to-day delivery running and connects business needs to technical work.' },
  { id: 'd-da', name: 'Data & Analytics', category: 'department', description: 'Turns data into insight through analysis, modelling and reporting.' },

  { id: 't-fe', name: 'Frontend Engineering', category: 'team', description: 'Builds accessible, responsive user interfaces and reusable components.' },
  { id: 't-be', name: 'Backend Engineering', category: 'team', description: 'Builds services, APIs and data access behind the interfaces.' },
  { id: 't-cd', name: 'Cloud & DevOps', category: 'team', description: 'Automates build, test and release pipelines and manages cloud environments.' },
  { id: 't-ea', name: 'Enterprise Architecture', category: 'team', description: 'Maps systems and capabilities so that solutions fit together coherently.' },
  { id: 't-ux', name: 'UX & Design', category: 'team', description: 'Designs prototypes, wireframes and experiences around user needs.' },
  { id: 't-ai', name: 'Artificial Intelligence', category: 'team', description: 'Prototypes machine-learning and AI-assisted features.' },
  { id: 't-de', name: 'Data Engineering', category: 'team', description: 'Builds the pipelines and stores that make data reliable and available.' },
  { id: 't-il', name: 'Innovation Labs', category: 'team', description: 'Runs short experiments and proofs of concept on emerging ideas.' },

  { id: 'r-se', name: 'Software Engineer', category: 'role', description: 'Designs, builds and tests software features.' },
  { id: 'r-fd', name: 'Frontend Developer', category: 'role', description: 'Implements user interfaces and design-system components.' },
  { id: 'r-wd', name: 'Web Developer', category: 'role', description: 'Builds and maintains websites and web content.' },
  { id: 'r-sa', name: 'Solution Architect', category: 'role', description: 'Shapes the technical design of a specific solution.' },
  { id: 'r-ea', name: 'Enterprise Architect', category: 'role', description: 'Aligns solutions with the wider technology landscape.' },
  { id: 'r-ux', name: 'UX Designer', category: 'role', description: 'Researches and designs user journeys and interfaces.' },
  { id: 'r-ds', name: 'Data Scientist', category: 'role', description: 'Builds models and analyses to answer data questions.' },
  { id: 'r-ba', name: 'Business Analyst', category: 'role', description: 'Turns business needs into clear requirements.' },
  { id: 'r-pm', name: 'Project Manager', category: 'role', description: 'Plans and coordinates delivery across teams.' },
  { id: 'r-do', name: 'DevOps Engineer', category: 'role', description: 'Maintains delivery pipelines and environments.' },
  { id: 'r-fin', name: 'Finance', category: 'role', description: 'Supports budgeting and funding for initiatives.' },
  { id: 'r-hr', name: 'HR', category: 'role', description: 'Supports people, skills development and engagement.' },

  { id: 'e-conf', name: 'Innovation Conferences', category: 'event', description: 'Cross-department events where teams present ideas and prototypes.' },
  { id: 'e-work', name: 'Technology Workshops', category: 'event', description: 'Hands-on sessions to learn and try new tools together.' },
  { id: 'e-know', name: 'Knowledge Sharing', category: 'event', description: 'Regular talks and write-ups that spread what teams have learned.' },

  { id: 'p-poc', name: 'Proof of Concept', category: 'project', description: 'Small prototypes that test whether an idea is worth pursuing.' },
  { id: 'p-rd', name: 'Research & Development', category: 'project', description: 'Longer-running investigation into new technology and methods.' },
  { id: 'p-proj', name: 'Innovation Projects', category: 'project', description: 'Cross-team initiatives that turn promising ideas into working outcomes.' },
];

const l = (source: string, type: RelationshipType, target: string): GraphLinkData => ({ source, target, type });

export const GRAPH_LINKS: GraphLinkData[] = [
  // Departments
  l('ic', 'HAS_DEPARTMENT', 'd-tech'), l('ic', 'HAS_DEPARTMENT', 'd-arch'), l('ic', 'HAS_DEPARTMENT', 'd-dt'),
  l('ic', 'HAS_DEPARTMENT', 'd-ri'), l('ic', 'HAS_DEPARTMENT', 'd-bo'), l('ic', 'HAS_DEPARTMENT', 'd-da'),
  // Teams
  l('d-tech', 'HAS_TEAM', 't-fe'), l('d-tech', 'HAS_TEAM', 't-be'), l('d-tech', 'HAS_TEAM', 't-cd'),
  l('d-arch', 'HAS_TEAM', 't-ea'), l('d-dt', 'HAS_TEAM', 't-ux'),
  l('d-ri', 'HAS_TEAM', 't-ai'), l('d-ri', 'HAS_TEAM', 't-il'), l('d-da', 'HAS_TEAM', 't-de'),
  // Roles
  l('t-fe', 'HAS_ROLE', 'r-fd'), l('t-fe', 'HAS_ROLE', 'r-wd'), l('t-be', 'HAS_ROLE', 'r-se'), l('t-cd', 'HAS_ROLE', 'r-do'),
  l('t-ea', 'HAS_ROLE', 'r-sa'), l('t-ea', 'HAS_ROLE', 'r-ea'), l('t-ux', 'HAS_ROLE', 'r-ux'), l('t-ai', 'HAS_ROLE', 'r-ds'),
  l('d-bo', 'HAS_ROLE', 'r-ba'), l('d-bo', 'HAS_ROLE', 'r-pm'), l('d-bo', 'HAS_ROLE', 'r-fin'), l('d-bo', 'HAS_ROLE', 'r-hr'),
  // Innovation activities organised by the community
  l('ic', 'ORGANISES', 'e-conf'), l('ic', 'ORGANISES', 'e-work'), l('ic', 'ORGANISES', 'e-know'),
  l('ic', 'ORGANISES', 'p-poc'), l('ic', 'ORGANISES', 'p-rd'), l('ic', 'ORGANISES', 'p-proj'),
  // Cross-department collaboration
  l('d-tech', 'COLLABORATES_WITH', 'd-arch'), l('d-dt', 'COLLABORATES_WITH', 'd-ri'), l('d-da', 'COLLABORATES_WITH', 'd-ri'), l('d-bo', 'COLLABORATES_WITH', 'd-dt'),
  l('t-fe', 'COLLABORATES_WITH', 't-ux'), l('t-be', 'COLLABORATES_WITH', 't-de'), l('t-cd', 'COLLABORATES_WITH', 't-be'),
  l('t-ea', 'COLLABORATES_WITH', 't-cd'), l('t-ai', 'COLLABORATES_WITH', 't-de'), l('t-il', 'COLLABORATES_WITH', 't-ai'), l('t-il', 'COLLABORATES_WITH', 't-fe'),
  // Knowledge sharing
  l('t-il', 'SHARES_KNOWLEDGE_WITH', 't-ea'), l('t-ux', 'SHARES_KNOWLEDGE_WITH', 't-il'), l('t-de', 'SHARES_KNOWLEDGE_WITH', 't-ai'),
  l('r-ea', 'SHARES_KNOWLEDGE_WITH', 'r-sa'), l('r-wd', 'SHARES_KNOWLEDGE_WITH', 'r-fd'), l('r-se', 'SHARES_KNOWLEDGE_WITH', 'r-do'),
  // Participation
  l('r-fd', 'PARTICIPATES_IN', 'e-conf'), l('r-wd', 'PARTICIPATES_IN', 'e-conf'), l('r-pm', 'PARTICIPATES_IN', 'e-conf'),
  l('r-se', 'PARTICIPATES_IN', 'e-work'), l('r-do', 'PARTICIPATES_IN', 'e-work'), l('r-ux', 'PARTICIPATES_IN', 'e-work'),
  l('r-sa', 'PARTICIPATES_IN', 'e-know'), l('r-ea', 'PARTICIPATES_IN', 'e-know'), l('r-hr', 'PARTICIPATES_IN', 'e-know'),
  l('r-ds', 'PARTICIPATES_IN', 'p-poc'), l('r-ba', 'PARTICIPATES_IN', 'p-proj'), l('r-fin', 'PARTICIPATES_IN', 'p-proj'),
  // Contributions and support for innovation projects
  l('t-il', 'CONTRIBUTES_TO', 'p-poc'), l('t-ai', 'CONTRIBUTES_TO', 'p-rd'), l('t-fe', 'CONTRIBUTES_TO', 'p-poc'),
  l('t-de', 'CONTRIBUTES_TO', 'p-rd'), l('t-ux', 'CONTRIBUTES_TO', 'p-proj'), l('t-ea', 'CONTRIBUTES_TO', 'p-proj'),
  l('d-ri', 'SUPPORTS', 'p-rd'), l('d-dt', 'SUPPORTS', 'p-proj'), l('d-arch', 'SUPPORTS', 'e-know'), l('d-bo', 'SUPPORTS', 'e-conf'), l('d-tech', 'SUPPORTS', 'e-work'),
];

export const NODE_BY_ID: ReadonlyMap<string, GraphNodeData> = new Map(GRAPH_NODES.map((n) => [n.id, n]));

/** Containment parent (department → team → role) used for collapsing; undefined for the hub and for activities. */
export const PARENT_OF: ReadonlyMap<string, string> = new Map(
  GRAPH_LINKS.filter((link) => HIERARCHY.includes(link.type) && link.source !== 'ic').map((link) => [link.target, link.source]),
);

/** Statistics calculated from the demonstration dataset only. */
export function graphStatistics() {
  const count = (c: GraphCategory) => GRAPH_NODES.filter((n) => n.category === c).length;
  return {
    nodes: GRAPH_NODES.length,
    relationships: GRAPH_LINKS.length,
    departments: count('department'),
    teams: count('team'),
    roles: count('role'),
    activities: count('event') + count('project'),
  };
}

/** Illustrative Cypher showing how the selected entity's neighbourhood would be queried in Neo4j. */
export function cypherFor(node: GraphNodeData): string {
  const label = node.category === 'community' ? 'InnovationCommunity' : node.category[0].toUpperCase() + node.category.slice(1);
  return `MATCH (n:${label} {name: "${node.name}"})-[r]-(m)\nRETURN n, r, m`;
}

export type Neighbour = { node: GraphNodeData; type: RelationshipType; outgoing: boolean };

export function neighboursOf(id: string): Neighbour[] {
  const out: Neighbour[] = [];
  for (const link of GRAPH_LINKS) {
    if (link.source === id) out.push({ node: NODE_BY_ID.get(link.target)!, type: link.type, outgoing: true });
    else if (link.target === id) out.push({ node: NODE_BY_ID.get(link.source)!, type: link.type, outgoing: false });
  }
  return out;
}
