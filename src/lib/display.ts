import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getBoardForPublication, getPrayerBoard, serializeBoard } from "@/lib/prayer/data";
import { getSessionUser } from "@/lib/auth";

/** Everything the public masjid screen shows. Contains only published, public data. */
export async function getDisplayPayload(previewId?: string | null) {
  const supabase = await createClient();
  let preview = false;
  let board;
  if (previewId) {
    const user = await getSessionUser();
    if (user?.roles.includes("admin")) {
      board = await getBoardForPublication(previewId);
      preview = true;
    }
  }
  board ??= await getPrayerBoard();

  const nowIso = new Date().toISOString();
  const [{ data: preset }, { data: announcements }, { data: events }, { data: settings }] = await Promise.all([
    supabase.from("display_presets").select("panels, quiet_mode, language_mode, theme, show_seconds, updated_at").maybeSingle(),
    supabase
      .from("announcements")
      .select("id, title, title_ar, urgency, is_sample")
      .eq("status", "published")
      .eq("audience", "public")
      .eq("show_on_display", true)
      .lte("publish_at", nowIso)
      .order("urgency", { ascending: false })
      .order("publish_at", { ascending: false })
      .limit(6),
    supabase.from("events").select("title, title_ar, starts_at, is_sample").eq("status", "published").gte("starts_at", nowIso).order("starts_at").limit(1),
    supabase.from("site_settings").select("org_name_en, org_name_ar, concept_mode").maybeSingle(),
  ]);

  return {
    board: serializeBoard(board),
    preview,
    preset: preset ?? { panels: ["prayers", "next", "jumuah", "announcements", "program"], quiet_mode: false, language_mode: "bilingual", theme: "evergreen", show_seconds: false, updated_at: nowIso },
    announcements: announcements ?? [],
    nextEvent: events?.[0] ?? null,
    org: { en: settings?.org_name_en ?? "Masjid Omar", ar: settings?.org_name_ar ?? "مسجد عمر", conceptMode: settings?.concept_mode ?? true },
    syncedAt: nowIso,
  };
}
export type DisplayPayload = Awaited<ReturnType<typeof getDisplayPayload>>;
