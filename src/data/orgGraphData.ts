export type OrgNodeType =
  | "organisation"
  | "department"
  | "team"
  | "role"
  | "person"
  | "project";

export type OrgNode = {
  id: string;
  type: OrgNodeType;
  name: string;
  /** Structural parent (organisation → department → team → role → person). */
  parentId?: string;
  /** Reporting line — who this person reports to (may differ from structural parent for cross-functional roles). */
  managerId?: string;
  /** Team ids this node also belongs to, for cross-functional membership. */
  crossFunctionalTeamIds?: string[];
  /** Project/initiative ids this node contributes to. */
  projectIds?: string[];
  department?: string;
  team?: string;
  title?: string;
  responsibilities?: string[];
  teamSize?: number;
  status?: string;
};

export type OrgLink = {
  source: string;
  target: string;
  kind: "structure" | "reporting" | "cross-functional" | "project";
};

export const orgNodes: OrgNode[] = [
  { id: "org", type: "organisation", name: "Innovation X", status: "Active" },

  // Departments
  { id: "dept-eng", type: "department", name: "Engineering", parentId: "org", teamSize: 18 },
  { id: "dept-product", type: "department", name: "Product & Design", parentId: "org", teamSize: 9 },
  { id: "dept-data", type: "department", name: "Data & Analytics", parentId: "org", teamSize: 7 },
  { id: "dept-people", type: "department", name: "People & Culture", parentId: "org", teamSize: 5 },

  // Teams
  { id: "team-platform", type: "team", name: "Platform", parentId: "dept-eng", department: "Engineering", teamSize: 6 },
  { id: "team-growth", type: "team", name: "Growth Engineering", parentId: "dept-eng", department: "Engineering", teamSize: 5 },
  { id: "team-mobile", type: "team", name: "Mobile", parentId: "dept-eng", department: "Engineering", teamSize: 4 },
  { id: "team-design", type: "team", name: "Product Design", parentId: "dept-product", department: "Product & Design", teamSize: 4 },
  { id: "team-research", type: "team", name: "User Research", parentId: "dept-product", department: "Product & Design", teamSize: 3 },
  { id: "team-analytics", type: "team", name: "Analytics Engineering", parentId: "dept-data", department: "Data & Analytics", teamSize: 4 },
  { id: "team-ml", type: "team", name: "Applied ML", parentId: "dept-data", department: "Data & Analytics", teamSize: 3 },
  { id: "team-talent", type: "team", name: "Talent & Ops", parentId: "dept-people", department: "People & Culture", teamSize: 5 },
  {
    id: "team-innovation-lab",
    type: "team",
    name: "Innovation Lab",
    parentId: "dept-eng",
    department: "Cross-functional",
    teamSize: 5,
    responsibilities: ["Incubates cross-department pilots and emerging-tech proofs of concept."],
  },

  // Roles (job families within a team)
  { id: "role-eng-manager-platform", type: "role", name: "Engineering Manager", parentId: "team-platform" },
  { id: "role-senior-eng-platform", type: "role", name: "Senior Engineer", parentId: "team-platform" },
  { id: "role-eng-growth", type: "role", name: "Engineering Manager", parentId: "team-growth" },
  { id: "role-eng-mobile", type: "role", name: "Mobile Lead", parentId: "team-mobile" },
  { id: "role-design-lead", type: "role", name: "Design Lead", parentId: "team-design" },
  { id: "role-researcher", type: "role", name: "Research Lead", parentId: "team-research" },
  { id: "role-analytics-lead", type: "role", name: "Analytics Lead", parentId: "team-analytics" },
  { id: "role-ml-lead", type: "role", name: "ML Lead", parentId: "team-ml" },
  { id: "role-hrbp", type: "role", name: "HR Business Partner", parentId: "team-talent" },
  { id: "role-lab-lead", type: "role", name: "Innovation Lead", parentId: "team-innovation-lab" },

  // People
  {
    id: "person-cto",
    type: "person",
    name: "Amara Chen",
    parentId: "org",
    title: "Chief Technology Officer",
    department: "Executive",
    responsibilities: ["Sets engineering and technology strategy", "Owns the technology roadmap"],
    status: "Available",
  },
  {
    id: "person-vp-eng",
    type: "person",
    name: "Daniel Osei",
    parentId: "dept-eng",
    managerId: "person-cto",
    title: "VP of Engineering",
    department: "Engineering",
    responsibilities: ["Leads Engineering department", "Coordinates delivery across Platform, Growth and Mobile"],
    status: "Available",
  },
  {
    id: "person-em-platform",
    type: "person",
    name: "Priya Nair",
    parentId: "role-eng-manager-platform",
    managerId: "person-vp-eng",
    title: "Engineering Manager, Platform",
    department: "Engineering",
    team: "Platform",
    responsibilities: ["Leads the Platform team", "Owns infrastructure reliability"],
    projectIds: ["proj-graph-platform"],
    status: "Available",
  },
  {
    id: "person-senior-eng-1",
    type: "person",
    name: "Marcus Webb",
    parentId: "role-senior-eng-platform",
    managerId: "person-em-platform",
    title: "Senior Software Engineer",
    department: "Engineering",
    team: "Platform",
    responsibilities: ["Builds core platform services", "Mentors mid-level engineers"],
    projectIds: ["proj-graph-platform", "proj-org-intel"],
    status: "Available",
  },
  {
    id: "person-senior-eng-2",
    type: "person",
    name: "Sofia Bianchi",
    parentId: "role-senior-eng-platform",
    managerId: "person-em-platform",
    title: "Senior Software Engineer",
    department: "Engineering",
    team: "Platform",
    responsibilities: ["Owns API architecture", "Leads platform observability"],
    status: "Away",
  },
  {
    id: "person-em-growth",
    type: "person",
    name: "James Okafor",
    parentId: "role-eng-growth",
    managerId: "person-vp-eng",
    title: "Engineering Manager, Growth",
    department: "Engineering",
    team: "Growth Engineering",
    responsibilities: ["Leads Growth Engineering", "Partners with Product on experimentation"],
    projectIds: ["proj-onboarding"],
    status: "Available",
  },
  {
    id: "person-growth-eng-1",
    type: "person",
    name: "Lena Fischer",
    parentId: "team-growth",
    managerId: "person-em-growth",
    title: "Software Engineer",
    department: "Engineering",
    team: "Growth Engineering",
    responsibilities: ["Builds onboarding and activation flows"],
    projectIds: ["proj-onboarding"],
    status: "Available",
  },
  {
    id: "person-mobile-lead",
    type: "person",
    name: "Tariq Hassan",
    parentId: "role-eng-mobile",
    managerId: "person-vp-eng",
    title: "Mobile Engineering Lead",
    department: "Engineering",
    team: "Mobile",
    responsibilities: ["Leads iOS and Android delivery"],
    status: "Available",
  },
  {
    id: "person-vp-product",
    type: "person",
    name: "Hannah Lee",
    parentId: "dept-product",
    managerId: "person-cto",
    title: "VP of Product & Design",
    department: "Product & Design",
    responsibilities: ["Leads Product & Design department", "Owns product strategy"],
    status: "Available",
  },
  {
    id: "person-design-lead",
    type: "person",
    name: "Oliver Grant",
    parentId: "role-design-lead",
    managerId: "person-vp-product",
    title: "Design Lead",
    department: "Product & Design",
    team: "Product Design",
    responsibilities: ["Leads product design across squads", "Owns the design system"],
    projectIds: ["proj-org-intel"],
    status: "Available",
  },
  {
    id: "person-researcher",
    type: "person",
    name: "Fatima Zahra",
    parentId: "role-researcher",
    managerId: "person-vp-product",
    title: "Lead User Researcher",
    department: "Product & Design",
    team: "User Research",
    responsibilities: ["Runs discovery research", "Maintains the insight repository"],
    status: "Available",
  },
  {
    id: "person-vp-data",
    type: "person",
    name: "Noah Kim",
    parentId: "dept-data",
    managerId: "person-cto",
    title: "VP of Data & Analytics",
    department: "Data & Analytics",
    responsibilities: ["Leads Data & Analytics department"],
    status: "Available",
  },
  {
    id: "person-analytics-lead",
    type: "person",
    name: "Grace Muturi",
    parentId: "role-analytics-lead",
    managerId: "person-vp-data",
    title: "Analytics Engineering Lead",
    department: "Data & Analytics",
    team: "Analytics Engineering",
    responsibilities: ["Owns the analytics data models"],
    projectIds: ["proj-org-intel"],
    status: "Available",
  },
  {
    id: "person-ml-lead",
    type: "person",
    name: "Ethan Brooks",
    parentId: "role-ml-lead",
    managerId: "person-vp-data",
    title: "Applied ML Lead",
    department: "Data & Analytics",
    team: "Applied ML",
    responsibilities: ["Leads applied ML initiatives", "Builds the recommendation models"],
    projectIds: ["proj-org-intel"],
    status: "Away",
  },
  {
    id: "person-vp-people",
    type: "person",
    name: "Isabella Rossi",
    parentId: "dept-people",
    managerId: "person-cto",
    title: "VP of People & Culture",
    department: "People & Culture",
    responsibilities: ["Leads People & Culture department"],
    status: "Available",
  },
  {
    id: "person-hrbp",
    type: "person",
    name: "Kwame Mensah",
    parentId: "role-hrbp",
    managerId: "person-vp-people",
    title: "HR Business Partner",
    department: "People & Culture",
    team: "Talent & Ops",
    responsibilities: ["Partners with Engineering on hiring and org design"],
    status: "Available",
  },
  {
    id: "person-lab-lead",
    type: "person",
    name: "Yuki Tanaka",
    parentId: "role-lab-lead",
    managerId: "person-vp-eng",
    title: "Innovation Lead",
    department: "Cross-functional",
    team: "Innovation Lab",
    responsibilities: ["Runs the Innovation Lab", "Coordinates cross-functional pilots"],
    crossFunctionalTeamIds: ["team-platform", "team-design", "team-ml"],
    projectIds: ["proj-org-intel", "proj-graph-platform"],
    status: "Available",
  },

  // Projects / initiatives
  {
    id: "proj-org-intel",
    type: "project",
    name: "Org Intelligence Platform",
    responsibilities: ["Interactive workforce and organisation visualisation for leadership and People teams."],
    status: "In progress",
  },
  {
    id: "proj-graph-platform",
    type: "project",
    name: "Graph Data Platform",
    responsibilities: ["Backing graph database and APIs powering internal org and knowledge tools."],
    status: "In progress",
  },
  {
    id: "proj-onboarding",
    type: "project",
    name: "New-Hire Onboarding Revamp",
    responsibilities: ["Redesigning the onboarding journey for new starters."],
    status: "Planned",
  },
];

export const orgLinks: OrgLink[] = [
  // Structural hierarchy (parentId)
  ...orgNodes
    .filter((n) => n.parentId)
    .map((n): OrgLink => ({ source: n.parentId as string, target: n.id, kind: "structure" })),

  // Reporting lines (managerId), skipped when equal to structural parent
  ...orgNodes
    .filter((n) => n.managerId && n.managerId !== n.parentId)
    .map((n): OrgLink => ({ source: n.managerId as string, target: n.id, kind: "reporting" })),

  // Cross-functional team membership
  ...orgNodes.flatMap((n) =>
    (n.crossFunctionalTeamIds ?? []).map(
      (teamId): OrgLink => ({ source: teamId, target: n.id, kind: "cross-functional" })
    )
  ),

  // Project contributions
  ...orgNodes.flatMap((n) =>
    (n.projectIds ?? []).map((projectId): OrgLink => ({ source: n.id, target: projectId, kind: "project" }))
  ),
];
