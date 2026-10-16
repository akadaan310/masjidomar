import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { loginMember } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth";
import { safeNext } from "@/lib/validation";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "/community");
  if (await getSessionUser()) redirect(next);
  return (
    <AuthShell title="Sign in" subtitle="Members of the community">
      {sp.error === "link" && (
        <p role="alert" className="mb-5 rounded-xl bg-warning-bg px-4 py-3 text-sm text-warning-ink">That link has expired or was already used. Please try again.</p>
      )}
      <LoginForm action={loginMember} next={next} portalLabel="Sign in" />
      <p className="mt-6 border-t border-pine/10 pt-5 text-center text-sm text-muted">
        New here? <Link href={`/signup`} className="font-semibold text-evergreen underline underline-offset-4">Create a free account</Link>
      </p>
      <p className="mt-3 text-center text-xs text-muted">
        Staff: <Link href="/imam/login" className="underline">Imam desk</Link> · <Link href="/admin/login" className="underline">Administration</Link>
      </p>
    </AuthShell>
  );
}
