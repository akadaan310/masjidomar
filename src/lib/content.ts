import "server-only";
import { createClient } from "@/lib/supabase/server";

// All reads use the visitor's session, so RLS decides what is visible (published, public,
// sample rows only while the site is in concept mode).

export async function getAnnouncements(opts: { limit?: number; q?: string } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("announcements")
    .select("id, slug, title, title_ar, body_md, body_ar_md, urgency, audience, publish_at, expires_at, is_sample, status, show_on_display")
    .eq("status", "published")
    .lte("publish_at", new Date().toISOString())
    .order("urgency", { ascending: false })
    .order("publish_at", { ascending: false })
    .limit(opts.limit ?? 30);
  if (opts.q) {
    const term = opts.q.replace(/[%_,()]/g, " ").trim().slice(0, 60);
    if (term) query = query.or(`title.ilike.%${term}%,body_md.ilike.%${term}%`);
  }
  const { data } = await query;
  return (data ?? []).filter((a) => !a.expires_at || new Date(a.expires_at) > new Date());
}

export async function getUpcomingEvents(limit = 6) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, slug, title, title_ar, description_md, starts_at, ends_at, location, capacity, rsvp_enabled, waitlist_enabled, status, is_sample, program_id")
    .in("status", ["published", "cancelled"])
    .gte("ends_at", new Date().toISOString())
    .order("starts_at")
    .limit(limit);
  return data ?? [];
}

export async function getPrograms(opts: { q?: string; category?: string } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("programs")
    .select("id, slug, title, title_ar, summary, description_md, category, schedule_note, audience_note, is_sample")
    .eq("status", "published")
    .order("title");
  if (opts.category) query = query.eq("category", opts.category);
  if (opts.q) {
    const term = opts.q.replace(/[%_,()]/g, " ").trim().slice(0, 60);
    if (term) query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%`);
  }
  const { data } = await query;
  return data ?? [];
}

export async function getVolunteerOpportunities() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("volunteer_opportunities")
    .select("id, title, title_ar, description_md, commitment, is_sample")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPublicFaq() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_faq")
    .select("id, question, answer_md, category, language, is_sample, approved_at")
    .eq("status", "published")
    .order("sort_order")
    .order("created_at");
  return data ?? [];
}

export async function getRsvpTotals(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, { confirmed: number; waitlisted: number }>();
  const supabase = await createClient();
  const { data } = await supabase.rpc("event_rsvp_totals", { p_event_ids: eventIds });
  return new Map((data ?? []).map((r) => [r.event_id, { confirmed: r.confirmed, waitlisted: r.waitlisted }]));
}

export async function getHeroMedia() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("media_assets")
    .select("id, storage_path, alt_text, alt_text_ar, credit, source, ai_generated, publish_approved")
    .order("created_at");
  return data ?? [];
}

export function formatEventWhen(startsAt: string, endsAt: string, lang: "en" | "ar" = "en") {
  const locale = lang === "ar" ? "ar-EG" : "en-US";
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  const day = new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" }).format(s);
  const t = (d: Date) => new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(d);
  return `${day} · ${t(s)} – ${t(e)} ET`;
}
