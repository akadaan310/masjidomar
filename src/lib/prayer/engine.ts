// Prayer-time engine (pure, no I/O — fully unit tested).
//
// * Adhan times are CALCULATED with the maintained `adhan` library for the masjid's coordinates
//   using the method/madhab/adjustments of the active publication.
// * Iqamah times come only from admin-entered rules. "offset" rules are explicit admin choices,
//   labelled in the UI as "N min after adhan"; nothing is ever derived silently.
// * All wall-clock math is done in America/New_York, so DST transitions are handled by tz data.
import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from "adhan";
import { addDays, format as formatDate } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { TIME_ZONE } from "@/lib/env";

export const DAILY_PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerName = (typeof DAILY_PRAYERS)[number];
export type AdhanKey = PrayerName | "sunrise";

export const PRAYER_LABELS: Record<AdhanKey, { en: string; ar: string }> = {
  fajr: { en: "Fajr", ar: "الفجر" },
  sunrise: { en: "Sunrise", ar: "الشروق" },
  dhuhr: { en: "Dhuhr", ar: "الظهر" },
  asr: { en: "Asr", ar: "العصر" },
  maghrib: { en: "Maghrib", ar: "المغرب" },
  isha: { en: "Isha", ar: "العشاء" },
};

export const METHOD_CODES = [
  "NorthAmerica",
  "MuslimWorldLeague",
  "Egyptian",
  "Karachi",
  "UmmAlQura",
  "MoonsightingCommittee",
] as const;
export type MethodCode = (typeof METHOD_CODES)[number];

export type Adjustments = Partial<Record<AdhanKey, number>>;

export type CalcConfig = {
  latitude: number;
  longitude: number;
  method: string;
  madhab: "shafi" | "hanafi";
  adjustments?: Adjustments;
};

export type IqamahRule = {
  prayer: PrayerName;
  weekday: number | null; // 0 = Sunday … 6 = Saturday; null = every day
  mode: "fixed" | "offset";
  time_of_day: string | null; // "HH:MM" or "HH:MM:SS"
  offset_minutes: number | null;
};

export type IqamahOverride = {
  on_date: string; // YYYY-MM-DD (masjid local date)
  prayer: PrayerName;
  iqamah_time: string | null;
  kind: string;
  note: string;
};

export type JumuahSession = {
  label: string;
  khutbah_time: string;
  iqamah_time: string;
  language: string;
  note: string;
  sort_order: number;
};

export type Publication = {
  id: string;
  version: number;
  title: string;
  calculation_method: string;
  madhab: "shafi" | "hanafi";
  adjustments: Adjustments;
  effective_from: string;
  notice: string;
  is_sample: boolean;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  verified_at: string | null;
};

export type IqamahResult =
  | { status: "set"; at: Date; source: "override" | "weekday" | "daily"; rule: "fixed" | "offset"; offsetMinutes?: number; note?: string }
  | { status: "awaiting" };

export type DayRow = {
  key: AdhanKey;
  adhan: Date;
  iqamah: IqamahResult | null; // null for sunrise (no congregation)
  warning?: string;
};

/** Local calendar date (YYYY-MM-DD) in the masjid's time zone for an instant. */
export function localDateKey(instant: Date, tz: string = TIME_ZONE): string {
  return formatInTimeZone(instant, tz, "yyyy-MM-dd");
}

/** Weekday (0=Sun) of a local date key, independent of server time zone. */
export function weekdayOf(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDaysToKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return formatDate(addDays(new Date(y, m - 1, d), days), "yyyy-MM-dd");
}

/** Convert a masjid-local wall time on a local date to an absolute instant (DST-aware). */
export function zonedWallTime(dateKey: string, hhmm: string, tz: string = TIME_ZONE): Date {
  const t = hhmm.length === 5 ? `${hhmm}:00` : hhmm;
  return fromZonedTime(`${dateKey}T${t}`, tz);
}

function methodParams(code: string) {
  const factory = (CalculationMethod as Record<string, () => ReturnType<typeof CalculationMethod.NorthAmerica>>)[code];
  if (!factory) throw new Error(`Unknown calculation method: ${code}`);
  return factory();
}

/** Calculated adhan times for a masjid-local date. */
export function calculateAdhan(dateKey: string, cfg: CalcConfig): Record<AdhanKey, Date> {
  const [y, m, d] = dateKey.split("-").map(Number);
  const params = methodParams(cfg.method);
  params.madhab = cfg.madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  const adj = cfg.adjustments ?? {};
  params.adjustments = {
    fajr: adj.fajr ?? 0,
    sunrise: adj.sunrise ?? 0,
    dhuhr: adj.dhuhr ?? 0,
    asr: adj.asr ?? 0,
    maghrib: adj.maghrib ?? 0,
    isha: adj.isha ?? 0,
  };
  // adhan reads the local y/m/d components of the Date; building it from components keeps the
  // calendar day correct regardless of the server's own time zone.
  const pt = new PrayerTimes(new Coordinates(cfg.latitude, cfg.longitude), new Date(y, m - 1, d), params);
  return { fajr: pt.fajr, sunrise: pt.sunrise, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha };
}

