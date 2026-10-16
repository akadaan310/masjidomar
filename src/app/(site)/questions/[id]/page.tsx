import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CATEGORY_LABELS, STATUS_META, StatusSteps } from "@/lib/questions";
import { ReplyForm, EditQuestionForm, EditMessageForm, ThreadLive } from "@/components/member/ThreadForms";
import { closeQuestion } from "@/app/actions/member";

export const metadata: Metadata = { title: "My question", robots: { index: false, follow: false } };

export default async function QuestionThreadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/questions/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();
  const supabase = await createClient();

  // RLS returns the row only to its owner (or an authorised imam). Others get "not found" — no existence leak.
  const { data: q } = await supabase
    .from("questions")
    .select("id, asker_id, subject, body, category, language, status, is_sensitive, show_name_to_imam, faq_consent, followups_allowed, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!q || q.asker_id !== user.id) notFound();

  await supabase.rpc("member_mark_read", { p_question_id: id });
  const { data: messages } = await supabase
    .from("question_messages")
    .select("id, author_kind, kind, body, created_at, published_at, edited_at, author_id")
    .eq("question_id", id)
    .eq("is_draft", false)
    .order("created_at");

  const list = messages ?? [];
  const imamReplied = list.some((m) => m.author_kind === "imam");
  const lastStaffAt = list.filter((m) => m.author_kind === "imam").map((m) => m.published_at ?? m.created_at).sort().pop();
  const canReply = q.status !== "closed" && (q.status !== "answered" || q.followups_allowed);
  const steps = StatusSteps(q.status);
  const fmt = (s: string) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(s));

  return (
    <div className="container-page max-w-4xl py-12">
      <ThreadLive questionId={id} />
      <Link href="/community" className="inline-flex items-center gap-2 text-sm font-semibold text-evergreen">
        <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" /> My questions
      </Link>
      {sp.sent && (
        <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-sage-100 p-4 font-semibold text-pine">
          <CheckCircle2 aria-hidden className="size-5" /> Your question was sent privately.
        </p>
      )}
      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={q.status} />
          <span className="text-sm text-muted">{CATEGORY_LABELS[q.category]}</span>
          {q.is_sensitive && <span className="badge bg-sand text-pine">Marked sensitive</span>}
        </div>
        <h1 className="font-display mt-3 text-3xl text-pine sm:text-4xl" dir="auto">{q.subject}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          <Lock aria-hidden className="size-4" /> Visible only to you and authorised imam staff. {STATUS_META[q.status]?.description}
        </p>
      </header>

      <ol aria-label="Progress" className="mt-6 grid grid-cols-4 gap-2">
        {steps.map((s) => (
          <li key={s.key} className={`rounded-full px-2 py-1.5 text-center text-xs font-bold ${s.done ? "bg-evergreen text-ivory" : "bg-sand text-muted"}`}>
            <span className="sr-only">{s.done ? "Completed: " : "Not yet: "}</span>
            {s.label}
          </li>
        ))}
      </ol>

      <section aria-label="Conversation" className="mt-8 space-y-5">
        <article className="card p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">You asked · {fmt(q.created_at)}</p>
          <div className="mt-3 whitespace-pre-wrap text-ink" dir="auto">{q.body}</div>
          {!imamReplied && q.status !== "closed" && <EditQuestionForm questionId={q.id} subject={q.subject} body={q.body} />}
        </article>
        {list.map((m) => {
          const fromImam = m.author_kind === "imam";
          const editable = !fromImam && (!lastStaffAt || (m.published_at ?? m.created_at) > lastStaffAt) && q.status !== "closed";
          return (
            <article key={m.id} className={`rounded-[1.25rem] p-6 ${fromImam ? "bg-evergreen text-ivory" : "card ms-6 sm:ms-16"}`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${fromImam ? "text-sage" : "text-muted"}`}>
                {fromImam ? (m.kind === "clarification_request" ? "Imam · asked for clarification" : m.kind === "answer" ? "Imam · reply" : "Imam") : "You"} ·{" "}
                {fmt(m.published_at ?? m.created_at)}
                {m.edited_at && " · edited"}
              </p>
              <div className="mt-3 whitespace-pre-wrap" dir="auto">{m.body}</div>
              {editable && <EditMessageForm questionId={q.id} messageId={m.id} body={m.body} />}
            </article>
          );
        })}
      </section>

      <section aria-label="Reply" className="mt-8">
        {canReply ? (
          <div className="card p-6">
            <ReplyForm
              questionId={q.id}
              label={q.status === "needs_clarification" ? "Reply to the imam's question" : q.status === "answered" ? "Respectful follow-up (optional)" : "Add more detail (optional)"}
            />
          </div>
        ) : (
          <p className="rounded-2xl bg-sand/60 p-5 text-sm text-muted">
            {q.status === "closed"
              ? "This conversation is closed. Your record is kept here. You're welcome to ask a new question."
              : "Follow-up messages are not enabled for this answer. You're welcome to ask a new question."}
          </p>
        )}
        {q.status !== "closed" && (
          <form action={closeQuestion} className="mt-4">
            <input type="hidden" name="questionId" value={q.id} />
            <button type="submit" className="btn btn-ghost text-sm">Close this conversation</button>
          </form>
        )}
      </section>
    </div>
  );
}
