"use client";
import { useActionState, useState } from "react";
import { SubmitButton, FormMessage } from "@/components/forms/SubmitButton";
import type { FormState } from "@/app/actions/auth";

/**
 * Generic form bound to a server action returning FormState. Shows pending, success and error
 * states. Server actions re-validate input and re-check authorization on every call.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingText = "Saving…",
  className = "space-y-4",
  buttonClassName = "btn btn-primary",
  resetOnSuccess = false,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children?: React.ReactNode;
  submitLabel: React.ReactNode;
  pendingText?: string;
  className?: string;
  buttonClassName?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const [seen, setSeen] = useState<FormState>(state);
  const [generation, setGeneration] = useState(0);
  if (state !== seen) {
    setSeen(state);
    if (resetOnSuccess && state.ok) setGeneration((g) => g + 1);
  }
  return (
    <form action={formAction} className={className} key={generation}>
      {children}
      <FormMessage state={state} />
      <SubmitButton className={buttonClassName} pendingText={pendingText}>
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
