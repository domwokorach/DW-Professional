import type { IconType } from "react-icons";
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiJavascript,
  SiHtml5,
  SiCss,
  SiPostcss,
  SiMui,
  SiTailwindcss,
  SiSass,
  SiLess,
  SiBootstrap,
  SiNodedotjs,
  SiExpress,
  SiPython,
  SiFastapi,
  SiGraphql,
  SiAnthropic,
  SiD3,
  SiSocketdotio,
  SiDjango,
  SiJsonwebtokens,
  SiOwasp,
  SiJest,
  SiTestinglibrary,
  SiGooglecloud,
  SiCloudflare,
  SiDocker,
  SiKubernetes,
  SiJenkins,
  SiGithubactions,
  SiPostgresql,
  SiMongodb,
  SiMysql,
  SiSqlite,
  SiSupabase,
  SiPrisma,
  SiPostman,
  SiGooglechrome,
  SiJira,
  SiConfluence,
  SiFigma,
} from "react-icons/si";
import { FaAws } from "react-icons/fa6";
import { TbBrandAdobeXd } from "react-icons/tb";
import {
  Smartphone,
  Network,
  Drama,
  TestTube,
  Sparkles,
  Brain,
  KeyRound,
  Globe,
  ShieldCheck,
  Lock,
  LockKeyhole,
  MonitorSmartphone,
  PenTool,
  Accessibility as AccessibilityIcon,
  Laptop,
} from "lucide-react";

export type FullStackCategory =
  | "Frontend"
  | "Backend & APIs"
  | "Authentication & Security"
  | "Testing & Quality"
  | "Cloud & DevOps"
  | "Databases & ORM"
  | "Development Tools"
  | "AI"
  | "Design";

export type FullStackTech = {
  /** Display name, used as the accessible label and tooltip text. */
  name: string;
  /** simple-icons slug for the brand mark, where one exists. */
  slug?: string;
  /** Icon component rendered in the cloud (brand mark, or a clean fallback). */
  Icon: IconType;
  category: FullStackCategory;
};

/**
 * Single source of truth for the Full Stack Overview icon cloud.
 * One entry per technology — no duplicates (e.g. JWT is represented once,
 * under Authentication & Security, rather than also appearing under
 * Backend & APIs).
 */
