import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { pageGuard } from "@/components/staff/guard";
import { ActionForm } from "@/components/forms/ActionForm";
import { Field, SelectField, Check, toLocalInput } from "@/components/staff/Field";
import { saveEvent, saveProgram } from "@/app/actions/admin";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { formatEventWhen } from "@/lib/content";

export const metadata: Metadata = { title: "Programs & events · Administration" };

export default async function AdminPrograms({ searchParams }: { searchParams: Promise<{ program?: string; event?: string }> }) {
  const denied = await pageGuard(["admin", "editor"], "programs");
  if (denied) return denied;
  const sp = await searchParams;
  const user = await getSessionUser();
  const isAdmin = Boolean(user?.roles.includes("admin"));
  const supabase = await createClient();
  const [{ data: programs }, { data: events }] = await Promise.all([
    supabase.from("programs").select("*").order("title"),
    supabase.from("events").select("*").order("starts_at", { ascending: false }).limit(100),
  ]);
  const totals = new Map(
    ((await supabase.rpc("event_rsvp_totals", { p_event_ids: (events ?? []).map((e) => e.id) })).data ?? []).map((t) => [t.event_id, t]),
  );
  const prog = (programs ?? []).find((p) => p.id === sp.program) ?? null;
  const ev = (events ?? []).find((e) => e.id === sp.event) ?? null;
  const { data: regs } = ev && isAdmin
    ? await supabase.from("event_registrations").select("id, status, party_size, contact_consent, reminder_opt_in, created_at").eq("event_id", ev.id).order("created_at")
    : { data: null };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-pine">Programs &amp; events</h1>
      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-pine">Events</h2>
            <Link href="/admin/programs" className="btn btn-secondary min-h-10 text-sm">New event</Link>
          </div>
          <ul className="mt-3 divide-y divide-pine/10 text-sm">
            {(events ?? []).map((e) => {
              const t = totals.get(e.id);
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-2 py-3">
                  <Link href={`/admin/programs?event=${e.id}`} className="min-w-0 flex-1 font-semibold text-pine hover:underline">
                    {e.title}
                    <span className="block font-normal text-muted">{formatEventWhen(e.starts_at, e.ends_at)}</span>
                  </Link>
                  <SampleBadge show={e.is_sample} />
                  <span className="badge bg-sage-100 text-pine">{e.status}</span>
                  {e.rsvp_enabled && <span className="badge bg-sand text-pine">{t?.confirmed ?? 0}{e.capacity ? `/${e.capacity}` : ""} going{t?.waitlisted ? ` · ${t.waitlisted} waitlist` : ""}</span>}
                </li>
              );
            })}
          </ul>
        </section>
        <section className="card p-6">
          <h2 className="font-display text-2xl text-pine">{ev ? "Edit event" : "New event"}</h2>
          <ActionForm action={saveEvent} submitLabel="Save event" className="mt-4 space-y-4" key={ev?.id ?? "new-ev"}>
            <input type="hidden" name="id" value={ev?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" name="title" defaultValue={ev?.title} required maxLength={140} />
              <Field label="Arabic title" name="titleAr" defaultValue={ev?.title_ar} maxLength={140} dir="rtl" />
              <Field label="Slug" name="slug" defaultValue={ev?.slug} required maxLength={80} />
              <SelectField label="Program (optional)" name="programId" defaultValue={ev?.program_id ?? ""} options={[["", "—"], ...(programs ?? []).map((p) => [p.id, p.title] as [string, string])]} />
              <Field label="Starts (Eastern)" name="startsAt" type="datetime-local" defaultValue={toLocalInput(ev?.starts_at)} required />
              <Field label="Ends (Eastern)" name="endsAt" type="datetime-local" defaultValue={toLocalInput(ev?.ends_at)} required />
            </div>
            <Field label="Location" name="location" defaultValue={ev?.location ?? "Masjid Omar, 4801 E Busch Blvd, Tampa, FL 33617"} maxLength={200} />
            <Field label="Description (safe Markdown)" name="description" rows={4} defaultValue={ev?.description_md} maxLength={8000} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Capacity (people)" name="capacity" type="number" min={1} defaultValue={ev?.capacity ?? ""} hint="Blank = no limit" />
              <SelectField label="Status" name="status" defaultValue={ev?.status ?? "draft"} options={[["draft", "Draft"], ["published", "Published"], ["cancelled", "Cancelled"], ["archived", "Archived"]]} />
              <Field label="Cancellation note" name="cancelNote" defaultValue={ev?.cancel_note} maxLength={300} />
            </div>
            <Check name="rsvpEnabled" label="RSVP open" defaultChecked={ev?.rsvp_enabled} />
            <Check name="waitlistEnabled" label="Waitlist when full" defaultChecked={ev?.waitlist_enabled} />
          </ActionForm>
          {ev && (
            <div className="mt-6 border-t border-pine/10 pt-4">
              <h3 className="font-bold text-pine">Registrations</h3>
              {!isAdmin ? (
                <p className="text-sm text-muted">Totals only. Individual registrations are visible to administrators.</p>
              ) : (
                <>
                  <p className="text-sm text-muted">Registrants are identified by reference only. Contact consent is shown per person.</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {(regs ?? []).map((r, i) => (
                      <li key={r.id}>#{i + 1} · {r.status} · party {r.party_size} · {r.contact_consent ? "may contact" : "no contact"} · {r.reminder_opt_in ? "reminder opt-in" : ""}</li>
                    ))}
                    {(regs ?? []).length === 0 && <li className="text-muted">No registrations yet.</li>}
                  </ul>
                  <a href={`/admin/export/registrations?event=${ev.id}`} className="btn btn-secondary mt-3 min-h-10 text-sm">Export CSV (admins only)</a>
                </>
              )}
            </div>
          )}
        </section>
      </div>
      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-pine">Programs</h2>
            <Link href="/admin/programs" className="btn btn-secondary min-h-10 text-sm">New program</Link>
          </div>
          <ul className="mt-3 divide-y divide-pine/10 text-sm">
            {(programs ?? []).map((p) => (
              <li key={p.id} className="flex items-center gap-2 py-3">
                <Link href={`/admin/programs?program=${p.id}`} className="flex-1 font-semibold text-pine hover:underline">{p.title}</Link>
                <SampleBadge show={p.is_sample} />
                <span className="badge bg-sage-100 text-pine">{p.status}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-6">
          <h2 className="font-display text-2xl text-pine">{prog ? "Edit program" : "New program"}</h2>
          <ActionForm action={saveProgram} submitLabel="Save program" className="mt-4 space-y-4" key={prog?.id ?? "new-prog"}>
            <input type="hidden" name="id" value={prog?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" name="title" defaultValue={prog?.title} required maxLength={140} />
              <Field label="Arabic title" name="titleAr" defaultValue={prog?.title_ar} maxLength={140} dir="rtl" />
              <Field label="Slug" name="slug" defaultValue={prog?.slug} required maxLength={80} />
              <SelectField label="Category" name="category" defaultValue={prog?.category ?? "class"} options={[["class", "Class"], ["family", "Family"], ["lecture", "Lecture"], ["youth", "Youth"], ["seasonal", "Seasonal"], ["community", "Community"], ["other", "Other"]]} />
              <Field label="Schedule note" name="scheduleNote" defaultValue={prog?.schedule_note} maxLength={200} />
              <Field label="Who it's for" name="audienceNote" defaultValue={prog?.audience_note} maxLength={200} />
            </div>
            <Field label="Summary" name="summary" defaultValue={prog?.summary} maxLength={400} />
            <Field label="Description (safe Markdown)" name="description" rows={4} defaultValue={prog?.description_md} maxLength={8000} />
            <SelectField label="Status" name="status" defaultValue={prog?.status ?? "draft"} options={[["draft", "Draft"], ["published", "Published"], ["archived", "Archived"]]} />
          </ActionForm>
        </section>
      </div>
    </div>
  );
}
