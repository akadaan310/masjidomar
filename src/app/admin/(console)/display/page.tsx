import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pageGuard } from "@/components/staff/guard";
import { ActionForm } from "@/components/forms/ActionForm";
import { saveDisplay } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Masjid screen · Administration" };

const PANELS = [
  ["prayers", "Today's prayer & iqamah grid"],
  ["next", "Next prayer countdown"],
  ["jumuah", "Jumu'ah sessions"],
  ["announcements", "Approved announcements (rotates every 12 s; paused in quiet mode)"],
  ["program", "Next upcoming program"],
];

export default async function DisplaySetup() {
  const denied = await pageGuard(["admin"], "screen settings");
  if (denied) return denied;
  const supabase = await createClient();
  const { data: p } = await supabase.from("display_presets").select("*").maybeSingle();
  const panels = (p?.panels as string[]) ?? [];
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Masjid screen</p>
        <h1 className="font-display text-4xl text-pine">Prayer hall display</h1>
        <p className="text-muted">
          Open <Link href="/display" target="_blank" className="font-semibold underline">/display</Link> on the hall TV&apos;s browser and press &ldquo;Full screen&rdquo;.
          It shows only published, public information and refreshes itself.
        </p>
      </header>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr] [&>*]:min-w-0">
        <section className="card p-6">
          <ActionForm action={saveDisplay} submitLabel="Save screen settings" className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="field-label">Panels</legend>
              {PANELS.map(([v, l]) => (
                <label key={v} className="flex items-center gap-3 text-sm">
                  <input type="checkbox" name="panels" value={v} defaultChecked={panels.includes(v)} className="size-5" /> {l}
                </label>
              ))}
            </fieldset>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="quietMode" defaultChecked={p?.quiet_mode} className="size-5" />
              <span><strong>Quiet mode</strong> — no rotation or motion. (The screen also goes quiet automatically for 15 minutes after each iqamah.)</span>
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="showSeconds" defaultChecked={p?.show_seconds} className="size-5" /> Show seconds on the clock
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="lm">Language</label>
                <select id="lm" name="languageMode" defaultValue={p?.language_mode} className="input">
                  <option value="bilingual">English + Arabic</option>
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="th">Colour theme</label>
                <select id="th" name="theme" defaultValue={p?.theme} className="input">
                  <option value="evergreen">Evergreen</option>
                  <option value="navy">Prayer-rug navy</option>
                  <option value="ivory">Ivory (bright rooms)</option>
                </select>
              </div>
            </div>
          </ActionForm>
          <p className="mt-4 text-xs text-muted">Last changed {p?.updated_at ? new Date(p.updated_at).toLocaleString("en-US", { timeZone: "America/New_York" }) : "—"}.</p>
        </section>
        <section className="card overflow-hidden p-0" aria-label="Live preview">
          <p className="border-b border-pine/10 px-4 py-2 text-sm font-semibold text-pine">Live preview (what the hall screen shows now)</p>
          <div className="relative aspect-video w-full">
            <iframe src="/display" title="Masjid screen preview" className="absolute inset-0 h-full w-full" />
          </div>
        </section>
      </div>
    </div>
  );
}
