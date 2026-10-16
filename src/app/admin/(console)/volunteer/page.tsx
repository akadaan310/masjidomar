import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { pageGuard } from "@/components/staff/guard";
import { ActionForm } from "@/components/forms/ActionForm";
import { Field, SelectField } from "@/components/staff/Field";
import { saveOpportunity, setInquiryStatus } from "@/app/actions/admin";
import { SampleBadge } from "@/components/ui/SampleBadge";

export const metadata: Metadata = { title: "Volunteering · Administration" };

export default async function AdminVolunteer({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const denied = await pageGuard(["admin", "editor"], "volunteering");
  if (denied) return denied;
  const sp = await searchParams;
  const user = await getSessionUser();
  const isAdmin = Boolean(user?.roles.includes("admin"));
  const supabase = await createClient();
  const [{ data: opps }, inquiries] = await Promise.all([
    supabase.from("volunteer_opportunities").select("*").order("created_at", { ascending: false }),
    isAdmin
      ? supabase.from("volunteer_inquiries").select("id, opportunity_id, message, contact_preference, status, created_at, volunteer_inquiry_notes(body, created_at)").order("created_at", { ascending: false }).limit(50)
      : Promise.resolve({ data: null }),
  ]);
  const editing = (opps ?? []).find((o) => o.id === sp.edit) ?? null;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-pine">Volunteering</h1>
      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-pine">Opportunities</h2>
            <Link href="/admin/volunteer" className="btn btn-secondary min-h-10 text-sm">New</Link>
          </div>
          <ul className="mt-3 divide-y divide-pine/10 text-sm">
            {(opps ?? []).map((o) => (
              <li key={o.id} className="flex items-center gap-2 py-3">
                <Link href={`/admin/volunteer?edit=${o.id}`} className="flex-1 font-semibold text-pine hover:underline">{o.title}</Link>
                <SampleBadge show={o.is_sample} />
                <span className="badge bg-sage-100 text-pine">{o.status}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-6">
          <h2 className="font-display text-2xl text-pine">{editing ? "Edit opportunity" : "New opportunity"}</h2>
          <ActionForm action={saveOpportunity} submitLabel="Save" className="mt-4 space-y-4" key={editing?.id ?? "new"}>
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <Field label="Title" name="title" defaultValue={editing?.title} maxLength={140} required />
            <Field label="Arabic title" name="titleAr" defaultValue={editing?.title_ar} maxLength={140} dir="rtl" />
            <Field label="Description" name="description" rows={4} defaultValue={editing?.description_md} maxLength={4000} />
            <Field label="Time commitment" name="commitment" defaultValue={editing?.commitment} maxLength={200} />
            <SelectField label="Status" name="status" defaultValue={editing?.status ?? "draft"} options={[["draft", "Draft"], ["published", "Published"], ["archived", "Archived"]]} />
          </ActionForm>
        </section>
      </div>
      {isAdmin && (
        <section className="card p-6">
          <h2 className="font-display text-2xl text-pine">Interest received</h2>
          <p className="text-sm text-muted">Visible to administrators only. Contact people through their account email and only for the purpose they agreed to.</p>
          <ul className="mt-4 space-y-4">
            {(inquiries.data ?? []).length === 0 && <li className="text-muted">No inquiries yet.</li>}
            {(inquiries.data ?? []).map((i) => (
              <li key={i.id} className="rounded-2xl border border-pine/10 p-4 text-sm">
                <p className="text-muted">
                  {new Date(i.created_at).toLocaleDateString("en-US")} · {(opps ?? []).find((o) => o.id === i.opportunity_id)?.title ?? "General"} · prefers {i.contact_preference.replace("_", " ")} · <strong>{i.status}</strong>
                </p>
                {i.message && <p className="mt-1 whitespace-pre-wrap">{i.message}</p>}
                {(i.volunteer_inquiry_notes ?? []).map((n, k) => <p key={k} className="mt-1 rounded bg-sand/60 px-2 py-1 text-xs">Staff note: {n.body}</p>)}
                <ActionForm action={setInquiryStatus} submitLabel="Update" buttonClassName="btn btn-secondary min-h-9 text-xs" className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={i.id} />
                  <SelectField label="Status" name="status" defaultValue={i.status} options={[["new", "New"], ["contacted", "Contacted"], ["closed", "Closed"]]} />
                  <Field label="Admin note (optional)" name="note" maxLength={2000} />
                </ActionForm>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
