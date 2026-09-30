import {
  Code2,
  ServerCog,
  FlaskConical,
  CloudCog,
  Database,
  Terminal,
  ShieldCheck,
  PenTool,
  Palette,
  Sparkles,
  Bot,
  ScanSearch,
  PlugZap,
  Cpu,
  Workflow,
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
  /** How many of `items` (from the start) show before "Show More". */
  initiallyVisible: number;
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
    initiallyVisible: 4,
    items: withCore([
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "React Native",
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
    initiallyVisible: 1,
    items: withCore(["Node.js", "REST API", "Django", "JWT Authentication"]),
  },
  {
    index: "03",
    title: "Testing & Quality",
    description: "Building reliable software through automated testing practices.",
    icon: FlaskConical,
    accentClassName: "text-amber-300",
    initiallyVisible: 2,
    items: withCore(["Jest", "React Testing Library", "Playwright", "TDD"]),
  },
  {
    index: "04",
    title: "Cloud & DevOps",
    description:
      "Supporting cloud-native development, containerisation and automated build and deployment workflows.",
    icon: CloudCog,
    accentClassName: "text-sky-300",
    initiallyVisible: 2,
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
    initiallyVisible: 2,
    items: withCore(["PostgreSQL", "MongoDB", "MySQL", "SQLite", "Supabase", "Prisma ORM"]),
  },
  {
    index: "06",
    title: "Development Tools",
    description: "Day-to-day tooling for building, debugging and shipping software as part of a team.",
    icon: Terminal,
    accentClassName: "text-orange-300",
    initiallyVisible: 2,
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
    title: "Security & Authentication",
    description: "Protecting applications and data with modern authentication and web security practices.",
    icon: ShieldCheck,
    accentClassName: "text-red-300",
    initiallyVisible: 2,
    items: withCore(["JWT", "OAuth 2.0", "CORS", "Helmet", "bcrypt", "HTTPS / TLS", "OWASP"]),
  },
  {
    index: "08",
    title: "UI/UX & Design",
    description:
      "Combining frontend engineering with UX/UI design and accessibility to create usable, inclusive digital experiences.",
    icon: PenTool,
    accentClassName: "text-pink-300",
    initiallyVisible: 2,
    items: withCore(["Figma", "Adobe XD", "Responsive Design", "UI/UX Design", "Accessibility"]),
  },
  {
    index: "09",
    title: "CSS & Styling",
    description: "Styling systems and component libraries for consistent, maintainable design at scale.",
    icon: Palette,
    accentClassName: "text-teal-300",
    initiallyVisible: 1,
    items: withCore(["Tailwind CSS", "CSS", "MUI", "Sass", "Less", "PostCSS", "Bootstrap"]),
  },
  {
    index: "10",
    title: "AI Solutions",
    description: "Designing and shipping generative AI products, from fast prototypes to production-ready applications.",
    icon: Sparkles,
    accentClassName: "text-fuchsia-300",
    initiallyVisible: 3,
    items: withCore([
      "Fast AI Solutions",
      "Generative AI Applications",
      "AI Chatbots & Virtual Assistants",
      "AI-Powered Search",
      "Document AI & Data Extraction",
      "Production-Ready AI Applications",
    ]),
  },
  {
    index: "11",
    title: "LLMs & Agentic AI",
    description: "Building with large language models, agents and tool use to automate multi-step tasks.",
    icon: Bot,
    accentClassName: "text-indigo-300",
    initiallyVisible: 3,
    items: withCore([
      "Large Language Models (LLMs)",
      "AI Agents & Agentic Workflows",
      "Prompt Engineering",
      "Tool / Function Calling",
      "Structured AI Outputs",
      "Streaming AI Responses",
    ]),
  },
  {
    index: "12",
    title: "RAG, Search & Machine Learning",
    description: "Grounding AI in real data with retrieval, semantic search and machine learning.",
    icon: ScanSearch,
    accentClassName: "text-cyan-300",
    initiallyVisible: 3,
    items: withCore([
      "Retrieval-Augmented Generation (RAG)",
      "Vector Databases",
      "Embeddings & Semantic Search",
      "Natural Language Processing (NLP)",
      "Machine Learning Integration",
    ]),
  },
  {
    index: "13",
    title: "AI APIs & Integrations",
    description: "Connecting applications to leading model providers through secure, reliable API integrations.",
    icon: PlugZap,
    accentClassName: "text-lime-300",
    initiallyVisible: 3,
    items: withCore([
      "OpenAI API Integration",
      "Anthropic / Claude API Integration",
      "Gemini API Integration",
      "Model Context Protocol (MCP)",
      "AI API Development",
      "REST API Integration",
      "Secure AI API Integration",
    ]),
  },
  {
    index: "14",
    title: "AI Backend Development",
    description: "Python and API backends that serve AI features and connect them to application data.",
    icon: Cpu,
    accentClassName: "text-purple-300",
    initiallyVisible: 3,
    items: withCore([
      "AI Development Environments",
      "FastAPI Development",
      "Python AI Development",
      "AI Backend Architecture",
      "Database Integration",
      "PostgreSQL / SQL Integration",
    ]),
  },
  {
    index: "15",
    title: "AI Automation, Cloud & Operations",
    description: "Automating workflows and deploying, testing and monitoring AI applications in the cloud.",
    icon: Workflow,
    accentClassName: "text-rose-300",
    initiallyVisible: 3,
    items: withCore([
      "AI Automation",
      "Workflow Automation",
      "Cloud AI Deployment",
      "Docker & Containerization",
      "AWS AI Solutions",
      "CI/CD for AI Applications",
      "AI Testing & Evaluation",
      "LLM Observability",
      "Performance Optimization",
    ]),
  },
];
