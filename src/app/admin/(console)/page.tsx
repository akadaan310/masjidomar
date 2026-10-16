import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { getPrayerBoard } from "@/lib/prayer/data";
import { PrayerTable } from "@/components/prayer/PrayerTable";
import { PrayerStateBanner } from "@/components/prayer/PrayerStateBanner";
import { formatLongDate } from "@/lib/prayer/engine";
import { getSiteSettings } from "@/lib/site";

export const metadata: Metadata = { title: "Today · Administration" };

export default async function AdminToday() {
  const supabase = await createClient();
  const user = await getSessionUser();
  const [{ data: summary }, board, { settings }, { data: draft }, { data: recent }] = await Promise.all([
    supabase.rpc("admin_today_summary"),
    getPrayerBoard(),
    getSiteSettings(),
    supabase.from("prayer_publications").select("id, effective_from, updated_at").eq("status", "draft").maybeSingle(),
    user?.roles.includes("admin")
      ? supabase.from("audit_events").select("id, action, target_type, created_at").order("created_at", { ascending: false }).limit(8)
      : Promise.resolve({ data: [] as { id: number; action: string; target_type: string; created_at: string }[] }),
  ]);
  const s = (summary ?? {}) as Record<string, number>;
  const tiles: [string, number | undefined, string][] = [
    ["Open questions", s.questions_open, "/admin/questions"],
    ["Unassigned questions", s.questions_unassigned, "/admin/questions"],
    ["Waiting > 72 h", s.questions_waiting_over_72h, "/admin/questions"],
    ["FAQ proposals to review", s.faq_proposals_pending, "/admin/faq"],
    ["Upcoming RSVPs (people)", s.rsvps_upcoming, "/admin/programs"],
    ["New volunteer inquiries", s.volunteer_inquiries_new, "/admin/volunteer"],
    ["Data requests pending", s.data_requests_pending, "/admin/members"],
    ["Urgent announcements live", s.urgent_announcements, "/admin/announcements"],
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Today</p>
        <h1 className="font-display text-4xl text-pine">{formatLongDate(new Date())}</h1>
        <p className="text-muted">Aggregates only — private question content is never shown here.</p>
      </header>

      {settings.concept_mode && (
        <p className="flex items-center gap-2 rounded-xl bg-warning-bg p-4 text-sm text-warning-ink">
          <AlertTriangle aria-hidden className="size-5" /> Concept mode is on: the public site shows a preview banner, sample content is visible, and search indexing is blocked.
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(([label, value, href]) => (
          <li key={label}>
            <Link href={href} className="card block p-5 hover:border-evergreen">
              <span className="tabular block text-3xl font-bold text-pine">{value ?? 0}</span>
              <span className="text-sm text-muted">{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <section className="card p-6" aria-labelledby="today-prayer">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="today-prayer" className="font-display text-2xl text-pine">Public prayer board right now</h2>
            <div className="flex gap-2">
              <Link href="/admin/prayer" className="btn btn-primary min-h-10 text-sm">Edit schedule</Link>
              <Link href="/display" target="_blank" className="btn btn-secondary min-h-10 text-sm">Open screen</Link>
            </div>
          </div>
          <div className="mt-4"><PrayerStateBanner board={board} compact /></div>
          {draft && (
            <p className="mt-3 rounded-xl bg-sage-100 p-3 text-sm text-pine">
              A draft schedule (effective {draft.effective_from}) is waiting to be published. <Link href="/admin/prayer" className="font-bold underline">Review draft</Link>
            </p>
          )}
          <div className="mt-4"><PrayerTable rows={board.rows} caption="Current public prayer times" /></div>
        </section>
        {user?.roles.includes("admin") && (
          <section className="card p-6" aria-labelledby="recent">
            <h2 id="recent" className="font-display text-2xl text-pine">Recent activity</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {(recent ?? []).map((r) => (
                <li key={r.id} className="flex justify-between gap-3 border-b border-pine/5 pb-2">
                  <span className="font-semibold text-pine">{r.action} <span className="font-normal text-muted">{r.target_type}</span></span>
                  <time className="shrink-0 text-muted">{new Date(r.created_at).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "short", timeStyle: "short" })}</time>
                </li>
              ))}
            </ul>
            <Link href="/admin/audit" className="btn btn-ghost mt-3 text-sm">Full audit log</Link>
          </section>
        )}
      </div>
    </div>
  );
}
