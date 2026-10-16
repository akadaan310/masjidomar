"use client";
import { useActionState } from "react";
import { SubmitButton, FormMessage } from "@/components/forms/SubmitButton";
import { breakGlassOpen, type BreakGlassState } from "@/app/actions/admin";

export function BreakGlass({ questionId }: { questionId: string }) {
  const [state, action] = useActionState<BreakGlassState, FormData>(breakGlassOpen, {});
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer font-semibold text-danger">Exceptional access…</summary>
      {state.content ? (
        <div className="mt-3 rounded-xl border-2 border-danger/30 p-4">
          <FormMessage state={state} />
          <p className="mt-3 font-bold" dir="auto">{state.content.subject}</p>
          <p className="mt-2 whitespace-pre-wrap" dir="auto">{state.content.body}</p>
        </div>
      ) : (
        <form action={action} className="mt-3 space-y-2">
          <input type="hidden" name="id" value={questionId} />
          <p className="text-muted">Use only for safeguarding, legal or abuse review. Your name, the time and your reason are permanently recorded.</p>
          <label className="field-label" htmlFor={`r-${questionId}`}>Reason</label>
          <textarea id={`r-${questionId}`} name="reason" rows={2} maxLength={300} className="input min-h-0" />
          <FormMessage state={state} />
          <SubmitButton className="btn btn-danger min-h-10" pendingText="Recording…">Open and record access</SubmitButton>
        </form>
      )}
    </details>
  );
}
