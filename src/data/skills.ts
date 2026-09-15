import {
  Code2,
  ServerCog,
  FlaskConical,
  CloudCog,
  Database,
  Terminal,
  BrainCircuit,
  ShieldCheck,
  PenTool,
  Palette,
  type LucideIcon,
} from "lucide-react";

export type SkillItem = {
  name: string;
  core?: boolean;
};

export type SkillCategory = {
  index: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClassName: string;
  items: SkillItem[];
};

const CORE_STACK = new Set(["React", "Next.js", "TypeScript", "JavaScript", "Node.js", "Tailwind CSS"]);

function withCore(names: string[]): SkillItem[] {
  return names.map((name) => ({ name, core: CORE_STACK.has(name) }));
}

export const skillCategories: SkillCategory[] = [
  {
    index: "01",
    title: "Frontend",
    description:
      "Building accessible, responsive and high-performance interfaces across web and native applications.",
    icon: Code2,
    accentClassName: "text-blue-300",
    items: withCore([
      "React",
      "Next.js",
      "React Native",
      "TypeScript",
      "JavaScript",
      "HTML5",
      "CSS",
      "PostCSS",
    ]),
  },
  {
    index: "02",
    title: "Backend & APIs",
    description: "Developing backend services and API integrations for modern applications.",
    icon: ServerCog,
    accentClassName: "text-violet-300",
    items: withCore(["Node.js", "REST API", "Django", "JWT Authentication"]),
  },
  {
    index: "03",
    title: "Testing & Quality",
    description: "Building reliable software through automated testing practices.",
    icon: FlaskConical,
    accentClassName: "text-amber-300",
    items: withCore(["Jest", "React Testing Library", "Playwright", "TDD"]),
  },
  {
    index: "04",
    title: "Cloud & DevOps",
    description:
      "Supporting cloud-native development, containerisation and automated build and deployment workflows.",
    icon: CloudCog,
    accentClassName: "text-sky-300",
    items: withCore([
      "AWS",
      "Google Cloud Platform",
      "Cloudflare",
      "Docker",
      "Kubernetes",
      "Jenkins",
      "GitHub Actions",
    ]),
  },
  {
    index: "05",
    title: "Databases & ORM",
    description: "Modelling, storing and querying data across relational and document databases.",
    icon: Database,
    accentClassName: "text-emerald-300",
    items: withCore(["PostgreSQL", "MongoDB", "MySQL", "SQLite", "Supabase", "Prisma ORM"]),
  },
  {
    index: "06",
    title: "Development Tools",
    description: "Day-to-day tooling for building, debugging and shipping software as part of a team.",
    icon: Terminal,
    accentClassName: "text-orange-300",
    items: withCore([
      "Postman",
      "Browser DevTools",
      "Local Development Environment",
      "Jira",
      "Confluence",
    ]),
  },
  {
    index: "07",
    title: "AI & LLM",
    description: "Applying generative AI and large language models to build practical, agentic features.",
    icon: BrainCircuit,
    accentClassName: "text-fuchsia-300",
    items: withCore(["Generative AI", "LLMs", "MCP Server"]),
  },
  {
    index: "08",
    title: "Security & Authentication",
    description: "Protecting applications and data with modern authentication and web security practices.",
    icon: ShieldCheck,
    accentClassName: "text-red-300",
    items: withCore(["JWT", "OAuth 2.0", "CORS", "Helmet", "bcrypt", "HTTPS / TLS", "OWASP"]),
  },
  {
    index: "09",
    title: "UI/UX & Design",
    description:
      "Combining frontend engineering with UX/UI design and accessibility to create usable, inclusive digital experiences.",
    icon: PenTool,
    accentClassName: "text-pink-300",
    items: withCore(["Figma", "Adobe XD", "Responsive Design", "UI/UX Design", "Accessibility"]),
  },
  {
    index: "10",
    title: "CSS & Styling",
    description: "Styling systems and component libraries for consistent, maintainable design at scale.",
    icon: Palette,
    accentClassName: "text-teal-300",
    items: withCore(["CSS", "MUI", "Tailwind CSS", "Sass", "Less", "PostCSS", "Bootstrap"]),
  },
];
