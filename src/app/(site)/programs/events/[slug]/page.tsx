import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { renderMarkdown } from "@/lib/markdown";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { formatEventWhen, getRsvpTotals } from "@/lib/content";
import { RsvpForm } from "@/components/member/RsvpForm";
import { cancelRsvp } from "@/app/actions/member";

export const metadata: Metadata = { title: "Event" };

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: e } = await supabase.from("events").select("*").eq("slug", slug).in("status", ["published", "cancelled"]).maybeSingle();
  if (!e) notFound();
  const [user, totals] = await Promise.all([getSessionUser(), getRsvpTotals([e.id])]);
  const t = totals.get(e.id) ?? { confirmed: 0, waitlisted: 0 };
  const mine = user ? (await supabase.from("event_registrations").select("status, party_size").eq("event_id", e.id).eq("user_id", user.id).maybeSingle()).data : null;
  const full = e.capacity !== null && t.confirmed >= e.capacity;
  const past = new Date(e.starts_at) < new Date();
  const path = `/programs/events/${e.slug}`;
  return (
    <article className="container-page max-w-3xl py-12 sm:py-16">
      <Link href="/programs" className="text-sm font-semibold text-evergreen">← Programs &amp; events</Link>
      <div className="mt-6 flex flex-wrap gap-2"><SampleBadge show={e.is_sample} />{e.status === "cancelled" && <span className="badge bg-danger text-white">Cancelled</span>}</div>
      <h1 className="font-display mt-3 text-4xl text-pine sm:text-5xl">{e.title}</h1>
      {e.title_ar && <p lang="ar" dir="rtl" className="mt-2 text-2xl text-evergreen">{e.title_ar}</p>}
      {e.status === "cancelled" && e.cancel_note && <p role="alert" className="mt-4 rounded-xl bg-danger/5 p-4 text-danger">{e.cancel_note}</p>}
      <dl className="mt-6 grid gap-3 text-pine sm:grid-cols-2">
        <div className="card p-4"><dt className="text-xs font-bold uppercase tracking-wider text-muted">When</dt><dd className="mt-1 font-semibold">{formatEventWhen(e.starts_at, e.ends_at)}</dd></div>
        <div className="card p-4"><dt className="text-xs font-bold uppercase tracking-wider text-muted">Where</dt><dd className="mt-1 flex gap-2 font-semibold"><MapPin aria-hidden className="mt-1 size-4 shrink-0" />{e.location}</dd></div>
      </dl>
      <div className="prose-masjid mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(e.description_md) }} />
      <div className="mt-8 flex flex-wrap gap-3">
        <a href={`/calendar/${e.slug}`} className="btn btn-secondary" download><CalendarPlus aria-hidden className="size-4" /> Add to calendar (.ics)</a>
      </div>
      {e.rsvp_enabled && e.status === "published" && (
        <section aria-labelledby="rsvp-h" className="card mt-10 p-6 sm:p-8">
          <h2 id="rsvp-h" className="font-display text-2xl text-pine">RSVP</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <Users aria-hidden className="size-4" /> {t.confirmed} attending{e.capacity ? ` of ${e.capacity} places` : ""}{t.waitlisted ? ` · ${t.waitlisted} on the waitlist` : ""}
          </p>
          <div className="mt-5">
            {past ? (
              <p className="text-muted">This gathering has started.</p>
            ) : !user ? (
              <p><Link href={`/login?next=${encodeURIComponent(path)}`} className="btn btn-primary">Sign in to RSVP</Link></p>
            ) : mine && mine.status !== "cancelled" ? (
              <div className="space-y-3">
                <p className="font-semibold text-pine">{mine.status === "confirmed" ? `You're registered (party of ${mine.party_size}).` : "You're on the waitlist."}</p>
                <form action={cancelRsvp}>
                  <input type="hidden" name="eventId" value={e.id} />
                  <input type="hidden" name="path" value={path} />
                  <button className="btn btn-secondary">Cancel my RSVP</button>
                </form>
              </div>
            ) : full && !e.waitlist_enabled ? (
              <p className="text-muted">This gathering is full.</p>
            ) : (
              <RsvpForm eventId={e.id} path={path} full={full} waitlist={e.waitlist_enabled} />
            )}
          </div>
        </section>
      )}
    </article>
  );
}
