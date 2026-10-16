"use client";
import { useState } from "react";
import { ActionForm } from "@/components/forms/ActionForm";
import { imamSaveDraft, imamSendDraft } from "@/app/actions/imam";

export function DraftEditor({ questionId, draft }: { questionId: string; draft: { body: string; kind: string } | null }) {
  const [body, setBody] = useState(draft?.body ?? "");
  const [kind, setKind] = useState(draft?.kind ?? "answer");
  return (
    <div className="space-y-6">
      <ActionForm action={imamSaveDraft} submitLabel="Save draft" buttonClassName="btn btn-secondary" className="space-y-4">
        <input type="hidden" name="questionId" value={questionId} />
        <fieldset>
          <legend className="field-label">Type of message</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            {[
              ["answer", "Answer"],
              ["clarification_request", "Ask for clarification"],
              ["message", "Note to asker (no status change)"],
            ].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2">
                <input type="radio" name="kind" value={v} checked={kind === v} onChange={() => setKind(v)} /> {l}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="draft-body" className="field-label">Draft (visible only to you until sent)</label>
          <textarea id="draft-body" name="body" rows={10} maxLength={8000} value={body} onChange={(e) => setBody(e.target.value)} className="input" dir="auto" />
          <p className="field-hint">{body.length}/8000 · Written by you. This system never generates religious answers.</p>
        </div>
      </ActionForm>

      {draft && (
        <div className="rounded-2xl border border-navy/20 bg-navy/5 p-5">
          <h3 className="font-bold text-navy">Preview — exactly what the asker will see</h3>
          <div className="mt-3 rounded-[1.25rem] bg-evergreen p-5 text-ivory">
            <p className="text-xs font-bold uppercase tracking-wider text-sage">
              Imam · {draft.kind === "clarification_request" ? "asked for clarification" : draft.kind === "answer" ? "reply" : "note"}
            </p>
            <div className="mt-2 whitespace-pre-wrap" dir="auto">{draft.body}</div>
          </div>
          {draft.body !== body && <p className="mt-2 text-sm font-semibold text-warning-ink">You have unsaved edits — save the draft to update the preview.</p>}
          <ActionForm action={imamSendDraft} submitLabel="Send to asker only" pendingText="Sending…" className="mt-4 space-y-3">
            <input type="hidden" name="questionId" value={questionId} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="allowFollowups" defaultChecked className="size-5" /> Allow the asker to send a respectful follow-up
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="confirm" className="size-5" /> I have reviewed this reply. It goes privately to the asker — it is not published.
            </label>
          </ActionForm>
        </div>
      )}
    </div>
  );
}
