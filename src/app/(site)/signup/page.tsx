import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/AuthForms";
import { signup } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function SignupPage() {
  return (
    <AuthShell title="Create an account" subtitle="Free · only what's needed">
      <p className="mb-6 text-sm text-muted">
        An account lets you ask the imam privately, RSVP to gatherings and save resources. We don&apos;t ask for your gender, sect,
        address, date of birth or legal name. Accounts are for adults; please don&apos;t register children.
      </p>
      <SignupForm action={signup} />
      <p className="mt-6 border-t border-pine/10 pt-5 text-center text-sm text-muted">
        Already have an account? <Link href="/login" className="font-semibold text-evergreen underline underline-offset-4">Sign in</Link>
      </p>
    </AuthShell>
  );
}
