import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "@/components/auth/AuthForms";
import { requestPasswordReset } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <AuthShell title="Reset your password">
      <p className="mb-6 text-sm text-muted">Enter your account email and we&apos;ll send a secure link to choose a new password.</p>
      <ForgotForm action={requestPasswordReset} />
    </AuthShell>
  );
}
