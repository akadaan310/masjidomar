import { formatTime, PRAYER_LABELS, type DayRow } from "@/lib/prayer/engine";

function IqamahCell({ row, lang }: { row: DayRow; lang: "en" | "ar" }) {
  if (row.iqamah === null) return <span className="text-muted">—</span>;
  if (row.iqamah.status === "awaiting")
    return <span className="text-sm font-semibold text-muted">{lang === "ar" ? "بانتظار التأكيد" : "Awaiting confirmation"}</span>;
  return (
    <span className="flex flex-col items-end">
      <span className="tabular text-lg font-bold text-pine">{formatTime(row.iqamah.at, lang)}</span>
      {row.iqamah.rule === "offset" && (
        <span className="text-xs text-muted">{lang === "ar" ? `بعد الأذان بـ ${row.iqamah.offsetMinutes} دقيقة` : `${row.iqamah.offsetMinutes} min after adhan`}</span>
      )}
      {row.iqamah.source === "override" && <span className="text-xs font-semibold text-brass-700">{row.iqamah.note || "Special timing"}</span>}
    </span>
  );
}

export function PrayerTable({
  rows,
  lang = "en",
  highlight,
  caption,
  isFriday = false,
}: {
  rows: DayRow[];
  lang?: "en" | "ar";
  highlight?: string | null;
  caption: string;
  isFriday?: boolean;
}) {
  return (
    <table className="w-full border-separate border-spacing-0 text-start">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="text-xs uppercase tracking-[0.14em] text-muted">
          <th scope="col" className="pb-2 text-start font-bold">{lang === "ar" ? "الصلاة" : "Prayer"}</th>
          <th scope="col" className="pb-2 text-end font-bold">{lang === "ar" ? "الأذان (محسوب)" : "Adhan (calculated)"}</th>
          <th scope="col" className="pb-2 text-end font-bold">{lang === "ar" ? "الإقامة" : "Iqamah"}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isNext = highlight === row.key;
          const label = PRAYER_LABELS[row.key];
          return (
            <tr key={row.key} className={isNext ? "bg-sage-100" : ""} aria-current={isNext ? "time" : undefined}>
              <th scope="row" className={`border-t border-pine/10 py-3 ps-3 text-start ${isNext ? "rounded-s-xl" : ""}`}>
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-lg font-bold text-pine">{lang === "ar" ? label.ar : label.en}</span>
                  <span lang={lang === "ar" ? "en" : "ar"} className="text-sm text-muted">{lang === "ar" ? label.en : label.ar}</span>
                  {isNext && <span className="badge bg-evergreen text-ivory">{lang === "ar" ? "القادمة" : "Next"}</span>}
                  {isFriday && row.key === "dhuhr" && <span className="badge bg-navy text-ivory">{lang === "ar" ? "الجمعة" : "Jumu'ah below"}</span>}
                </span>
              </th>
              <td className="tabular border-t border-pine/10 py-3 text-end text-lg text-ink">{formatTime(row.adhan, lang)}</td>
              <td className={`border-t border-pine/10 py-3 pe-3 text-end ${isNext ? "rounded-e-xl" : ""}`}>
                <IqamahCell row={row} lang={lang} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
