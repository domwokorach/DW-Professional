import {
  Code2,
  ServerCog,
  Database,
  CloudCog,
  FlaskConical,
  ShieldCheck,
  PenTool,
  Palette,
  Wrench,
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
  groups?: { label: string; items: string[] }[];
};

const CORE_STACK = new Set([
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "PostgreSQL",
  "Tailwind CSS",
]);

function withCore(names: string[]): SkillItem[] {
  return names.map((name) => ({ name, core: CORE_STACK.has(name) }));
}

export const skillCategories: SkillCategory[] = [
  {
    index: "01",
    title: "Frontend",
    description:
      "Building accessible, responsive and high-performance interfaces across web and mobile applications.",
    icon: Code2,
    accentClassName: "text-blue-300",
    items: withCore([
      "React",
      "Next.js",
      "React Native",
      "TypeScript",
      "JavaScript",
      "HTML5",
    ]),
  },
  {
    index: "02",
    title: "Backend & APIs",
    description:
      "Developing backend services, APIs, authentication systems and real-time application functionality.",
    icon: ServerCog,
    accentClassName: "text-violet-300",
    items: withCore([
      "Node.js",
      "NestJS",
      "Express.js",
      "Python",
      "FastAPI",
      "Django",
      "GraphQL",
      "REST APIs",
      "Socket.IO",
    ]),
  },
  {
    index: "03",
    title: "Databases & ORM",
    description:
      "Designing and integrating relational and document-based data layers for modern applications.",
    icon: Database,
    accentClassName: "text-emerald-300",
    items: withCore(["PostgreSQL", "MongoDB", "MySQL", "SQLite", "Supabase", "Prisma ORM"]),
    groups: [
      { label: "Relational", items: ["PostgreSQL", "MySQL", "SQLite"] },
      { label: "Document", items: ["MongoDB"] },
      { label: "Backend Platform", items: ["Supabase"] },
      { label: "ORM", items: ["Prisma ORM"] },
    ],
  },
  {
    index: "04",
    title: "Cloud & DevOps",
    description:
      "Supporting cloud-native development, containerisation and automated build, test and deployment workflows.",
    icon: CloudCog,
    accentClassName: "text-sky-300",
    items: withCore(["AWS", "GCP", "Docker", "Kubernetes", "Jenkins", "GitHub Actions", "CI/CD"]),
  },
  {
    index: "05",
    title: "Testing & Quality",
    description:
      "Building reliable software through automated testing and maintainable engineering practices.",
    icon: FlaskConical,
    accentClassName: "text-amber-300",
    items: withCore([
      "Jest",
      "React Testing Library",
      "Playwright",
      "TDD",
      "Unit Testing",
      "Integration Testing",
      "E2E Testing",
    ]),
  },
  {
    index: "06",
    title: "Security & Authentication",
    description:
      "Applying secure authentication, API protection and recognised web security practices.",
    icon: ShieldCheck,
    accentClassName: "text-green-300",
    items: withCore(["JWT", "OAuth 2.0", "CORS", "Helmet", "bcrypt", "HTTPS / TLS", "OWASP"]),
  },
  {
    index: "07",
    title: "UI/UX & Design",
    description:
      "Combining frontend engineering with thoughtful UX/UI design to create usable, accessible and visually polished digital experiences.",
    icon: PenTool,
    accentClassName: "text-pink-300",
    items: withCore([
      "Figma",
      "Adobe XD",
      "UI/UX Design",
      "Responsive Design",
      "Accessibility",
      "Wireframing",
      "Prototyping",
      "Design Systems",
    ]),
  },
  {
    index: "08",
    title: "CSS & Styling",
    description:
      "Creating maintainable styling systems, responsive layouts and polished interactive experiences.",
    icon: Palette,
    accentClassName: "text-indigo-300",
    items: withCore(["CSS3", "Tailwind CSS", "Sass / SCSS", "Less", "PostCSS", "CSS Animations"]),
  },
  {
    index: "09",
    title: "Development Tools",
    description:
      "Day-to-day tooling for building, testing and shipping software efficiently.",
    icon: Wrench,
    accentClassName: "text-neutral-300",
    items: withCore([
      "Git",
      "GitHub",
      "Postman",
      "Browser DevTools",
      "VS Code",
      "Local Development Environments",
      "Debugging",
    ]),
  },
];
