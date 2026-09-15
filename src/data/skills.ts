import { Code2, ServerCog, CloudCog, FlaskConical, PenTool, type LucideIcon } from "lucide-react";

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

const CORE_STACK = new Set(["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS"]);

function withCore(names: string[]): SkillItem[] {
  return names.map((name) => ({ name, core: CORE_STACK.has(name) }));
}

export const skillCategories: SkillCategory[] = [
  {
    index: "01",
    title: "Frontend",
    description:
      "Building accessible, responsive and high-performance interfaces across web applications.",
    icon: Code2,
    accentClassName: "text-blue-300",
    items: withCore(["React", "Next.js", "TypeScript", "JavaScript", "HTML5", "CSS3", "Tailwind CSS"]),
  },
  {
    index: "02",
    title: "Backend & APIs",
    description: "Developing backend services and API integrations for modern applications.",
    icon: ServerCog,
    accentClassName: "text-violet-300",
    items: withCore(["Node.js", "Express", "Python", "REST APIs", "GraphQL"]),
  },
  {
    index: "03",
    title: "Cloud & DevOps",
    description:
      "Supporting cloud-native development, containerisation and automated build and deployment workflows.",
    icon: CloudCog,
    accentClassName: "text-sky-300",
    items: withCore(["AWS", "Docker", "Kubernetes", "GitHub Actions", "Jenkins"]),
  },
  {
    index: "04",
    title: "Testing & Quality",
    description: "Building reliable software through automated testing practices.",
    icon: FlaskConical,
    accentClassName: "text-amber-300",
    items: withCore(["Jest", "React Testing Library", "Playwright"]),
  },
  {
    index: "05",
    title: "UI/UX, Design & Accessibility",
    description:
      "Combining frontend engineering with UX/UI design and accessibility to create usable, inclusive digital experiences.",
    icon: PenTool,
    accentClassName: "text-pink-300",
    items: withCore(["Figma", "Adobe XD", "WCAG 2.2 AA", "Responsive Design"]),
  },
];
