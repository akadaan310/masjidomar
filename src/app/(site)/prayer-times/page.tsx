import type { Metadata } from "next";
import { CalendarClock, Info } from "lucide-react";
import { getPrayerBoard } from "@/lib/prayer/data";
import { formatLongDate, formatTime, formatWallTime, hijriDate, PRAYER_LABELS, tzAbbreviation, weekdayOf } from "@/lib/prayer/engine";
import { getLang, t } from "@/lib/i18n";
import { PrayerTable } from "@/components/prayer/PrayerTable";
import { PrayerStateBanner } from "@/components/prayer/PrayerStateBanner";
import { LiveClock, Countdown } from "@/components/prayer/LiveClock";
import { PrayerAutoRefresh } from "@/components/prayer/PrayerAutoRefresh";

export const metadata: Metadata = {
  title: "Prayer times",
  description: "Calculated adhan times and masjid-confirmed iqamah times for Masjid Omar, Tampa (America/New_York).",
};

const METHOD_LABEL: Record<string, string> = {
  NorthAmerica: "ISNA (North America)",
  MuslimWorldLeague: "Muslim World League",
  Egyptian: "Egyptian General Authority",
  Karachi: "University of Islamic Sciences, Karachi",
  UmmAlQura: "Umm al-Qura",
  MoonsightingCommittee: "Moonsighting Committee",
};

