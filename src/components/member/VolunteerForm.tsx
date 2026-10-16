"use client";
import { useActionState } from "react";
import { SubmitButton, FormMessage, Honeypot } from "@/components/forms/SubmitButton";
import { volunteerInquiry } from "@/app/actions/member";

export function VolunteerForm({ options }: { options: { id: string; title: string }[] }) {
  const [state, action] = useActionState(volunteerInquiry, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="relative space-y-4">
      <Honeypot />
      <div>
        <label htmlFor="opp" className="field-label">I&apos;m interested in</label>
        <select id="opp" name="opportunityId" className="input">
          <option value="">Anything that helps</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="msg" className="field-label">Anything you&apos;d like us to know? <span className="font-normal text-muted">(optional)</span></label>
        <textarea id="msg" name="message" rows={4} maxLength={1500} className="input" />
        <p className="field-hint">Skills, availability, languages. Please don&apos;t include sensitive personal information.</p>
      </div>
      <fieldset>
        <legend className="field-label">How should we reach you?</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="contactPreference" value="email" defaultChecked /> Email (your account address)</label>
          <label className="flex items-center gap-2"><input type="radio" name="contactPreference" value="in_person" /> In person at the masjid</label>
        </div>
      </fieldset>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-0.5 size-5" required />
        I agree that masjid administrators may contact me about volunteering. My interest is not shared with anyone else or shown publicly.
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Sending…">Express interest</SubmitButton>
    </form>
  );
}
