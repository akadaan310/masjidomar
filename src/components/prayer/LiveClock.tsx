"use client";
import { useEffect, useState } from "react";

const TZ = "America/New_York";

function fmt(d: Date, lang: "en" | "ar", seconds = false) {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    ...(seconds ? { second: "2-digit" } : {}),
    timeZone: TZ,
  }).format(d);
}

/** Ticking Tampa-local clock. Server renders the initial value so there is no layout shift. */
export function LiveClock({ initial, lang = "en", seconds = false, className = "" }: { initial: string; lang?: "en" | "ar"; seconds?: boolean; className?: string }) {
  const [now, setNow] = useState(() => new Date(initial));
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), seconds ? 1000 : 15_000);
    return () => clearInterval(id);
  }, [seconds]);
  return (
    <time dateTime={now.toISOString()} className={`tabular ${className}`} suppressHydrationWarning>
      {fmt(now, lang, seconds)}
    </time>
  );
}

/** "in 1 h 12 min" countdown; announces politely only when the minute value changes. */
export function Countdown({ target, lang = "en" }: { target: string; lang?: "en" | "ar" }) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const mins = Math.max(0, Math.round((new Date(target).getTime() - now) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const text =
    lang === "ar"
      ? mins === 0
        ? "الآن"
        : `بعد ${h ? `${h} س ` : ""}${m} د`
      : mins === 0
        ? "now"
        : `in ${h ? `${h} h ` : ""}${m} min`;
  return <span suppressHydrationWarning>{text}</span>;
}
