import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { CATEGORIES, tools } from "@/lib/tools";

// Every public page. Built from the registry, so a new tool is listed
// automatically.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...CATEGORIES.map((category) => ({
      url: absoluteUrl(`/${category.id}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...tools.map((tool) => ({
      url: absoluteUrl(`/${tool.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...["/about", "/privacy", "/advertise"].map((path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
