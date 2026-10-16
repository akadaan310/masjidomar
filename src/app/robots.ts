import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/site";
import { publicEnv } from "@/lib/env";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { settings } = await getSiteSettings();
  // Concept previews are never indexed. Private areas are always disallowed.
  if (settings.concept_mode || !settings.allow_indexing) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/imam", "/community", "/questions", "/account", "/display", "/api", "/auth"] }],
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
  };
}
