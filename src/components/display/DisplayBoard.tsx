"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize, WifiOff } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";
import type { DisplayPayload } from "@/lib/display";

const TZ = "America/New_York";
const LABELS: Record<string, { en: string; ar: string }> = {
  fajr: { en: "Fajr", ar: "الفجر" },
  sunrise: { en: "Sunrise", ar: "الشروق" },
  dhuhr: { en: "Dhuhr", ar: "الظهر" },
  asr: { en: "Asr", ar: "العصر" },
  maghrib: { en: "Maghrib", ar: "المغرب" },
  isha: { en: "Isha", ar: "العشاء" },
};
const STALE_MS = 15 * 60_000;
const POLL_MS = 60_000;

function t(d: Date | string, seconds = false) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", ...(seconds ? { second: "2-digit" } : {}), timeZone: TZ }).format(new Date(d));
}
function hm(s: string) {
  const [h, m] = s.split(":").map(Number);
  const d = new Date(Date.UTC(2026, 0, 15, h, m));
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(d);
}
function localKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function DisplayBoard({ initial, previewId }: { initial: DisplayPayload; previewId: string | null }) {
  const [data, setData] = useState(initial);
  const [now, setNow] = useState(() => new Date(initial.syncedAt));
  const [lastOk, setLastOk] = useState(() => Date.now());
  const [online, setOnline] = useState(true);
  const [slide, setSlide] = useState(0);
  const [stale, setStale] = useState(false);
  const fetching = useRef(false);
  const lastOkRef = useRef(lastOk);
  const dateKeyRef = useRef(initial.board.dateKey);
  const lastAttemptRef = useRef(0);

  const refresh = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    lastAttemptRef.current = Date.now();
    try {
      const res = await fetch(`/api/display${previewId ? `?preview=${previewId}` : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as DisplayPayload;
      setData(json);
      dateKeyRef.current = json.board.dateKey;
      lastOkRef.current = Date.now();
      setLastOk(lastOkRef.current);
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      fetching.current = false;
    }
  }, [previewId]);

  // Clock tick; also detects stale data and the local day rollover (refetch → tomorrow's schedule).
  useEffect(() => {
    const id = setInterval(() => {
      const current = new Date();
      setNow(current);
      setStale(Date.now() - lastOkRef.current > STALE_MS);
      if (localKey(current) !== dateKeyRef.current && Date.now() - lastAttemptRef.current > 30_000) refresh();
    }, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  // Realtime + polling fallback
  useEffect(() => {
    const poll = setInterval(refresh, POLL_MS);
    let cleanup = () => {};
    try {
      const supabase = createClient();
      const channel = supabase
        .channel("masjid-display")
        .on("postgres_changes", { event: "*", schema: "public", table: "prayer_publications" }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "display_presets" }, refresh)
        .subscribe();
      cleanup = () => supabase.removeChannel(channel);
    } catch {
      /* polling only */
    }
    return () => {
      clearInterval(poll);
      cleanup();
    };
  }, [refresh]);

  const rows = data.board.rows;
  const next = useMemo(() => {
    const all = [...rows.map((r) => ({ ...r, day: "today" })), ...data.board.tomorrow.map((r) => ({ ...r, day: "tomorrow" }))];
    return all.find((r) => r.key !== "sunrise" && new Date(r.adhan).getTime() > now.getTime()) ?? null;
  }, [rows, data.board.tomorrow, now]);

  // Quiet during congregational prayer: from an iqamah until 15 minutes after it.
  const inPrayer = rows.some((r) => r.iqamah?.status === "set" && now.getTime() >= new Date(r.iqamah.at).getTime() && now.getTime() < new Date(r.iqamah.at).getTime() + 15 * 60_000);
  const quiet = data.preset.quiet_mode || inPrayer;
  const panels = (data.preset.panels as string[]) ?? [];
  const lang = data.preset.language_mode as "en" | "ar" | "bilingual";

  useEffect(() => {
    if (quiet || data.announcements.length < 2) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % data.announcements.length), 12_000);
    return () => clearInterval(id);
  }, [quiet, data.announcements.length]);

  const theme =
    data.preset.theme === "navy"
      ? "bg-navy-900 text-ivory"
      : data.preset.theme === "ivory"
        ? "bg-ivory text-pine"
        : "bg-pine text-ivory";
  const dim = data.preset.theme === "ivory" ? "text-muted" : "text-sage";
  const cardBg = data.preset.theme === "ivory" ? "bg-chalk shadow-lg" : "bg-ivory/[0.06]";
  const name = (k: string, highlighted = false) =>
    lang === "ar" ? <span lang="ar">{LABELS[k].ar}</span> : lang === "en" ? LABELS[k].en : (
      <>
        {LABELS[k].en} <span lang="ar" className={`${highlighted ? "text-pine/80" : dim} ms-[0.6vw]`}>{LABELS[k].ar}</span>
      </>
    );
  const minsToNext = next ? Math.max(0, Math.round((new Date(next.adhan).getTime() - now.getTime()) / 60000)) : null;
  const announcement = data.announcements[slide % Math.max(1, data.announcements.length)];

  const goFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  return (
    <div className={`relative flex h-dvh min-h-[480px] w-full flex-col overflow-hidden ${theme} ${data.preset.theme !== "ivory" ? "pattern-lattice" : ""}`} style={{ fontSize: "clamp(11px, min(1.1vw, 1.75vh), 64px)" }}>
      {(data.board.state !== "published" || data.preview) && (
        <div className="bg-brass px-[2vw] py-[0.5vw] text-center text-[1.1em] font-bold text-pine" role="status">
          {data.preview
            ? "PREVIEW of an unpublished draft — not shown to the public"
            : data.board.state === "sample"
              ? "Demo schedule — not current prayer times"
              : "Iqamah schedule awaiting confirmation · adhan times are calculated estimates"}
        </div>
      )}

      <header className="flex items-center gap-[1.5vw] px-[3vw] pt-[1.6vw]">
        <LogoMark tone={data.preset.theme === "ivory" ? "color" : "reverse"} className="h-[5.5vw] w-auto" />
        <div>
          <p className="font-display text-[2.6em] leading-none">{data.org.en}</p>
          <p lang="ar" className={`text-[2em] leading-tight ${dim}`}>{data.org.ar}</p>
        </div>
        <div className="ms-auto text-end">
          <p className="tabular font-display text-[4.4em] leading-none" suppressHydrationWarning>
            {t(now, data.preset.show_seconds)}
          </p>
          <p className={`text-[1.2em] ${dim}`} suppressHydrationWarning>
            {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: TZ }).format(now)} ·{" "}
            {new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(now)} (approx.)
          </p>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_0.42fr] gap-[1.6vw] px-[3vw] py-[1.4vw]">
        {panels.includes("prayers") && (
          <section aria-label="Today's prayer times" className="grid min-h-0 grid-cols-3 grid-rows-2 gap-[1.2vw]">
            {rows.map((r) => {
              const isNext = next?.day === "today" && next.key === r.key;
              return (
                <div key={r.key} className={`flex flex-col justify-between rounded-[1.4vw] p-[1.4vw] ${isNext ? "bg-brass text-pine" : cardBg}`}>
                  <p className="text-[1.8em] font-bold leading-tight">{name(r.key, isNext)}</p>
                  <div>
                    <p className={`text-[0.95em] uppercase tracking-widest ${isNext ? "" : dim}`}>{r.key === "sunrise" ? "Sunrise" : "Adhan"}</p>
                    <p className="tabular text-[2.2em] leading-none">{t(r.adhan)}</p>
                  </div>
                  {r.key !== "sunrise" && (
                    <div>
                      <p className={`text-[0.95em] uppercase tracking-widest ${isNext ? "" : dim}`}>Iqamah</p>
                      <p className="tabular text-[2.8em] font-bold leading-none">{r.iqamah?.status === "set" ? t(r.iqamah.at) : "—"}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        <aside className="flex min-h-0 flex-col gap-[1.2vw] overflow-hidden">
          {panels.includes("next") && next && (
            <section className="rounded-[1.4vw] bg-evergreen p-[1.6vw] text-ivory" aria-live="polite">
              <p className="text-[1.1em] uppercase tracking-widest text-sage">{inPrayer ? "Prayer in congregation" : next.day === "tomorrow" ? "Next · tomorrow" : "Next prayer"}</p>
              <p className="font-display text-[3.2em] leading-none">{LABELS[next.key].en}</p>
              <p lang="ar" className="text-[2.2em] text-sage">{LABELS[next.key].ar}</p>
              {minsToNext !== null && !inPrayer && (
                <p className="tabular mt-[0.5vw] text-[1.8em]">
                  in {Math.floor(minsToNext / 60) > 0 && `${Math.floor(minsToNext / 60)} h `}
                  {minsToNext % 60} min
                </p>
              )}
            </section>
          )}
          {panels.includes("jumuah") && (
            <section className={`rounded-[1.4vw] p-[1.4vw] ${cardBg}`}>
              <p className={`text-[1em] uppercase tracking-widest ${dim}`}>Jumu&apos;ah · الجمعة</p>
              {data.board.jumuah.length === 0 ? (
                <p className="text-[1.4em]">Awaiting confirmation</p>
              ) : (
                data.board.jumuah.map((j) => (
                  <p key={j.label + j.sort_order} className="tabular text-[1.5em]">
                    {j.label}: khutbah {hm(j.khutbah_time)} · iqamah <strong>{hm(j.iqamah_time)}</strong>
                  </p>
                ))
              )}
            </section>
          )}
          {panels.includes("program") && data.nextEvent && (
            <section className={`rounded-[1.4vw] p-[1.4vw] ${cardBg}`}>
              <p className={`text-[1em] uppercase tracking-widest ${dim}`}>Coming up</p>
              <p className="text-[1.5em] font-bold">{data.nextEvent.title}</p>
              <p className={`text-[1.2em] ${dim}`}>
                {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date(data.nextEvent.starts_at))}
              </p>
            </section>
          )}
        </aside>
      </div>

      {panels.includes("announcements") && announcement && !inPrayer && (
        <footer className={`flex items-center gap-[1.5vw] px-[3vw] py-[1.2vw] ${data.preset.theme === "ivory" ? "bg-sand" : "bg-black/20"}`}>
          <span className={`badge text-[0.9em] ${announcement.urgency === "urgent" ? "bg-brass text-pine" : "bg-ivory/15"}`}>
            {announcement.urgency === "urgent" ? "Urgent" : "Announcement"}
          </span>
          <p className="truncate text-[1.6em]">
            {lang === "ar" && announcement.title_ar ? announcement.title_ar : announcement.title}
          </p>
          {data.announcements.length > 1 && (
            <span className={`ms-auto text-[1em] ${dim}`}>
              {(slide % data.announcements.length) + 1}/{data.announcements.length}
            </span>
          )}
        </footer>
      )}

      <div className={`flex items-center gap-[1vw] px-[3vw] py-[0.6vw] text-[0.85em] ${dim}`}>
        {stale || !online ? (
          <span className="flex items-center gap-2 font-bold text-brass" role="alert">
            <WifiOff aria-hidden className="size-[1.2em]" /> Connection lost — times last updated {t(new Date(lastOk))}. Please confirm with the masjid.
          </span>
        ) : (
          <span suppressHydrationWarning>Last synced {t(new Date(lastOk), true)} · {quiet ? "quiet mode" : "live"}</span>
        )}
        <button type="button" onClick={goFullscreen} className="ms-auto inline-flex items-center gap-2 rounded-full border border-current/30 px-3 py-1 opacity-70 hover:opacity-100">
          <Maximize aria-hidden className="size-[1.1em]" /> Full screen
        </button>
      </div>
    </div>
  );
}
