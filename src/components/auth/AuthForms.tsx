"use client";
import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton, FormMessage, Honeypot } from "@/components/forms/SubmitButton";
import type { FormState } from "@/app/actions/auth";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function LoginForm({ action, next, portalLabel }: { action: Action; next: string; portalLabel: string }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="relative space-y-5" noValidate>
      <Honeypot />
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-primary w-full" pendingText="Signing in…">{portalLabel}</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/forgot-password" className="font-semibold text-evergreen underline underline-offset-4">Forgot your password?</Link>
      </p>
    </form>
  );
}

export function SignupForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={formAction} className="relative space-y-5" noValidate>
      <Honeypot />
      <div>
        <label htmlFor="displayName" className="field-label">What should we call you? <span className="font-normal text-muted">(optional)</span></label>
        <input id="displayName" name="displayName" maxLength={60} autoComplete="nickname" className="input" />
        <p className="field-hint">A first name or nickname is fine. We never ask for your full legal name.</p>
      </div>
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} className="input" aria-describedby="pw-hint" />
        <p id="pw-hint" className="field-hint">At least 10 characters, with upper- and lowercase letters and a number.</p>
      </div>
      <fieldset>
        <legend className="field-label">Preferred language</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" name="language" value="en" defaultChecked /> English</label>
          <label className="flex items-center gap-2" lang="ar"><input type="radio" name="language" value="ar" /> العربية</label>
        </div>
      </fieldset>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-1 size-5" required />
        <span>
          I have read the <Link href="/privacy" className="font-semibold text-evergreen underline">privacy notice</Link>. I understand my account
          stores only my email, an optional name and my language preference.
        </span>
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-primary w-full" pendingText="Creating account…">Create account</SubmitButton>
    </form>
  );
}

export function ForgotForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-primary w-full" pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}

export function ResetForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, {});
  if (state.ok)
    return (
      <div className="space-y-4">
        <FormMessage state={state} />
        <Link href="/community" className="btn btn-primary">Continue</Link>
      </div>
    );
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <label htmlFor="password" className="field-label">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required className="input" />
      </div>
      <div>
        <label htmlFor="confirm" className="field-label">Confirm new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-primary w-full" pendingText="Saving…">Update password</SubmitButton>
    </form>
  );
}
