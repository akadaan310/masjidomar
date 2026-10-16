import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { getSiteSettings } from "@/lib/site";
import { getPrograms, getUpcomingEvents } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { settings } = await getSiteSettings();
  if (settings.concept_mode) return [];
  const base = publicEnv.siteUrl;
  const pages = ["", "/prayer-times", "/visit", "/programs", "/announcements", "/ask", "/faq", "/welcome", "/volunteer", "/support", "/about", "/privacy", "/terms", "/accessibility"];
  const [programs, events] = await Promise.all([getPrograms(), getUpcomingEvents(50)]);
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: (p === "/prayer-times" ? "daily" : "weekly") as "daily" | "weekly" })),
    ...programs.map((p) => ({ url: `${base}/programs/${p.slug}` })),
    ...events.map((e) => ({ url: `${base}/programs/events/${e.slug}` })),
  ];
}