export default async function PrayerTimesPage() {
  const lang = await getLang();
  const d = t(lang);
  const board = await getPrayerBoard();
  const now = board.now;
  const isFriday = weekdayOf(board.dateKey) === 5;
  const maghrib = board.rows.find((r) => r.key === "maghrib");

  return (
    <div className="container-page py-12 sm:py-16">
      <PrayerAutoRefresh />
      <header className="max-w-3xl">
        <p className="eyebrow">{lang === "ar" ? "مواقيت الصلاة" : "Prayer schedule"}</p>
        <h1 className="font-display mt-2 text-4xl text-pine sm:text-5xl">{formatLongDate(now, lang)}</h1>
        <p className="mt-3 text-muted">
          {hijriDate(now, lang)}{" "}
          <span className="text-sm">
            ({lang === "ar" ? "تاريخ هجري تقريبي، قد يختلف يومًا بحسب رؤية الهلال" : "approximate Hijri date — may differ by a day from local moon sighting"})
          </span>
        </p>
        <p className="mt-2 text-muted">
          {lang === "ar" ? "الوقت المحلي في تامبا" : "Local time in Tampa"}:{" "}
          <LiveClock initial={now.toISOString()} lang={lang} className="font-bold text-pine" /> {tzAbbreviation(now)} (America/New_York)
        </p>
      </header>

      <div className="mt-8 max-w-3xl">
        <PrayerStateBanner board={board} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <section aria-labelledby="today-h" className="card p-5 sm:p-8">
          <h2 id="today-h" className="font-display text-2xl text-pine">{lang === "ar" ? "اليوم" : "Today"}</h2>
          <div className="mt-4" aria-live="polite">
            <PrayerTable
              rows={board.rows}
              lang={lang}
              highlight={board.next && board.next.dateKey === board.dateKey ? board.next.key : null}
              caption={`Prayer times for ${formatLongDate(now)}`}
              isFriday={isFriday}
            />
          </div>
          {maghrib && (
            <p className="mt-4 flex items-start gap-2 text-sm text-muted">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
              {lang === "ar"
                ? `يبدأ اليوم الهجري عند غروب الشمس (المغرب ${formatTime(maghrib.adhan, lang)}).`
                : `The Islamic day begins at sunset (Maghrib, ${formatTime(maghrib.adhan, lang)}).`}
            </p>
          )}
        </section>

        <div className="flex flex-col gap-6">
          {board.next && (
            <section aria-labelledby="next-h" className="rounded-[1.5rem] bg-evergreen p-6 text-ivory">
              <h2 id="next-h" className="text-sm font-bold text-sage">{d.next}</h2>
              <p className="font-display mt-1 text-4xl">
                {lang === "ar" ? PRAYER_LABELS[board.next.key].ar : PRAYER_LABELS[board.next.key].en}
              </p>
              <p className="mt-1 text-sage">
                {d.adhan} {formatTime(board.next.adhan, lang)} · <Countdown target={board.next.adhan.toISOString()} lang={lang} />
              </p>
              {board.next.iqamah?.status === "set" && (
                <p className="mt-1 text-ivory">
                  {d.iqamah} {formatTime(board.next.iqamah.at, lang)}
                </p>
              )}
              {board.next.dateKey !== board.dateKey && <p className="mt-2 text-xs text-sage">{lang === "ar" ? "غدًا" : "Tomorrow"}</p>}
            </section>
          )}

          <section aria-labelledby="jumuah-h" className="card p-6">
            <h2 id="jumuah-h" className="font-display text-2xl text-pine">{lang === "ar" ? "صلاة الجمعة" : "Jumu'ah"}</h2>
            {board.jumuah.length === 0 ? (
              <p className="mt-3 text-muted">{d.awaiting}.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {board.jumuah.map((j) => (
                  <li key={`${j.label}-${j.sort_order}`} className="rounded-2xl bg-sage-100 p-4">
                    <p className="font-bold text-pine">{j.label}</p>
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-muted">{lang === "ar" ? "الخطبة" : "Khutbah"}</dt>
                        <dd className="tabular text-lg font-bold text-pine">{formatWallTime(j.khutbah_time, lang)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">{d.iqamah}</dt>
                        <dd className="tabular text-lg font-bold text-pine">{formatWallTime(j.iqamah_time, lang)}</dd>
                      </div>
                    </dl>
                    {(j.language || j.note) && <p className="mt-2 text-sm text-muted">{[j.language, j.note].filter(Boolean).join(" · ")}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(board.overridesToday.length > 0 || board.upcomingOverrides.length > 0) && (
            <section aria-labelledby="notices-h" className="card p-6">
              <h2 id="notices-h" className="flex items-center gap-2 font-display text-2xl text-pine">
                <CalendarClock aria-hidden className="size-5" /> {lang === "ar" ? "تغييرات خاصة" : "Special timings"}
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {[...board.overridesToday, ...board.upcomingOverrides].map((o) => (
                  <li key={`${o.on_date}-${o.prayer}`}>
                    <span className="font-semibold">{o.on_date}</span> · {PRAYER_LABELS[o.prayer].en} {o.iqamah_time ? formatWallTime(o.iqamah_time) : ""}{" "}
                    {o.note && <span className="text-muted">— {o.note}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <section aria-labelledby="tomorrow-h" className="card mt-8 p-5 sm:p-8 lg:max-w-[60%]">
        <h2 id="tomorrow-h" className="font-display text-2xl text-pine">{lang === "ar" ? "غدًا" : "Tomorrow"}</h2>
        <div className="mt-4">
          <PrayerTable rows={board.tomorrow} lang={lang} caption="Tomorrow's prayer times" isFriday={weekdayOf(board.dateKey) === 4} />
        </div>
      </section>

      <section aria-labelledby="method-h" className="mt-10 max-w-3xl text-sm text-muted">
        <h2 id="method-h" className="font-bold text-pine">{lang === "ar" ? "كيف تُحسب هذه المواقيت" : "How these times are produced"}</h2>
        <ul className="mt-2 list-disc space-y-1 ps-5">
          <li>
            Adhan times are calculated astronomically for the masjid&apos;s location using the{" "}
            <strong>{METHOD_LABEL[board.calc.method] ?? board.calc.method}</strong> method and the{" "}
            <strong>{board.calc.madhab === "hanafi" ? "Hanafi" : "standard (Shafi'i, Maliki, Hanbali)"}</strong> Asr rule.
          </li>
          <li>Iqamah (congregation) times are entered by masjid administrators — they are never inferred automatically.</li>
          <li>All times are shown in Eastern Time (America/New_York) and adjust automatically for daylight saving.</li>
          {board.publication && (
            <li>
              Schedule version {board.publication.version}, effective from {board.publication.effective_from}
              {board.publication.published_at && <> · published {formatLongDate(new Date(board.publication.published_at))}</>}.
            </li>
          )}
          {board.publication?.notice && <li>{board.publication.notice}</li>}
        </ul>
      </section>
    </div>
  );
}
