import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { pageGuard } from "@/components/staff/guard";
import { ActionForm } from "@/components/forms/ActionForm";
import { PrayerTable } from "@/components/prayer/PrayerTable";
import { PrayerStateBanner } from "@/components/prayer/PrayerStateBanner";
import { getBoardForPublication, getPrayerBoard } from "@/lib/prayer/data";
import { DAILY_PRAYERS, PRAYER_LABELS, formatWallTime, localDateKey } from "@/lib/prayer/engine";
import {
  addJumuah,
  addOverride,
  createDraft,
  deleteIqamahRule,
  deleteJumuah,
  deleteOverride,
  discardDraft,
  publishDraft,
  saveDraftMeta,
  saveIqamahRule,
} from "@/app/actions/prayer";

export const metadata: Metadata = { title: "Prayer editor · Administration" };

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const METHODS = [
  ["NorthAmerica", "ISNA (North America)"],
  ["MuslimWorldLeague", "Muslim World League"],
  ["Egyptian", "Egyptian General Authority"],
  ["Karachi", "Karachi"],
  ["UmmAlQura", "Umm al-Qura"],
  ["MoonsightingCommittee", "Moonsighting Committee"],
];

export default async function PrayerEditor() {
  const denied = await pageGuard(["admin"], "prayer editor");
  if (denied) return denied;
  const supabase = await createClient();
  const [{ data: pubs }, current] = await Promise.all([
    supabase
      .from("prayer_publications")
      .select("id, version, status, title, effective_from, is_sample, published_at, verified_at, calculation_method, madhab, adjustments, notice")
      .order("version", { ascending: false })
      .limit(20),
    getPrayerBoard(),
  ]);
  const draft = (pubs ?? []).find((p) => p.status === "draft") ?? null;

  if (!draft) {
    return (
      <div className="space-y-6">
        <Header />
        <section className="card p-6">
          <h2 className="font-display text-2xl text-pine">Currently published</h2>
          <div className="mt-3"><PrayerStateBanner board={current} /></div>
          <div className="mt-4"><PrayerTable rows={current.rows} caption="Current published schedule" /></div>
          <div className="mt-6 flex flex-wrap gap-3">
            {current.publication && (
              <ActionForm action={createDraft} submitLabel="Edit as new draft (copy current)" className="">
                <input type="hidden" name="from" value={current.publication.id} />
              </ActionForm>
            )}
            <ActionForm action={createDraft} submitLabel="Start a blank draft" buttonClassName="btn btn-secondary" className="" />
          </div>
        </section>
        <History pubs={pubs ?? []} />
      </div>
    );
  }

  const [{ data: rules }, { data: overrides }, { data: jumuah }, preview] = await Promise.all([
    supabase.from("iqamah_schedules").select("id, prayer, weekday, mode, time_of_day, offset_minutes").eq("publication_id", draft.id),
    supabase.from("prayer_overrides").select("id, on_date, prayer, iqamah_time, kind, note").eq("publication_id", draft.id).order("on_date"),
    supabase.from("jumuah_sessions").select("id, label, khutbah_time, iqamah_time, language, note, sort_order").eq("publication_id", draft.id).order("sort_order"),
    getBoardForPublication(draft.id),
  ]);
  const adj = (draft.adjustments ?? {}) as Record<string, number>;
  const daily = (p: string) => (rules ?? []).find((r) => r.prayer === p && r.weekday === null);
  const weekdayRules = (rules ?? []).filter((r) => r.weekday !== null);
  const missing = DAILY_PRAYERS.filter((p) => !daily(p));
  const warnings = preview.rows.filter((r) => r.warning);
  const today = localDateKey(new Date());

  return (
    <div className="space-y-6">
      <Header />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-sage-100 p-4 text-sm text-pine">
        <strong>Editing draft v{draft.version}</strong> — the public site is unchanged until you publish.
        {draft.is_sample && <span className="badge bg-warning-bg text-warning-ink">Copied from demo sample</span>}
        <Link href={`/display?preview=${draft.id}`} target="_blank" className="ms-auto inline-flex items-center gap-1 font-bold underline">
          Preview masjid screen <ExternalLink aria-hidden className="size-3" />
        </Link>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          {/* Iqamah rules */}
          <section className="card p-6" aria-labelledby="iqamah-h">
            <h2 id="iqamah-h" className="font-display text-2xl text-pine">Daily iqamah</h2>
            <p className="mt-1 text-sm text-muted">
              Choose a fixed clock time, or explicitly choose &ldquo;minutes after adhan&rdquo;. Nothing is filled in automatically.
            </p>
            <ul className="mt-5 space-y-3">
              {DAILY_PRAYERS.map((p) => {
                const r = daily(p);
                return (
                  <li key={p} className="rounded-2xl border border-pine/10 p-4">
                    <ActionForm action={saveIqamahRule} submitLabel="Save" buttonClassName="btn btn-secondary min-h-10" className="flex flex-wrap items-end gap-3">
                      <input type="hidden" name="publicationId" value={draft.id} />
                      <input type="hidden" name="prayer" value={p} />
                      <input type="hidden" name="weekday" value="" />
                      <p className="w-24 font-bold text-pine">{PRAYER_LABELS[p].en}</p>
                      <fieldset className="flex gap-3 text-sm">
                        <legend className="sr-only">{PRAYER_LABELS[p].en} iqamah mode</legend>
                        <label className="flex items-center gap-1"><input type="radio" name="mode" value="fixed" defaultChecked={!r || r.mode === "fixed"} /> Fixed</label>
                        <label className="flex items-center gap-1"><input type="radio" name="mode" value="offset" defaultChecked={r?.mode === "offset"} /> After adhan</label>
                      </fieldset>
                      <div>
                        <label className="text-xs text-muted" htmlFor={`t-${p}`}>Time (24h)</label>
                        <input id={`t-${p}`} name="time" type="time" defaultValue={r?.time_of_day?.slice(0, 5) ?? ""} className="input min-h-10 w-32 py-1" />
                      </div>
                      <div>
                        <label className="text-xs text-muted" htmlFor={`o-${p}`}>Minutes</label>
                        <input id={`o-${p}`} name="offset" type="number" min={0} max={90} defaultValue={r?.offset_minutes ?? ""} className="input min-h-10 w-24 py-1" />
                      </div>
                      {!r && <span className="badge bg-warning-bg text-warning-ink">Not set</span>}
                    </ActionForm>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Weekday rules */}
          <section className="card p-6" aria-labelledby="weekday-h">
            <h2 id="weekday-h" className="font-display text-2xl text-pine">Weekday exceptions</h2>
            <p className="mt-1 text-sm text-muted">E.g. a later Isha on weekends. Overrides the daily rule on that weekday.</p>
            <ul className="mt-3 space-y-2 text-sm">
              {weekdayRules.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-xl bg-sand/50 px-3 py-2">
                  <span>
                    {WEEKDAYS[r.weekday!]} · {PRAYER_LABELS[r.prayer].en} ·{" "}
                    {r.mode === "fixed" ? formatWallTime(r.time_of_day!) : `${r.offset_minutes} min after adhan`}
                  </span>
                  <form action={deleteIqamahRule}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-ghost min-h-9 px-2" aria-label="Remove exception"><Trash2 aria-hidden className="size-4" /></button>
                  </form>
                </li>
              ))}
            </ul>
            <ActionForm action={saveIqamahRule} submitLabel="Add exception" buttonClassName="btn btn-secondary min-h-10" className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="publicationId" value={draft.id} />
              <Select name="weekday" label="Weekday" options={WEEKDAYS.map((w, i) => [String(i), w])} />
              <Select name="prayer" label="Prayer" options={DAILY_PRAYERS.map((p) => [p, PRAYER_LABELS[p].en])} />
              <Select name="mode" label="Mode" options={[["fixed", "Fixed time"], ["offset", "After adhan"]]} />
              <div><label className="text-xs text-muted" htmlFor="wk-t">Time</label><input id="wk-t" name="time" type="time" className="input min-h-10 w-32 py-1" /></div>
              <div><label className="text-xs text-muted" htmlFor="wk-o">Minutes</label><input id="wk-o" name="offset" type="number" min={0} max={90} className="input min-h-10 w-24 py-1" /></div>
            </ActionForm>
          </section>

          {/* Jumuah */}
          <section className="card p-6" aria-labelledby="jumuah-h">
            <h2 id="jumuah-h" className="font-display text-2xl text-pine">Jumu&apos;ah sessions</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(jumuah ?? []).length === 0 && <li className="text-muted">None yet — the public page will say the schedule is awaiting confirmation.</li>}
              {(jumuah ?? []).map((j) => (
                <li key={j.id} className="flex items-center justify-between rounded-xl bg-sand/50 px-3 py-2">
                  <span>{j.label} · khutbah {formatWallTime(j.khutbah_time)} · iqamah {formatWallTime(j.iqamah_time)} {j.language && `· ${j.language}`}</span>
                  <form action={deleteJumuah}>
                    <input type="hidden" name="id" value={j.id} />
                    <button className="btn btn-ghost min-h-9 px-2" aria-label={`Remove ${j.label}`}><Trash2 aria-hidden className="size-4" /></button>
                  </form>
                </li>
              ))}
            </ul>
            <ActionForm action={addJumuah} submitLabel="Add session" buttonClassName="btn btn-secondary min-h-10" className="mt-4 grid gap-3 sm:grid-cols-3" resetOnSuccess>
              <input type="hidden" name="publicationId" value={draft.id} />
              <div><label className="text-xs text-muted" htmlFor="j-l">Label</label><input id="j-l" name="label" defaultValue="Jumu'ah" className="input min-h-10 py-1" /></div>
              <div><label className="text-xs text-muted" htmlFor="j-k">Khutbah</label><input id="j-k" name="khutbah" type="time" className="input min-h-10 py-1" /></div>
              <div><label className="text-xs text-muted" htmlFor="j-i">Iqamah</label><input id="j-i" name="iqamah" type="time" className="input min-h-10 py-1" /></div>
              <div><label className="text-xs text-muted" htmlFor="j-lang">Language</label><input id="j-lang" name="language" className="input min-h-10 py-1" /></div>
              <div className="sm:col-span-2"><label className="text-xs text-muted" htmlFor="j-n">Note</label><input id="j-n" name="note" className="input min-h-10 py-1" /></div>
            </ActionForm>
          </section>

          {/* Overrides */}
          <section className="card p-6" aria-labelledby="ov-h">
            <h2 id="ov-h" className="font-display text-2xl text-pine">Date overrides (Ramadan, Eid, holidays)</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(overrides ?? []).map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-xl bg-sand/50 px-3 py-2">
                  <span>{o.on_date} · {PRAYER_LABELS[o.prayer].en} · {o.iqamah_time ? formatWallTime(o.iqamah_time) : "—"} · {o.kind} {o.note && `· ${o.note}`}</span>
                  <form action={deleteOverride}>
                    <input type="hidden" name="id" value={o.id} />
                    <button className="btn btn-ghost min-h-9 px-2" aria-label="Remove override"><Trash2 aria-hidden className="size-4" /></button>
                  </form>
                </li>
              ))}
            </ul>
            <ActionForm action={addOverride} submitLabel="Add override" buttonClassName="btn btn-secondary min-h-10" className="mt-4 grid gap-3 sm:grid-cols-3" resetOnSuccess>
              <input type="hidden" name="publicationId" value={draft.id} />
              <div><label className="text-xs text-muted" htmlFor="ov-d">Date</label><input id="ov-d" name="onDate" type="date" min={today} className="input min-h-10 py-1" /></div>
              <Select name="prayer" label="Prayer" options={DAILY_PRAYERS.map((p) => [p, PRAYER_LABELS[p].en])} />
              <div><label className="text-xs text-muted" htmlFor="ov-t">Iqamah</label><input id="ov-t" name="time" type="time" className="input min-h-10 py-1" /></div>
              <Select name="kind" label="Kind" options={[["ramadan", "Ramadan"], ["eid", "Eid"], ["holiday", "Holiday"], ["jumuah", "Jumu'ah"], ["other", "Other"]]} />
              <div className="sm:col-span-2"><label className="text-xs text-muted" htmlFor="ov-n">Note (public)</label><input id="ov-n" name="note" maxLength={200} className="input min-h-10 py-1" /></div>
            </ActionForm>
          </section>

          {/* Calculation */}
          <section className="card p-6" aria-labelledby="calc-h">
            <h2 id="calc-h" className="font-display text-2xl text-pine">Adhan calculation</h2>
            <ActionForm action={saveDraftMeta} submitLabel="Save calculation settings" buttonClassName="btn btn-secondary" className="mt-4 space-y-4">
              <input type="hidden" name="id" value={draft.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="field-label" htmlFor="m-title">Title</label><input id="m-title" name="title" defaultValue={draft.title} className="input" /></div>
                <div><label className="field-label" htmlFor="m-eff">Effective from</label><input id="m-eff" name="effectiveFrom" type="date" defaultValue={draft.effective_from} className="input" /></div>
                <Select name="method" label="Calculation method" options={METHODS as [string, string][]} defaultValue={draft.calculation_method} big />
                <Select name="madhab" label="Asr rule" options={[["shafi", "Standard (Shafi'i, Maliki, Hanbali)"], ["hanafi", "Hanafi"]]} defaultValue={draft.madhab} big />
              </div>
              <fieldset>
                <legend className="field-label">Adjustments (minutes, −30 to 30)</legend>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"].map((k) => (
                    <div key={k}>
                      <label className="text-xs text-muted" htmlFor={`adj-${k}`}>{k}</label>
                      <input id={`adj-${k}`} name={`adj_${k}`} type="number" min={-30} max={30} defaultValue={adj[k] ?? 0} className="input min-h-10 py-1" />
                    </div>
                  ))}
                </div>
              </fieldset>
              <div><label className="field-label" htmlFor="m-notice">Public notice (optional)</label><textarea id="m-notice" name="notice" maxLength={600} rows={2} defaultValue={draft.notice} className="input min-h-0" /></div>
              <p className="text-xs text-muted">Coordinates come from Settings (currently fixed to the masjid address). Time zone is locked to America/New_York.</p>
            </ActionForm>
          </section>
        </div>

        {/* Preview + publish */}
        <aside className="space-y-6 2xl:sticky 2xl:top-6 2xl:self-start">
          <section className="card p-6" aria-labelledby="prev-h">
            <h2 id="prev-h" className="font-display text-2xl text-pine">Preview (today)</h2>
            <p className="text-sm text-muted">How today would look with this draft.</p>
            {warnings.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-xl bg-warning-bg p-3 text-sm text-warning-ink" role="alert">
                {warnings.map((w) => (
                  <li key={w.key} className="flex gap-2"><AlertTriangle aria-hidden className="size-4 shrink-0" /> {PRAYER_LABELS[w.key].en}: {w.warning}</li>
                ))}
              </ul>
            )}
            <div className="mt-4"><PrayerTable rows={preview.rows} caption="Draft preview" /></div>
            <h3 className="mt-6 font-bold text-pine">Compare: currently public</h3>
            <div className="mt-2 opacity-80"><PrayerTable rows={current.rows} caption="Currently published" /></div>
          </section>
          <section className="card border-2 border-evergreen p-6" aria-labelledby="pub-h">
            <h2 id="pub-h" className="font-display text-2xl text-pine">Publish</h2>
            {missing.length > 0 ? (
              <p className="mt-2 text-sm text-warning-ink">Set a daily iqamah for: {missing.map((m) => PRAYER_LABELS[m].en).join(", ")}.</p>
            ) : (
              <ActionForm action={publishDraft} submitLabel="Publish schedule" pendingText="Publishing…" className="mt-3 space-y-3">
                <input type="hidden" name="id" value={draft.id} />
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" name="verified" className="mt-1 size-5" />
                  I confirm these iqamah and Jumu&apos;ah times were checked with the imam or masjid leadership. My name and the time are recorded.
                </label>
              </ActionForm>
            )}
            <form action={discardDraft} className="mt-4">
              <input type="hidden" name="id" value={draft.id} />
              <button type="submit" className="btn btn-ghost text-sm text-danger">Discard draft</button>
            </form>
          </section>
          <History pubs={pubs ?? []} />
        </aside>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header>
      <p className="eyebrow">Prayer editor</p>
      <h1 className="font-display text-4xl text-pine">Prayer schedule</h1>
      <p className="text-muted">Draft → preview → publish. Every change is recorded in the audit log.</p>
    </header>
  );
}

function Select({ name, label, options, defaultValue, big = false }: { name: string; label: string; options: [string, string][]; defaultValue?: string; big?: boolean }) {
  return (
    <div>
      <label className={big ? "field-label" : "text-xs text-muted"} htmlFor={`sel-${name}-${label}`}>{label}</label>
      <select id={`sel-${name}-${label}`} name={name} defaultValue={defaultValue} className={`input ${big ? "" : "min-h-10 py-1"}`}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function History({ pubs }: { pubs: { id: string; version: number; status: string; effective_from: string; is_sample: boolean; published_at: string | null; title: string }[] }) {
  return (
    <section className="card p-6" aria-labelledby="hist-h">
      <h2 id="hist-h" className="font-display text-xl text-pine">Schedule history</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {pubs.map((p) => (
          <li key={p.id} className="flex flex-wrap justify-between gap-2 border-b border-pine/5 py-1">
            <span>v{p.version} · {p.title} {p.is_sample && <span className="text-warning-ink">(sample)</span>}</span>
            <span className="text-muted">{p.status} · from {p.effective_from}{p.published_at && ` · ${new Date(p.published_at).toLocaleDateString("en-US")}`}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
