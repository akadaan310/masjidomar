"use client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SubmitButton, FormMessage } from "@/components/forms/SubmitButton";
import { replyToQuestion, editQuestion, editMessage } from "@/app/actions/member";
import { createClient } from "@/lib/supabase/client";

export function ReplyForm({ questionId, label }: { questionId: string; label: string }) {
  const [state, action] = useActionState(replyToQuestion, {});
  const [key, setKey] = useState(0);
  const [lastOk, setLastOk] = useState<typeof state | null>(null);
  if (state.ok && state !== lastOk) {
    setLastOk(state);
    setKey((k) => k + 1);
  }
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="questionId" value={questionId} />
      <label htmlFor="reply-body" className="field-label">{label}</label>
      <textarea key={key} id="reply-body" name="body" required maxLength={8000} rows={5} className="input" />
      <FormMessage state={state} />
      <SubmitButton pendingText="Sending…">Send privately</SubmitButton>
    </form>
  );
}

export function EditQuestionForm({ questionId, subject, body }: { questionId: string; subject: string; body: string }) {
  const [state, action] = useActionState(editQuestion, {});
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-sm font-semibold text-evergreen">Correct your question (before the imam replies)</summary>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="questionId" value={questionId} />
        <label className="field-label" htmlFor="eq-subject">Subject</label>
        <input id="eq-subject" name="subject" defaultValue={subject} maxLength={140} className="input" />
        <label className="field-label" htmlFor="eq-body">Question</label>
        <textarea id="eq-body" name="body" defaultValue={body} maxLength={5000} rows={6} className="input" />
        <FormMessage state={state} />
        <SubmitButton pendingText="Saving…">Save correction</SubmitButton>
      </form>
    </details>
  );
}

export function EditMessageForm({ questionId, messageId, body }: { questionId: string; messageId: string; body: string }) {
  const [state, action] = useActionState(editMessage, {});
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs font-semibold text-evergreen">Edit</summary>
      <form action={action} className="mt-2 space-y-2">
        <input type="hidden" name="questionId" value={questionId} />
        <input type="hidden" name="messageId" value={messageId} />
        <label className="sr-only" htmlFor={`em-${messageId}`}>Edit message</label>
        <textarea id={`em-${messageId}`} name="body" defaultValue={body} maxLength={8000} rows={4} className="input" />
        <FormMessage state={state} />
        <SubmitButton className="btn btn-secondary min-h-10 text-sm" pendingText="Saving…">Save</SubmitButton>
      </form>
    </details>
  );
}

/** Live updates for the member's OWN thread. RLS on question_messages filters every event. */
export function ThreadLive({ questionId }: { questionId: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`thread-${questionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "question_messages", filter: `question_id=eq.${questionId}` }, () => router.refresh())
      .subscribe();
    const id = setInterval(() => router.refresh(), 60_000);
    return () => {
      clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, [questionId, router]);
  return null;
}
