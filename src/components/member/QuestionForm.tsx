"use client";
import { useActionState } from "react";
import { SubmitButton, FormMessage, Honeypot } from "@/components/forms/SubmitButton";
import { submitQuestion } from "@/app/actions/member";

export function QuestionForm({ defaultLanguage }: { defaultLanguage: "en" | "ar" }) {
  const [state, action] = useActionState(submitQuestion, {});
  return (
    <form action={action} className="relative space-y-6" noValidate>
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="field-label">Topic</label>
          <select id="category" name="category" className="input" defaultValue="worship" required>
            <option value="worship">Worship &amp; prayer</option>
            <option value="family">Family &amp; relationships</option>
            <option value="new_muslim">New to Islam</option>
            <option value="community">Community &amp; masjid life</option>
            <option value="other">Something else</option>
          </select>
        </div>
        <div>
          <label htmlFor="language" className="field-label">Language for the reply</label>
          <select id="language" name="language" className="input" defaultValue={defaultLanguage}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="subject" className="field-label">Subject</label>
        <input id="subject" name="subject" required minLength={3} maxLength={140} className="input" aria-describedby="subject-hint" />
        <p id="subject-hint" className="field-hint">A few words. Please avoid names of other people.</p>
      </div>
      <div>
        <label htmlFor="body" className="field-label">Your question</label>
        <textarea id="body" name="body" required minLength={10} maxLength={5000} rows={8} className="input" />
      </div>
      <fieldset className="space-y-3 rounded-2xl bg-sand/50 p-5">
        <legend className="sr-only">Privacy preferences</legend>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="isSensitive" className="mt-1 size-5" />
          <span>
            <span className="font-semibold">This is sensitive.</span>{" "}
            <span className="text-sm text-muted">The subject and preview are hidden in the imam&apos;s inbox list until they open it.</span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="showName" className="mt-1 size-5" />
          <span>
            <span className="font-semibold">Show my display name to the imam.</span>{" "}
            <span className="text-sm text-muted">Unchecked: the imam sees &ldquo;Member (name private)&rdquo;.</span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="faqConsent" className="mt-1 size-5" />
          <span>
            <span className="font-semibold">The imam may consider a rewritten, anonymous version for the public Q&amp;A.</span>{" "}
            <span className="text-sm text-muted">Optional. Nothing is ever published automatically, and never with your words or identity.</span>
          </span>
        </label>
      </fieldset>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="acknowledge" required className="mt-1 size-5" />
        <span>
          I understand that replies come from a person, may take time, and are general guidance — not an emergency service, legal advice or medical
          advice.
        </span>
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Sending privately…">Send my question privately</SubmitButton>
    </form>
  );
}
