import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pageGuard } from "@/components/staff/guard";
import { ActionForm } from "@/components/forms/ActionForm";
import { Field, SelectField } from "@/components/staff/Field";
import { reviewFaqProposal, saveFaq } from "@/app/actions/admin";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { CATEGORY_LABELS } from "@/lib/questions";

export const metadata: Metadata = { title: "Q&A moderation · Administration" };

export default async function AdminFaq({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const denied = await pageGuard(["admin", "moderator"], "Q&A moderation");
  if (denied) return denied;
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: proposals }, { data: faq }] = await Promise.all([
    supabase.from("faq_proposals").select("id, question_text, answer_md, category, language, status, created_at, source_question_id").order("created_at", { ascending: false }).limit(50),
    supabase.from("public_faq").select("*").order("sort_order"),
  ]);
  const editing = (faq ?? []).find((f) => f.id === sp.edit) ?? null;
  const pending = (proposals ?? []).filter((p) => p.status === "proposed");
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl text-pine">Q&amp;A moderation</h1>
        <p className="text-muted">Imams write and propose; moderators publish. Private questions are never published directly.</p>
      </header>
      <section className="card p-6">
        <h2 className="font-display text-2xl text-pine">Awaiting review ({pending.length})</h2>
        {pending.length === 0 && <p className="mt-2 text-muted">Nothing to review.</p>}
        <ul className="mt-4 space-y-5">
          {pending.map((p) => (
            <li key={p.id} className="rounded-2xl border border-pine/10 p-5">
              <p className="text-xs text-muted">{CATEGORY_LABELS[p.category]} · {p.language} · {p.source_question_id ? "from a question whose asker consented" : "general entry"}</p>
              <p className="mt-1 font-bold text-pine">{p.question_text}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{p.answer_md}</p>
              <ActionForm action={reviewFaqProposal} submitLabel="Submit decision" buttonClassName="btn btn-secondary min-h-10" className="mt-4 flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={p.id} />
                <SelectField label="Decision" name="decision" options={[["approve", "Approve & publish"], ["reject", "Reject"]]} />
                <Field label="Note to imam (optional)" name="note" maxLength={600} />
              </ActionForm>
            </li>
          ))}
        </ul>
      </section>
      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <section className="card p-6">
          <h2 className="font-display text-2xl text-pine">Public FAQ</h2>
          <ul className="mt-3 divide-y divide-pine/10 text-sm">
            {(faq ?? []).map((f) => (
              <li key={f.id} className="flex items-center gap-2 py-3">
                <Link href={`/admin/faq?edit=${f.id}`} className="flex-1 font-semibold text-pine hover:underline">{f.question}</Link>
                <SampleBadge show={f.is_sample} />
                <span className="badge bg-sage-100 text-pine">{f.status}</span>
              </li>
            ))}
          </ul>
        </section>
        {editing && (
          <section className="card p-6">
            <h2 className="font-display text-2xl text-pine">Edit entry</h2>
            <ActionForm action={saveFaq} submitLabel="Save" className="mt-4 space-y-4" key={editing.id}>
              <input type="hidden" name="id" value={editing.id} />
              <Field label="Question" name="question" defaultValue={editing.question} rows={2} maxLength={600} />
              <Field label="Answer" name="answer" defaultValue={editing.answer_md} rows={6} maxLength={8000} hint="Changing the answer returns it to draft until an imam re-approves." />
              <div className="grid gap-4 sm:grid-cols-3">
                <SelectField label="Category" name="category" defaultValue={editing.category} options={Object.entries(CATEGORY_LABELS) as [string, string][]} />
                <SelectField label="Language" name="language" defaultValue={editing.language} options={[["en", "English"], ["ar", "Arabic"]]} />
                <SelectField label="Status" name="status" defaultValue={editing.status} options={[["published", "Published"], ["draft", "Unpublished"], ["archived", "Archived"]]} />
              </div>
            </ActionForm>
          </section>
        )}
      </div>
    </div>
  );
}
