import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";
import { caseStudies } from "@/data/caseStudies";
import { locales } from "@/i18n/config";

const siteUrl = "https://www.dominicwokorach.me";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) => {
    const prefix = `${siteUrl}/${locale.toLowerCase()}`;
    return [
      { url: prefix, changeFrequency: "monthly" as const, priority: locale === "en-GB" ? 1 : 0.9 },
      ...projects.map((p) => ({
        url: `${prefix}/projects/${p.slug}`,
        changeFrequency: "yearly" as const,
        priority: 0.6,
      })),
      ...caseStudies.map((c) => ({
        url: `${prefix}/projects/${c.slug}`,
        changeFrequency: "yearly" as const,
        priority: 0.7,
      })),
    ];
  });
}
