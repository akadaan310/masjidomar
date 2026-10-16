import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, NotebookPen, ShieldAlert } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CATEGORY_LABELS } from "@/lib/questions";
import { ActionForm } from "@/components/forms/ActionForm";
import { DraftEditor } from "@/components/staff/DraftEditor";
import { imamAcknowledge, imamAddNote, imamClaim, imamDiscardDraft, imamProposeFaq, imamSetStatus } from "@/app/actions/imam";
import { getSiteSettings } from "@/lib/site";

export const metadata: Metadata = { title: "Question" };

export default async function ImamQuestion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const user = await getSessionUser();
  const { data: q } = await supabase
    .from("questions")
    .select("id, subject, body, category, language, status, is_sensitive, faq_consent, followups_allowed, assigned_imam_id, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!q) notFound(); // RLS: not assigned / not in shared queue → not visible.

  const [{ data: messages }, { data: notes }, { data: asker }, { data: history }, { settings }] = await Promise.all([
    supabase.from("question_messages").select("id, author_kind, kind, body, is_draft, author_id, created_at, published_at, read_by_member_at").eq("question_id", id).order("created_at"),
    supabase.from("question_internal_notes").select("id, body, created_at, author_id").eq("question_id", id).order("created_at"),
    supabase.rpc("imam_question_asker_label", { p_question_id: id }),
    supabase.from("question_status_history").select("from_status, to_status, changed_by_kind, created_at").eq("question_id", id).order("created_at"),
    getSiteSettings(),
  ]);
  const sent = (messages ?? []).filter((m) => !m.is_draft);
  const myDraft = (messages ?? []).find((m) => m.is_draft && m.author_id === user?.id) ?? null;
  const fmt = (s: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(s));
  const unassigned = !q.assigned_imam_id;
  // Only offer "Discard draft" when the database function is installed (PGRST202 = function not found).
  const canDiscard = myDraft
    ? (await supabase.rpc("imam_discard_draft", { p_question_id: "00000000-0000-0000-0000-000000000000" })).error?.code !== "PGRST202"
    : false;

  return (
    <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <Link href="/imam" className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
          <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" /> Inbox
        </Link>
        <header>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={q.status} />
            <span className="text-sm text-muted">{CATEGORY_LABELS[q.category]} · reply in {q.language === "ar" ? "Arabic" : "English"} · from {asker}</span>
            {q.is_sensitive && <span className="badge bg-warning-bg text-warning-ink"><ShieldAlert aria-hidden className="size-3" /> Sensitive</span>}
          </div>
          <h1 className="font-display mt-3 text-3xl text-navy" dir="auto">{q.subject}</h1>
        </header>

        {q.is_sensitive && (
          <div className="rounded-2xl border-s-4 border-brass bg-warning-bg p-4 text-sm text-warning-ink">
            Marked sensitive by the asker. If this involves risk of harm, a medical or legal matter, gently point to qualified professionals and
            emergency services (911 / 988).{settings.support_escalation_url && <> Escalation resources: <a className="underline" href={settings.support_escalation_url}>configured link</a>.</>}
          </div>
        )}

        <article className="card p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Question · {fmt(q.created_at)}</p>
          <div className="mt-3 whitespace-pre-wrap" dir="auto">{q.body}</div>
        </article>
        {sent.map((m) => (
          <article key={m.id} className={`rounded-[1.25rem] p-6 ${m.author_kind === "imam" ? "bg-navy text-ivory" : "card"}`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${m.author_kind === "imam" ? "text-sage" : "text-muted"}`}>
              {m.author_kind === "imam" ? `Imam · ${m.kind.replace("_", " ")}` : "Asker"} · {fmt(m.published_at ?? m.created_at)}
              {m.author_kind === "imam" && (m.read_by_member_at ? " · read" : " · not yet read")}
            </p>
            <div className="mt-3 whitespace-pre-wrap" dir="auto">{m.body}</div>
          </article>
        ))}

        <section aria-labelledby="compose" className="card p-6">
          <h2 id="compose" className="font-display text-2xl text-navy">Your reply</h2>
          {q.status === "closed" ? (
            <p className="mt-3 text-muted">This question is closed. Reopen it to reply.</p>
          ) : (
            <div className="mt-4">
              <DraftEditor questionId={q.id} draft={myDraft ? { body: myDraft.body, kind: myDraft.kind } : null} />
              {myDraft && canDiscard && (
                <form action={imamDiscardDraft} className="mt-3">
                  <input type="hidden" name="questionId" value={q.id} />
                  <button type="submit" className="btn btn-ghost text-sm">Discard draft</button>
                </form>
              )}
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card space-y-3 p-6" aria-labelledby="actions">
          <h2 id="actions" className="font-bold text-navy">Workflow</h2>
          {unassigned && (
            <ActionForm action={imamClaim} submitLabel="Assign to me" buttonClassName="btn btn-secondary w-full">
              <input type="hidden" name="questionId" value={q.id} />
            </ActionForm>
          )}
          {q.status === "submitted" && (
            <ActionForm action={imamAcknowledge} submitLabel="Acknowledge receipt" buttonClassName="btn btn-primary w-full">
              <input type="hidden" name="questionId" value={q.id} />
            </ActionForm>
          )}
          <ActionForm action={imamSetStatus} submitLabel={q.status === "closed" ? "Reopen" : "Close question"} buttonClassName="btn btn-secondary w-full">
            <input type="hidden" name="questionId" value={q.id} />
            <input type="hidden" name="status" value={q.status === "closed" ? "acknowledged" : "closed"} />
          </ActionForm>
        </section>

        <section className="card p-6" aria-labelledby="notes">
          <h2 id="notes" className="flex items-center gap-2 font-bold text-navy">
            <NotebookPen aria-hidden className="size-4" /> Internal notes
          </h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Lock aria-hidden className="size-3" /> Staff only — never shown to the asker.</p>
          <ul className="mt-3 space-y-3 text-sm">
            {(notes ?? []).map((n) => (
              <li key={n.id} className="rounded-xl bg-sand/60 p-3">
                <span className="block text-xs text-muted">{fmt(n.created_at)}</span>
                <span className="whitespace-pre-wrap">{n.body}</span>
              </li>
            ))}
          </ul>
          <ActionForm action={imamAddNote} submitLabel="Add note" buttonClassName="btn btn-secondary" className="mt-3 space-y-2" resetOnSuccess>
            <input type="hidden" name="questionId" value={q.id} />
            <label htmlFor="note-body" className="sr-only">New internal note</label>
            <textarea id="note-body" name="body" rows={3} maxLength={4000} className="input min-h-0" />
          </ActionForm>
        </section>

        <section className="card p-6" aria-labelledby="faq">
          <h2 id="faq" className="font-bold text-navy">Propose an anonymised FAQ</h2>
          {q.faq_consent ? (
            <ActionForm action={imamProposeFaq} submitLabel="Propose for review" buttonClassName="btn btn-secondary" className="mt-3 space-y-3" resetOnSuccess>
              <input type="hidden" name="questionId" value={q.id} />
              <input type="hidden" name="language" value={q.language} />
              <label className="field-label" htmlFor="fq">Rewritten general question</label>
              <textarea id="fq" name="questionText" rows={2} maxLength={600} className="input min-h-0" />
              <label className="field-label" htmlFor="fa">Answer for the public</label>
              <textarea id="fa" name="answer" rows={5} maxLength={8000} className="input" />
              <label className="field-label" htmlFor="fc">Category</label>
              <select id="fc" name="category" className="input" defaultValue={q.category}>
                {["worship", "family", "new_muslim", "community", "visiting", "other"].map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="anonymised" className="mt-1 size-5" /> Rewritten in general terms; no names, places or details that could identify anyone.
              </label>
            </ActionForm>
          ) : (
            <p className="mt-2 text-sm text-muted">The asker did not consent to an FAQ version. This question stays private.</p>
          )}
        </section>

        <section className="card p-6" aria-labelledby="hist">
          <h2 id="hist" className="font-bold text-navy">Status history</h2>
          <ol className="mt-3 space-y-1 text-sm text-muted">
            {(history ?? []).map((h, i) => (
              <li key={i}>{fmt(h.created_at)} — {h.from_status ?? "new"} → {h.to_status} ({h.changed_by_kind})</li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}
