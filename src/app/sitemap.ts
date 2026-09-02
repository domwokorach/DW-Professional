import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";
import { caseStudies } from "@/data/caseStudies";

const siteUrl = "https://www.dominicwokorach.me";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    ...projects.map((p) => ({
      url: `${siteUrl}/projects/${p.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...caseStudies.map((c) => ({
      url: `${siteUrl}/projects/${c.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
