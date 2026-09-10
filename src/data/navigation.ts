export type NavItem = {
  id: string;
  label: string;
  href: string;
  items?: NavItem[];
};

export const navigation: NavItem[] = [
  { id: "home", label: "Home", href: "#home" },
  { id: "about", label: "About", href: "#about" },
  {
    id: "expertise",
    label: "02 / Expertise",
    href: "#expertise",
    items: [
      { id: "frontend", label: "Frontend", href: "#frontend" },
      { id: "backend-api", label: "Backend & APIs", href: "#backend-api" },
      { id: "database-orm", label: "Database & ORM", href: "#database-orm" },
      { id: "cloud-devops", label: "Cloud & DevOps", href: "#cloud-devops" },
      { id: "testing-quality", label: "Testing & Quality", href: "#testing-quality" },
      {
        id: "security-authentication",
        label: "Security & Authentication",
        href: "#security-authentication",
      },
      { id: "ui-ux-design", label: "UI/UX Design", href: "#ui-ux-design" },
      { id: "css-styling", label: "CSS & Styling", href: "#css-styling" },
      { id: "development-tools", label: "Development Tools", href: "#development-tools" },
    ],
  },
  {
    id: "services",
    label: "03 / Services",
    href: "#services",
    items: [
      {
        id: "specialist-accessibility",
        label: "Specialist Accessibility",
        href: "#specialist-accessibility",
      },
      {
        id: "ai-developer-testing",
        label: "AI Developer & Testing Tools",
        href: "#ai-developer-testing",
      },
      {
        id: "frontend-development",
        label: "Frontend Development",
        href: "#frontend-development",
      },
      { id: "ux-ui-development", label: "UX/UI Development", href: "#ux-ui-development" },
      { id: "web-applications", label: "Web Applications", href: "#web-applications" },
      {
        id: "software-engineering",
        label: "Software Engineering",
        href: "#software-engineering",
      },
    ],
  },
  {
    id: "ai-professional",
    label: "AI Developer Professional",
    href: "#ai-professional",
    items: [
      { id: "ai-products", label: "AI Products & Applications", href: "#ai-products" },
      { id: "agentic-workflows", label: "LLMs & Agentic Workflows", href: "#agentic-workflows" },
      { id: "rag-search", label: "RAG & Intelligent Search", href: "#rag-search" },
      { id: "ai-integrations", label: "AI API & Model Integrations", href: "#ai-integrations" },
      {
        id: "ai-backend-python",
        label: "AI Backend & Python Development",
        href: "#ai-backend-python",
      },
      {
        id: "production-readiness",
        label: "Deployment & Production Readiness",
        href: "#production-readiness",
      },
    ],
  },
  {
    id: "projects",
    label: "04 / Projects",
    href: "#projects",
    items: [
      { id: "innovation-x", label: "Innovation X", href: "#innovation-x" },
      {
        id: "specialist-disability",
        label: "Specialist Disability",
        href: "#specialist-disability",
      },
      {
        id: "halifax-piggy-banking",
        label: "Halifax Piggy Banking",
        href: "#halifax-piggy-banking",
      },
      { id: "innovation-community", label: "Innovation Community", href: "#innovation-community" },
      {
        id: "internal-ai-search",
        label: "Internal AI Search Assistant",
        href: "#internal-ai-search",
      },
      {
        id: "ui-delivery-transformation",
        label: "UI Delivery & Transformation",
        href: "#ui-delivery-transformation",
      },
      {
        id: "sky-cloud-native",
        label: "Sky — Cloud-Native Engineering",
        href: "#sky-cloud-native",
      },
    ],
  },
  {
    id: "experience",
    label: "05 / Experience",
    href: "#experience",
    items: [
      {
        id: "trainee-digital-transformation",
        label: "Trainee Digital Transformation",
        href: "#trainee-digital-transformation",
      },
      {
        id: "junior-ui-delivery",
        label: "Junior UI Delivery & Transformation",
        href: "#junior-ui-delivery",
      },
      { id: "senior-web-developer", label: "Senior Web Developer", href: "#senior-web-developer" },
      {
        id: "senior-frontend-developer",
        label: "Senior Frontend Developer",
        href: "#senior-frontend-developer",
      },
      { id: "career-break", label: "Career Break", href: "#career-break" },
      {
        id: "professional-development",
        label: "Professional Development",
        href: "#professional-development",
      },
      {
        id: "freelance-software-developer",
        label: "Freelance Software Developer",
        href: "#freelance-software-developer",
      },
    ],
  },
  { id: "contact", label: "Contact", href: "#contact" },
];

/** Top-level ids to hide from the header/mobile navigation while keeping their sections and data intact. */
const HEADER_HIDDEN_IDS = new Set([
  "home",
  "about",
  "expertise",
  "services",
  "ai-professional",
  "projects",
  "experience",
]);

/** Top-level items shown in the header and mobile navigation. */
export const headerNavigation: NavItem[] = navigation.filter(
  (item) => !HEADER_HIDDEN_IDS.has(item.id)
);

/** Full site navigation minus Experience, for surfaces (e.g. the footer) that list every section. */
export const footerNavigation: NavItem[] = navigation.filter((item) => item.id !== "experience");

/** Every id in the tree, top-level and nested, in document order. */
export function flattenNavIds(items: NavItem[]): string[] {
  return items.flatMap((item) => [item.id, ...(item.items ? flattenNavIds(item.items) : [])]);
}

/** Maps every id (leaf or group) to the id of its top-level ancestor. */
export function buildTopLevelMap(items: NavItem[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const item of items) {
    map.set(item.id, item.id);
    for (const child of item.items ?? []) {
      map.set(child.id, item.id);
    }
  }

  return map;
}

export const social = {
  email: "Dominic.Wokorach-O@outlook.com",
  linkedin: "https://www.linkedin.com/in/dominic-w-3673523b/",
  github: "https://github.com/domwokorach",
  portfolio: "https://www.dominicwokorach.me/",
  location: "London, UK",
};
