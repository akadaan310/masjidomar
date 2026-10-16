"use client";
import { useActionState } from "react";
import { SubmitButton, FormMessage } from "@/components/forms/SubmitButton";
import { updateProfile, requestDataAction } from "@/app/actions/member";

export function ProfileForm({
  displayName,
  language,
  prefs,
}: {
  displayName: string;
  language: "en" | "ar";
  prefs: { email_question_updates: boolean; email_announcements: boolean; email_event_reminders: boolean } | null;
}) {
  const [state, action] = useActionState(updateProfile, {});
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="displayName" className="field-label">Display name <span className="font-normal text-muted">(optional)</span></label>
        <input id="displayName" name="displayName" defaultValue={displayName} maxLength={60} className="input" />
      </div>
      <fieldset>
        <legend className="field-label">Language</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" name="language" value="en" defaultChecked={language === "en"} /> English</label>
          <label className="flex items-center gap-2" lang="ar"><input type="radio" name="language" value="ar" defaultChecked={language === "ar"} /> العربية</label>
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="field-label">Email notifications (opt-in)</legend>
        <label className="flex items-center gap-3"><input type="checkbox" name="emailQuestionUpdates" defaultChecked={prefs?.email_question_updates} className="size-5" /> When the imam replies to my question</label>
        <label className="flex items-center gap-3"><input type="checkbox" name="emailEventReminders" defaultChecked={prefs?.email_event_reminders} className="size-5" /> Reminders for gatherings I RSVP to</label>
        <label className="flex items-center gap-3"><input type="checkbox" name="emailAnnouncements" defaultChecked={prefs?.email_announcements} className="size-5" /> Important masjid announcements</label>
        <p className="field-hint">
          Your choices are saved now. Email delivery starts only after the masjid connects an email provider — until then no messages are sent.
        </p>
      </fieldset>
      <FormMessage state={state} />
      <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
    </form>
  );
}

export function DataRequestForm() {
  const [state, action] = useActionState(requestDataAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kind" value="deletion" />
      <label htmlFor="confirm" className="field-label">Type DELETE to request permanent deletion of your account and questions</label>
      <input id="confirm" name="confirm" className="input max-w-xs" autoComplete="off" />
      <FormMessage state={state} />
      <SubmitButton className="btn btn-danger" pendingText="Recording…">Request account deletion</SubmitButton>
    </form>
  );
}
