"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { setLanguage } from "@/app/actions/session";

export function LanguageToggle({ current, label, className = "" }: { current: "en" | "ar"; label: string; className?: string }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const next = search.size ? `${pathname}?${search.toString()}` : pathname;
  return (
    <form action={setLanguage} className={className}>
      <input type="hidden" name="lang" value={current === "ar" ? "en" : "ar"} />
      <input type="hidden" name="next" value={next} />
      <button type="submit" className="btn btn-ghost min-h-11 px-3 text-sm" lang={current === "ar" ? "en" : "ar"}>
        <Languages aria-hidden className="size-4" />
        <span>{label}</span>
      </button>
    </form>
  );
}
