import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { loginAdmin } from "@/app/actions/auth";
import { safeNext } from "@/lib/validation";

export const metadata: Metadata = { title: "Administration sign in", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  return (
    <AuthShell title="Administration sign in" subtitle="Masjid staff only" tone="admin">
      <LoginForm action={loginAdmin} next={safeNext(sp.next, "/admin")} portalLabel="Sign in to the Administration" />
      <p className="mt-6 border-t border-pine/10 pt-5 text-center text-xs text-muted">
        Access is granted only by a masjid administrator. Accounts without this role are signed out with no staff data shown.
        <br />
        <Link href="/login" className="underline">Member sign in</Link>
      </p>
    </AuthShell>
  );
}
