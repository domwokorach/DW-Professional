import type { ReactNode } from "react";
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiJavascript,
  SiHtml5,
  SiCss,
  SiPostcss,
  SiNodedotjs,
  SiDjango,
  SiJsonwebtokens,
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
  SiAnthropic,
  SiOwasp,
  SiFigma,
  SiMui,
  SiTailwindcss,
  SiSass,
  SiLess,
  SiBootstrap,
} from "react-icons/si";
import { FaAws } from "react-icons/fa6";
import { TbBrandAdobeXd } from "react-icons/tb";
import {
  Smartphone,
  Network,
  Drama,
  TestTube,
  Laptop,
  Sparkles,
  Brain,
  KeyRound,
  Globe,
  ShieldCheck,
  Lock,
  LockKeyhole,
  MonitorSmartphone,
  PenTool,
  Accessibility,
} from "lucide-react";

import type { LogoItem } from "@/components/ui/logo-timeline";
import { skillCategories } from "@/data/skills";

// Maps each skill name (as it appears in `skillCategories`) to the icon
// shown for it in the Logo Timeline. Real brand marks where one exists,
// a neutral lucide icon for concepts/practices that have no single logo.
const TECH_ICONS: Record<string, ReactNode> = {
  React: <SiReact />,
  "Next.js": <SiNextdotjs />,
  "React Native": <Smartphone />,
  TypeScript: <SiTypescript />,
  JavaScript: <SiJavascript />,
  HTML5: <SiHtml5 />,
  CSS: <SiCss />,
  PostCSS: <SiPostcss />,

  "Node.js": <SiNodedotjs />,
  "REST API": <Network />,
  Django: <SiDjango />,
  "JWT Authentication": <SiJsonwebtokens />,

  Jest: <SiJest />,
  "React Testing Library": <SiTestinglibrary />,
  Playwright: <Drama />,
  TDD: <TestTube />,

  AWS: <FaAws />,
  "Google Cloud Platform": <SiGooglecloud />,
  Cloudflare: <SiCloudflare />,
  Docker: <SiDocker />,
  Kubernetes: <SiKubernetes />,
  Jenkins: <SiJenkins />,
  "GitHub Actions": <SiGithubactions />,

  PostgreSQL: <SiPostgresql />,
  MongoDB: <SiMongodb />,
  MySQL: <SiMysql />,
  SQLite: <SiSqlite />,
  Supabase: <SiSupabase />,
  "Prisma ORM": <SiPrisma />,

  Postman: <SiPostman />,
  "Browser DevTools": <SiGooglechrome />,
  "Local Development Environment": <Laptop />,
  Jira: <SiJira />,
  Confluence: <SiConfluence />,

  "Generative AI": <Sparkles />,
  LLMs: <Brain />,
  "MCP Server": <SiAnthropic />,

  JWT: <SiJsonwebtokens />,
  "OAuth 2.0": <KeyRound />,
  CORS: <Globe />,
  Helmet: <ShieldCheck />,
  bcrypt: <Lock />,
  "HTTPS / TLS": <LockKeyhole />,
  OWASP: <SiOwasp />,

  Figma: <SiFigma />,
  "Adobe XD": <TbBrandAdobeXd />,
  "Responsive Design": <MonitorSmartphone />,
  "UI/UX Design": <PenTool />,
  Accessibility: <Accessibility />,

  MUI: <SiMui />,
  "Tailwind CSS": <SiTailwindcss />,
  Sass: <SiSass />,
  Less: <SiLess />,
  Bootstrap: <SiBootstrap />,
};

const ROW_ITEM_STAGGER_SECONDS = 2.4;
const BASE_ROW_DURATION_SECONDS = 32;
const ROW_DURATION_VARIATION_SECONDS = 6;

/**
 * One row per skill category, each looping independently so the whole
 * stack reads as a slow, layered drift rather than a single lane.
 */
export const techLogoItems: LogoItem[] = skillCategories.flatMap((category, rowIndex) =>
  category.items.map((item, itemIndex) => ({
    label: item.name,
    icon: TECH_ICONS[item.name] ?? <Sparkles />,
    row: rowIndex + 1,
    animationDelay: -(itemIndex * ROW_ITEM_STAGGER_SECONDS),
    animationDuration:
      BASE_ROW_DURATION_SECONDS + (rowIndex % 3) * ROW_DURATION_VARIATION_SECONDS,
  }))
);
