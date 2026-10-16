import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { signOut } from "@/app/actions/session";

export function Forbidden({ area, reason = "forbidden", email }: { area: string; reason?: "forbidden" | "mfa_required"; email?: string }) {
  return (
    <div className="container-page flex justify-center py-16">
      <div className="card max-w-lg p-8 text-center" role="alert">
        <ShieldAlert aria-hidden className="mx-auto size-10 text-brass-700" />
        <h1 className="font-display mt-4 text-3xl text-pine">
          {reason === "mfa_required" ? "Two-step verification needed" : "This area is for authorised staff"}
        </h1>
        <p className="mt-3 text-muted">
          {reason === "mfa_required"
            ? `Staff access to the ${area} requires two-step verification. Set it up once, then sign in again.`
            : `You're signed in${email ? ` as ${email}` : ""}, but this account doesn't have access to the ${area}. No staff information has been loaded.`}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {reason === "mfa_required" ? (
            <Link href="/account/security" className="btn btn-primary">Set up two-step verification</Link>
          ) : (
            <Link href="/community" className="btn btn-primary">Go to my community page</Link>
          )}
          <form action={signOut}>
            <input type="hidden" name="next" value="/" />
            <button type="submit" className="btn btn-secondary">Sign out</button>
          </form>
        </div>
      </div>
    </div>
  );
}