/** Resolve the iqamah for one prayer on one date. Order: date override → weekday rule → daily rule. */
export function resolveIqamah(
  dateKey: string,
  prayer: PrayerName,
  adhan: Date,
  rules: IqamahRule[],
  overrides: IqamahOverride[],
): IqamahResult {
  const ov = overrides.find((o) => o.on_date === dateKey && o.prayer === prayer && o.iqamah_time);
  if (ov && ov.iqamah_time) {
    return { status: "set", at: zonedWallTime(dateKey, ov.iqamah_time), source: "override", rule: "fixed", note: ov.note || undefined };
  }
  const wd = weekdayOf(dateKey);
  const rule =
    rules.find((r) => r.prayer === prayer && r.weekday === wd) ?? rules.find((r) => r.prayer === prayer && r.weekday === null);
  if (!rule) return { status: "awaiting" };
  if (rule.mode === "fixed" && rule.time_of_day) {
    return { status: "set", at: zonedWallTime(dateKey, rule.time_of_day), source: rule.weekday === null ? "daily" : "weekday", rule: "fixed" };
  }
  if (rule.mode === "offset" && rule.offset_minutes != null) {
    return {
      status: "set",
      at: new Date(adhan.getTime() + rule.offset_minutes * 60_000),
      source: rule.weekday === null ? "daily" : "weekday",
      rule: "offset",
      offsetMinutes: rule.offset_minutes,
    };
  }
  return { status: "awaiting" };
}

export function buildDay(
  dateKey: string,
  cfg: CalcConfig,
  rules: IqamahRule[] | null,
  overrides: IqamahOverride[] = [],
): DayRow[] {
  const adhan = calculateAdhan(dateKey, cfg);
  const order: AdhanKey[] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
  return order.map((key) => {
    if (key === "sunrise") return { key, adhan: adhan.sunrise, iqamah: null };
    const iqamah = rules ? resolveIqamah(dateKey, key, adhan[key], rules, overrides) : { status: "awaiting" as const };
    let warning: string | undefined;
    if (iqamah.status === "set") {
      if (iqamah.at.getTime() < adhan[key].getTime()) warning = "Iqamah is earlier than the calculated adhan.";
      if (key === "fajr" && iqamah.at.getTime() >= adhan.sunrise.getTime()) warning = "Fajr iqamah is at or after sunrise.";
      if (key === "maghrib" && iqamah.at.getTime() > adhan.isha.getTime()) warning = "Maghrib iqamah is after Isha adhan.";
    }
    return { key, adhan: adhan[key], iqamah, warning };
  });
}

export type NextPrayer = { key: PrayerName; adhan: Date; iqamah: IqamahResult | null; dateKey: string };

/** Next daily prayer (by adhan) strictly after `now`, rolling into tomorrow's Fajr. */
export function nextPrayer(
  now: Date,
  cfg: CalcConfig,
  rules: IqamahRule[] | null,
  overrides: IqamahOverride[] = [],
): NextPrayer {
  const today = localDateKey(now);
  for (const dateKey of [today, addDaysToKey(today, 1)]) {
    const rows = buildDay(dateKey, cfg, rules, overrides);
    for (const row of rows) {
      if (row.key === "sunrise") continue;
      if (row.adhan.getTime() > now.getTime()) {
        return { key: row.key as PrayerName, adhan: row.adhan, iqamah: row.iqamah, dateKey };
      }
    }
  }
  // Unreachable in practice (tomorrow's Fajr is always in the future).
  throw new Error("Could not determine next prayer");
}

/** Pick the publication in force on a date: latest effective_from ≤ date, newest publish wins. */
export function pickEffectivePublication<T extends Pick<Publication, "effective_from" | "published_at" | "status" | "version">>(
  pubs: T[],
  dateKey: string,
): T | null {
  const eligible = pubs
    .filter((p) => p.status === "published" && p.effective_from <= dateKey)
    .sort((a, b) =>
      a.effective_from !== b.effective_from
        ? b.effective_from.localeCompare(a.effective_from)
        : b.version - a.version,
    );
  return eligible[0] ?? null;
}

export function formatTime(instant: Date, lang: "en" | "ar" = "en"): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(instant);
}

export function formatWallTime(hhmm: string, lang: "en" | "ar" = "en"): string {
  return formatTime(zonedWallTime("2026-01-15", hhmm), lang);
}

export function formatLongDate(instant: Date, lang: "en" | "ar" = "en"): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(instant);
}

/** Approximate Hijri date (Umm al-Qura tabular calendar). Local moon sighting may differ by a day. */
export function hijriDate(instant: Date, lang: "en" | "ar" = "en"): string {
  try {
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-ca-islamic-umalqura" : "en-US-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: TIME_ZONE,
    }).format(instant);
  } catch {
    return "";
  }
}

export function tzAbbreviation(instant: Date): string {
  return formatInTimeZone(instant, TIME_ZONE, "zzz");
}

export { toZonedTime };
