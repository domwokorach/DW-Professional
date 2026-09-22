export type NavItem = {
  id: string;
  label: string;
  href: string;
  items?: NavItem[];
};

export const navigation: NavItem[] = [
  { id: "home", label: "Home", href: "#home" },
  { id: "about", label: "01 / About", href: "#about" },
  { id: "expertise", label: "02 / Expertise", href: "#expertise" },
  { id: "services", label: "03 / Services", href: "#services" },
  { id: "projects", label: "04 / Projects", href: "#projects" },
  { id: "experience", label: "05 / Experience", href: "#experience" },
  { id: "gallery", label: "06 / Gallery", href: "#gallery" },
  { id: "testimonials", label: "07 / Testimonials", href: "#testimonials" },
  { id: "contact", label: "08 / Contact", href: "#contact" },
];

/** Ids (in display order) of the primary links shown in the header/mobile navigation menu. */
const PRIMARY_NAV_IDS = ["about", "services", "projects", "gallery", "contact"] as const;

/** Label overrides for primary nav links whose menu label differs from the section's own label. */
const PRIMARY_NAV_LABEL_OVERRIDES: Partial<Record<(typeof PRIMARY_NAV_IDS)[number], string>> = {
  contact: "Contact Us",
};

/**
 * The primary nav links shown in the header and mobile navigation menu, in
 * display order, with the numbered prefix stripped from each label (e.g.
 * "03 / Services" -> "Services"). Every other section (Home, Expertise,
 * Experience, Testimonials) keeps its page section — it's just no longer
 * linked from this menu.
 */
export const headerNavigation: NavItem[] = PRIMARY_NAV_IDS.map((id) => {
  const item = navigation.find((entry) => entry.id === id);
  if (!item) throw new Error(`navigation: missing expected section "${id}"`);
  const label = PRIMARY_NAV_LABEL_OVERRIDES[id] ?? item.label.replace(/^\d+\s*\/\s*/, "");
  return { ...item, label };
});

/** Full site navigation minus the logo's "home" link, for surfaces (e.g. the footer) that list every section. */
export const footerNavigation: NavItem[] = navigation.filter((item) => item.id !== "home");

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
  linkedin: "https://www.linkedin.com/in/dominic-w-3673523b/",
  github: "https://github.com/domwokorach",
  portfolio: "https://www.dominicwokorach.me/",
  location: "London, UK",
};
