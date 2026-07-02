import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const routes = ["", "/login", "/register", "/forgot-password"];

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date("2026-07-01"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.6,
  }));
}
