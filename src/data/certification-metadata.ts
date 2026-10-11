/** Details read from each certificate in `.certification` (keyed by file name without extension / "certificate" suffix). */
export type LocalCertificationMetadata = { title: string; technology: string; category: string; level?: string; issuedAt: string };

const issuer = 'HackerRank';

export const certificationIssuer = issuer;

export const localCertificationMetadata: Record<string, LocalCertificationMetadata> = {
  angular_intermediate: { title: 'Angular (Intermediate)', technology: 'Angular', category: 'Frontend', level: 'Intermediate', issuedAt: '2025-10-08' },
  c_sharp_basic: { title: 'C# (Basic)', technology: 'C#', category: 'Backend', level: 'Basic', issuedAt: '2025-10-07' },
  frontend_developer_react: { title: 'Frontend Developer (React)', technology: 'React', category: 'Frontend', issuedAt: '2025-10-07' },
  golang_basic: { title: 'Go (Basic)', technology: 'Go', category: 'Backend', level: 'Basic', issuedAt: '2025-10-15' },
  java_basic: { title: 'Java (Basic)', technology: 'Java', category: 'Backend', level: 'Basic', issuedAt: '2025-11-02' },
  javascript_intermediate: { title: 'JavaScript (Intermediate)', technology: 'JavaScript', category: 'Frontend', level: 'Intermediate', issuedAt: '2025-09-11' },
  nodejs_basic: { title: 'Node (Basic)', technology: 'Node.js', category: 'Backend', level: 'Basic', issuedAt: '2025-09-30' },
  problem_solving_basic: { title: 'Problem Solving (Basic)', technology: 'Algorithms', category: 'Algorithms', level: 'Basic', issuedAt: '2025-09-06' },
  react_basic: { title: 'React (Basic)', technology: 'React', category: 'Frontend', level: 'Basic', issuedAt: '2025-09-11' },
  rest_api_intermediate: { title: 'REST API (Intermediate)', technology: 'REST API', category: 'Backend', level: 'Intermediate', issuedAt: '2025-10-08' },
  software_engineer: { title: 'Software Engineer', technology: 'Software Engineering', category: 'Software Engineering', issuedAt: '2025-10-11' },
  software_engineer_intern: { title: 'Software Engineer Intern', technology: 'Software Engineering', category: 'Software Engineering', issuedAt: '2025-09-30' },
  sql_basic: { title: 'SQL (Basic)', technology: 'SQL', category: 'Databases', level: 'Basic', issuedAt: '2025-10-03' },
};
