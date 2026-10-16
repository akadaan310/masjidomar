import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "@/components/auth/AuthForms";
import { updatePassword } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPage() {
  const user = await getSessionUser();
  return (
    <AuthShell title="Choose a new password">
      {user ? (
        <ResetForm action={updatePassword} />
      ) : (
        <p className="text-sm text-muted">
          Open the reset link from your email to continue, or <Link href="/forgot-password" className="font-semibold text-evergreen underline">request a new one</Link>.
        </p>
      )}
    </AuthShell>
  );
}
