import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getPrograms, getUpcomingEvents, getRsvpTotals, formatEventWhen } from "@/lib/content";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { plainExcerpt } from "@/lib/markdown";
import { getLang } from "@/lib/i18n";

export const metadata: Metadata = { title: "Programs & events", description: "Classes, family programs, lectures and gatherings at Masjid Omar." };

const CATS = [["", "All"], ["class", "Classes"], ["family", "Family"], ["lecture", "Lectures"], ["youth", "Youth"], ["seasonal", "Seasonal"], ["community", "Community"]];

export default async function ProgramsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const sp = await searchParams;
  const lang = await getLang();
  const q = (sp.q ?? "").slice(0, 60);
  const category = CATS.some(([c]) => c === sp.category) ? sp.category : "";
  const [programs, events] = await Promise.all([getPrograms({ q, category }), getUpcomingEvents(24)]);
  const filteredEvents = q ? events.filter((e) => `${e.title} ${e.description_md}`.toLowerCase().includes(q.toLowerCase())) : events;
  const totals = await getRsvpTotals(filteredEvents.map((e) => e.id));
  return (
    <div className="container-page py-12 sm:py-16">
      <p className="eyebrow">Learn &amp; gather</p>
      <h1 className="font-display mt-2 text-4xl text-pine sm:text-5xl">Programs &amp; events</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">Only programs approved by the masjid appear here. Times are Eastern Time.</p>

      <form role="search" className="mt-8 flex flex-wrap items-end gap-3">
        <div className="min-w-60 flex-1">
          <label htmlFor="q" className="field-label">Search</label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input id="q" name="q" defaultValue={q} className="input ps-9" />
          </div>
        </div>
        <div>
          <label htmlFor="category" className="field-label">Type</label>
          <select id="category" name="category" defaultValue={category} className="input">
            {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <button className="btn btn-primary">Filter</button>
      </form>

      <section aria-labelledby="ev-h" className="mt-12">
        <h2 id="ev-h" className="font-display text-3xl text-pine">Upcoming</h2>
        {filteredEvents.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-pine/20 p-6 text-muted">No upcoming events{q ? " match your search" : " have been published yet"}.</p>
        ) : (
          <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((e) => {
              const t = totals.get(e.id);
              const full = e.capacity !== null && (t?.confirmed ?? 0) >= e.capacity;
              return (
                <li key={e.id} className="card flex flex-col p-6">
                  <p className="text-sm font-bold text-evergreen">{formatEventWhen(e.starts_at, e.ends_at, lang)}</p>
                  <h3 className="font-display mt-2 text-xl text-pine">
                    <Link href={`/programs/events/${e.slug}`} className="hover:underline">{lang === "ar" && e.title_ar ? e.title_ar : e.title}</Link>
                  </h3>
                  <p className="mt-2 text-sm text-muted">{plainExcerpt(e.description_md, 130)}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                    <SampleBadge show={e.is_sample} />
                    {e.status === "cancelled" && <span className="badge bg-danger text-white">Cancelled</span>}
                    {e.rsvp_enabled && e.status === "published" && <span className="badge bg-sage-100 text-pine">{full ? (e.waitlist_enabled ? "Full · waitlist open" : "Full") : "RSVP open"}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="pr-h" className="mt-14">
        <h2 id="pr-h" className="font-display text-3xl text-pine">Ongoing programs</h2>
        {programs.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-pine/20 p-6 text-muted">No programs{q || category ? " match these filters" : " have been published yet"}.</p>
        ) : (
          <ul className="mt-6 grid gap-5 md:grid-cols-2">
            {programs.map((p) => (
              <li key={p.id} className="card p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge bg-sand text-pine">{p.category}</span>
                  <SampleBadge show={p.is_sample} />
                </div>
                <h3 className="font-display mt-3 text-xl text-pine">
                  <Link href={`/programs/${p.slug}`} className="hover:underline">{lang === "ar" && p.title_ar ? p.title_ar : p.title}</Link>
                </h3>
                <p className="mt-1 text-sm text-muted">{p.summary}</p>
                {(p.schedule_note || p.audience_note) && <p className="mt-3 text-sm font-semibold text-pine">{[p.schedule_note, p.audience_note].filter(Boolean).join(" · ")}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
