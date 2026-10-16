import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pageGuard } from "@/components/staff/guard";
import { ActionForm } from "@/components/forms/ActionForm";
import { Field, SelectField, Check, toLocalInput } from "@/components/staff/Field";
import { saveAnnouncement, deleteAnnouncement } from "@/app/actions/admin";
import { SampleBadge } from "@/components/ui/SampleBadge";

export const metadata: Metadata = { title: "Announcements · Administration" };

function requestTime() {
  return Date.now();
}

function publicationState(status: string, publishAt: string, expiresAt: string | null, now: number) {
  if (status !== "published") return status;
  if (new Date(publishAt).getTime() > now) return "scheduled";
  if (expiresAt && new Date(expiresAt).getTime() < now) return "expired";
  return "live";
}

export default async function AdminAnnouncements({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const denied = await pageGuard(["admin", "editor"], "announcements");
  if (denied) return denied;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: list } = await supabase.from("announcements").select("*").order("publish_at", { ascending: false }).limit(100);
  const editing = (list ?? []).find((a) => a.id === sp.edit) ?? null;
  const stateOf = (a: NonNullable<typeof list>[number]) => publicationState(a.status, a.publish_at, a.expires_at, requestTime());

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr] [&>*]:min-w-0">
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-pine">Announcements</h1>
          <Link href="/admin/announcements" className="btn btn-secondary min-h-10 text-sm">New</Link>
        </div>
        <ul className="mt-4 divide-y divide-pine/10">
          {(list ?? []).map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2 py-3">
              <Link href={`/admin/announcements?edit=${a.id}`} className="min-w-0 flex-1 font-semibold text-pine hover:underline">{a.title}</Link>
              <SampleBadge show={a.is_sample} />
              {a.urgency === "urgent" && <span className="badge bg-brass text-pine">urgent</span>}
              <span className="badge bg-sand text-pine">{a.audience}</span>
              <span className="badge bg-sage-100 text-pine">{stateOf(a)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="card p-6" aria-labelledby="ed">
        <h2 id="ed" className="font-display text-2xl text-pine">{editing ? "Edit announcement" : "New announcement"}</h2>
        <ActionForm action={saveAnnouncement} submitLabel="Save" className="mt-4 space-y-4" key={editing?.id ?? "new"}>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" name="title" defaultValue={editing?.title} maxLength={140} required />
            <Field label="Arabic title (optional)" name="titleAr" defaultValue={editing?.title_ar} maxLength={140} dir="rtl" />
          </div>
          <Field label="URL slug" name="slug" defaultValue={editing?.slug} maxLength={80} hint="lowercase-words-with-dashes" required />
          <Field label="Body (safe Markdown: **bold**, *italic*, - lists, [links](https://…))" name="body" rows={6} defaultValue={editing?.body_md} maxLength={8000} />
          <Field label="Arabic body (optional)" name="bodyAr" rows={4} defaultValue={editing?.body_ar_md} maxLength={8000} dir="rtl" />
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField label="Audience" name="audience" defaultValue={editing?.audience ?? "public"} options={[["public", "Everyone"], ["members", "Signed-in members"], ["staff", "Staff only"]]} />
            <SelectField label="Urgency" name="urgency" defaultValue={editing?.urgency ?? "normal"} options={[["normal", "Normal"], ["urgent", "Urgent (highlighted)"]]} />
            <SelectField label="Status" name="status" defaultValue={editing?.status ?? "draft"} options={[["draft", "Draft"], ["published", "Published"], ["archived", "Archived"]]} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Publish at (Eastern)" name="publishAt" type="datetime-local" defaultValue={toLocalInput(editing?.publish_at)} hint="Future time = scheduled publishing." />
            <Field label="Expires at (optional)" name="expiresAt" type="datetime-local" defaultValue={toLocalInput(editing?.expires_at)} />
          </div>
          <Check name="showOnDisplay" label="Show on the masjid screen (public announcements only)" defaultChecked={editing?.show_on_display ?? true} />
        </ActionForm>
        {editing && (
          <form action={deleteAnnouncement} className="mt-4">
            <input type="hidden" name="id" value={editing.id} />
            <button className="btn btn-ghost text-sm text-danger">Delete permanently</button>
          </form>
        )}
      </section>
    </div>
  );
}
