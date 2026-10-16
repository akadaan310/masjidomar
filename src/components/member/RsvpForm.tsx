"use client";
import { useActionState } from "react";
import { SubmitButton, FormMessage } from "@/components/forms/SubmitButton";
import { rsvp } from "@/app/actions/member";

export function RsvpForm({ eventId, path, full, waitlist }: { eventId: string; path: string; full: boolean; waitlist: boolean }) {
  const [state, action] = useActionState(rsvp, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="path" value={path} />
      <div>
        <label htmlFor="partySize" className="field-label">How many people (including you)?</label>
        <select id="partySize" name="partySize" className="input max-w-32" defaultValue="1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="contactConsent" className="mt-0.5 size-5" /> The organisers may email me about changes to this gathering.
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="reminderOptIn" className="mt-0.5 size-5" /> I&apos;d like a reminder (sent only once the masjid enables email).
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Saving…">{full && waitlist ? "Join the waitlist" : "RSVP"}</SubmitButton>
    </form>
  );
}
