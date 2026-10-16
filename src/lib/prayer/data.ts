import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  addDaysToKey,
  buildDay,
  localDateKey,
  nextPrayer,
  pickEffectivePublication,
  type CalcConfig,
  type DayRow,
  type IqamahOverride,
  type IqamahRule,
  type JumuahSession,
  type NextPrayer,
  type Publication,
} from "@/lib/prayer/engine";

export type SiteGeo = { latitude: number; longitude: number };

export type PrayerBoard = {
  dateKey: string;
  now: Date;
  publication: Publication | null;
  /** Calculated with the publication's config, or the default ISNA/Shafi estimate when none. */
  calc: CalcConfig;
  rows: DayRow[];
  tomorrow: DayRow[];
  next: NextPrayer | null;
  jumuah: JumuahSession[];
  overridesToday: IqamahOverride[];
  upcomingOverrides: IqamahOverride[];
  state: "published" | "sample" | "awaiting";
};

const DEFAULT_CALC = { method: "NorthAmerica", madhab: "shafi" as const, adjustments: {} };

/** Public prayer board, read under the visitor's RLS (anon sees only published rows). */
export async function getPrayerBoard(now = new Date()): Promise<PrayerBoard> {
  const supabase = await createClient();
  const dateKey = localDateKey(now);

  const [{ data: settings }, { data: pubs }] = await Promise.all([
    supabase.from("site_settings").select("latitude, longitude, concept_mode").maybeSingle(),
    supabase
      .from("prayer_publications")
      .select("id, version, title, calculation_method, madhab, adjustments, effective_from, notice, is_sample, status, published_at, verified_at")
      .eq("status", "published")
      .lte("effective_from", addDaysToKey(dateKey, 1))
      .order("effective_from", { ascending: false })
      .limit(10),
  ]);

  const geo: SiteGeo = { latitude: settings?.latitude ?? 28.0337, longitude: settings?.longitude ?? -82.4012 };
  const publication = pickEffectivePublication((pubs ?? []) as unknown as Publication[], dateKey);
  return buildBoard(now, geo, publication, supabase, settings?.concept_mode ?? true);
}

/** Build a board for an explicit publication (used by admin preview of a draft). */
export async function getBoardForPublication(publicationId: string, now = new Date()): Promise<PrayerBoard> {
  const supabase = await createClient();
  const [{ data: settings }, { data: pub }] = await Promise.all([
    supabase.from("site_settings").select("latitude, longitude, concept_mode").maybeSingle(),
    supabase
      .from("prayer_publications")
      .select("id, version, title, calculation_method, madhab, adjustments, effective_from, notice, is_sample, status, published_at, verified_at")
      .eq("id", publicationId)
      .maybeSingle(),
  ]);
  const geo: SiteGeo = { latitude: settings?.latitude ?? 28.0337, longitude: settings?.longitude ?? -82.4012 };
  return buildBoard(now, geo, (pub as unknown as Publication) ?? null, supabase, settings?.concept_mode ?? true);
}

async function buildBoard(
  now: Date,
  geo: SiteGeo,
  publication: Publication | null,
  supabase: Awaited<ReturnType<typeof createClient>>,
  conceptMode: boolean,
): Promise<PrayerBoard> {
  const dateKey = localDateKey(now);
  let rules: IqamahRule[] | null = null;
  let overrides: IqamahOverride[] = [];
  let jumuah: JumuahSession[] = [];

  if (publication) {
    const [r, o, j] = await Promise.all([
      supabase.from("iqamah_schedules").select("prayer, weekday, mode, time_of_day, offset_minutes").eq("publication_id", publication.id),
      supabase
        .from("prayer_overrides")
        .select("on_date, prayer, iqamah_time, kind, note")
        .eq("publication_id", publication.id)
        .gte("on_date", dateKey)
        .order("on_date")
        .limit(60),
      supabase
        .from("jumuah_sessions")
        .select("label, khutbah_time, iqamah_time, language, note, sort_order")
        .eq("publication_id", publication.id)
        .order("sort_order"),
    ]);
    rules = (r.data ?? []) as IqamahRule[];
    overrides = (o.data ?? []) as IqamahOverride[];
    jumuah = (j.data ?? []) as JumuahSession[];
  }

  const calc: CalcConfig = {
    ...geo,
    method: publication?.calculation_method ?? DEFAULT_CALC.method,
    madhab: publication?.madhab ?? DEFAULT_CALC.madhab,
    adjustments: publication?.adjustments ?? DEFAULT_CALC.adjustments,
  };

  const rows = buildDay(dateKey, calc, rules, overrides);
  const tomorrow = buildDay(addDaysToKey(dateKey, 1), calc, rules, overrides);
  // While the site is a private concept preview, every schedule is presented as a demo — even one
  // published by a (demo) administrator — so no believable "official" timetable is ever shown.
  const state: PrayerBoard["state"] = !publication ? "awaiting" : publication.is_sample || conceptMode ? "sample" : "published";
  return {
    dateKey,
    now,
    publication,
    calc,
    rows,
    tomorrow,
    next: publication ? nextPrayer(now, calc, rules, overrides) : null,
    jumuah,
    overridesToday: overrides.filter((o) => o.on_date === dateKey),
    upcomingOverrides: overrides.filter((o) => o.on_date > dateKey).slice(0, 10),
    state,
  };
}

/** JSON-safe snapshot for client components (display, live clock). */
export function serializeBoard(b: PrayerBoard) {
  const ser = (rows: DayRow[]) =>
    rows.map((r) => ({
      key: r.key,
      adhan: r.adhan.toISOString(),
      iqamah:
        r.iqamah === null
          ? null
          : r.iqamah.status === "awaiting"
            ? { status: "awaiting" as const }
            : {
                status: "set" as const,
                at: r.iqamah.at.toISOString(),
                rule: r.iqamah.rule,
                offsetMinutes: r.iqamah.offsetMinutes ?? null,
                source: r.iqamah.source,
                note: r.iqamah.note ?? null,
              },
    }));
  return {
    dateKey: b.dateKey,
    generatedAt: b.now.toISOString(),
    state: b.state,
    publication: b.publication
      ? {
          version: b.publication.version,
          title: b.publication.title,
          method: b.publication.calculation_method,
          madhab: b.publication.madhab,
          notice: b.publication.notice,
          verifiedAt: b.publication.verified_at,
          publishedAt: b.publication.published_at,
          effectiveFrom: b.publication.effective_from,
        }
      : null,
    method: b.calc.method,
    madhab: b.calc.madhab,
    rows: ser(b.rows),
    tomorrow: ser(b.tomorrow),
    jumuah: b.jumuah,
  };
}
export type SerializedBoard = ReturnType<typeof serializeBoard>;
