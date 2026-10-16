import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/forms/ActionForm";
import { imamProposeFaq } from "@/app/actions/imam";
import { CATEGORY_LABELS } from "@/lib/questions";

export const metadata: Metadata = { title: "FAQ proposals" };

export default async function ImamFaq() {
  const supabase = await createClient();
  const { data } = await supabase.from("faq_proposals").select("id, question_text, status, review_note, created_at, source_question_id").order("created_at", { ascending: false }).limit(50);
  return (
    <div className="grid gap-8 lg:grid-cols-2 [&>*]:min-w-0">
      <section className="card p-6">
        <h1 className="font-display text-3xl text-navy">FAQ proposals</h1>
        <p className="mt-1 text-sm text-muted">Proposals are reviewed by a moderator before anything appears publicly.</p>
        <ul className="mt-5 divide-y divide-pine/10">
          {(data ?? []).length === 0 && <li className="py-3 text-muted">No proposals yet.</li>}
          {(data ?? []).map((p) => (
            <li key={p.id} className="py-3">
              <p className="font-semibold text-navy">{p.question_text}</p>
              <p className="text-sm text-muted">
                {p.status} · {p.source_question_id ? "from a consenting question" : "general"} {p.review_note && `· ${p.review_note}`}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section className="card p-6">
        <h2 className="font-display text-2xl text-navy">Write a general FAQ entry</h2>
        <ActionForm action={imamProposeFaq} submitLabel="Propose for review" className="mt-4 space-y-3" resetOnSuccess>
          <input type="hidden" name="questionId" value="" />
          <label className="field-label" htmlFor="q">Question</label>
          <textarea id="q" name="questionText" rows={2} maxLength={600} className="input min-h-0" />
          <label className="field-label" htmlFor="a">Answer</label>
          <textarea id="a" name="answer" rows={8} maxLength={8000} className="input" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="c">Category</label>
              <select id="c" name="category" className="input">
                {["worship", "family", "new_muslim", "community", "visiting", "other"].map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="l">Language</label>
              <select id="l" name="language" className="input"><option value="en">English</option><option value="ar">العربية</option></select>
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="anonymised" className="mt-1 size-5" /> Contains no identifying details.</label>
        </ActionForm>
      </section>
    </div>
  );
}