export const fullStackTech: FullStackTech[] = [
  // Frontend
  { name: "React", slug: "react", Icon: SiReact, category: "Frontend" },
  { name: "Next.js", slug: "nextdotjs", Icon: SiNextdotjs, category: "Frontend" },
  { name: "React Native", slug: "react", Icon: Smartphone, category: "Frontend" },
  { name: "TypeScript", slug: "typescript", Icon: SiTypescript, category: "Frontend" },
  { name: "JavaScript", slug: "javascript", Icon: SiJavascript, category: "Frontend" },
  { name: "HTML5", slug: "html5", Icon: SiHtml5, category: "Frontend" },
  { name: "CSS", slug: "css", Icon: SiCss, category: "Frontend" },
  { name: "PostCSS", slug: "postcss", Icon: SiPostcss, category: "Frontend" },
  { name: "MUI", slug: "mui", Icon: SiMui, category: "Frontend" },
  { name: "Tailwind CSS", slug: "tailwindcss", Icon: SiTailwindcss, category: "Frontend" },
  { name: "Sass", slug: "sass", Icon: SiSass, category: "Frontend" },
  { name: "Less", slug: "less", Icon: SiLess, category: "Frontend" },
  { name: "Bootstrap", slug: "bootstrap", Icon: SiBootstrap, category: "Frontend" },

  // Backend & APIs
  { name: "Node.js", slug: "nodedotjs", Icon: SiNodedotjs, category: "Backend & APIs" },
  { name: "Express", slug: "express", Icon: SiExpress, category: "Backend & APIs" },
  { name: "Python", slug: "python", Icon: SiPython, category: "Backend & APIs" },
  { name: "FastAPI", slug: "fastapi", Icon: SiFastapi, category: "Backend & APIs" },
  { name: "GraphQL", slug: "graphql", Icon: SiGraphql, category: "Backend & APIs" },
  { name: "MCP", slug: "modelcontextprotocol", Icon: SiAnthropic, category: "Backend & APIs" },
  { name: "D3.js", slug: "d3dotjs", Icon: SiD3, category: "Backend & APIs" },
  { name: "Socket.IO", slug: "socketdotio", Icon: SiSocketdotio, category: "Backend & APIs" },
  { name: "REST API", Icon: Network, category: "Backend & APIs" },
  { name: "Django", slug: "django", Icon: SiDjango, category: "Backend & APIs" },

  // Authentication & Security
  {
    name: "JWT Authentication",
    slug: "jsonwebtokens",
    Icon: SiJsonwebtokens,
    category: "Authentication & Security",
  },
  { name: "OAuth 2.0", Icon: KeyRound, category: "Authentication & Security" },
  { name: "CORS", Icon: Globe, category: "Authentication & Security" },
  { name: "Helmet", Icon: ShieldCheck, category: "Authentication & Security" },
  { name: "bcrypt", Icon: Lock, category: "Authentication & Security" },
  { name: "HTTPS / TLS", Icon: LockKeyhole, category: "Authentication & Security" },
  { name: "OWASP", slug: "owasp", Icon: SiOwasp, category: "Authentication & Security" },

  // Testing & Quality
  { name: "Jest", slug: "jest", Icon: SiJest, category: "Testing & Quality" },
  {
    name: "React Testing Library",
    slug: "testinglibrary",
    Icon: SiTestinglibrary,
    category: "Testing & Quality",
  },
  { name: "Playwright", Icon: Drama, category: "Testing & Quality" },
  { name: "TDD", Icon: TestTube, category: "Testing & Quality" },

  // Cloud & DevOps
  { name: "AWS", slug: "amazonaws", Icon: FaAws, category: "Cloud & DevOps" },
  {
    name: "Google Cloud Platform",
    slug: "googlecloud",
    Icon: SiGooglecloud,
    category: "Cloud & DevOps",
  },
  { name: "Cloudflare", slug: "cloudflare", Icon: SiCloudflare, category: "Cloud & DevOps" },
  { name: "Docker", slug: "docker", Icon: SiDocker, category: "Cloud & DevOps" },
  { name: "Kubernetes", slug: "kubernetes", Icon: SiKubernetes, category: "Cloud & DevOps" },
  { name: "Jenkins", slug: "jenkins", Icon: SiJenkins, category: "Cloud & DevOps" },
  { name: "GitHub Actions", slug: "githubactions", Icon: SiGithubactions, category: "Cloud & DevOps" },

  // Databases & ORM
  { name: "PostgreSQL", slug: "postgresql", Icon: SiPostgresql, category: "Databases & ORM" },
  { name: "MongoDB", slug: "mongodb", Icon: SiMongodb, category: "Databases & ORM" },
  { name: "MySQL", slug: "mysql", Icon: SiMysql, category: "Databases & ORM" },
  { name: "SQLite", slug: "sqlite", Icon: SiSqlite, category: "Databases & ORM" },
  { name: "Supabase", slug: "supabase", Icon: SiSupabase, category: "Databases & ORM" },
  { name: "Prisma ORM", slug: "prisma", Icon: SiPrisma, category: "Databases & ORM" },

  // Development Tools
  { name: "Postman", slug: "postman", Icon: SiPostman, category: "Development Tools" },
  { name: "Browser DevTools", slug: "googlechrome", Icon: SiGooglechrome, category: "Development Tools" },
  {
    name: "Local Development Environment",
    Icon: Laptop,
    category: "Development Tools",
  },
  { name: "Jira", slug: "jira", Icon: SiJira, category: "Development Tools" },
  { name: "Confluence", slug: "confluence", Icon: SiConfluence, category: "Development Tools" },

  // AI
  { name: "Generative AI", Icon: Sparkles, category: "AI" },
  { name: "LLMs", Icon: Brain, category: "AI" },

  // Design
  { name: "Figma", slug: "figma", Icon: SiFigma, category: "Design" },
  { name: "Adobe XD", Icon: TbBrandAdobeXd, category: "Design" },
  { name: "Responsive Design", Icon: MonitorSmartphone, category: "Design" },
  { name: "UI/UX Design", Icon: PenTool, category: "Design" },
  { name: "Accessibility", Icon: AccessibilityIcon, category: "Design" },
];
