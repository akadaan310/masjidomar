import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { MfaManager } from "@/components/member/MfaManager";

export const metadata: Metadata = { title: "Two-step verification", robots: { index: false } };

export default async function SecurityPage() {
  await requireUser("/account/security");
  return (
    <div className="container-page max-w-2xl py-12 sm:py-16">
      <p className="eyebrow">Account security</p>
      <h1 className="font-display mt-2 text-4xl text-pine">Two-step verification</h1>
      <p className="mt-3 text-muted">Recommended for everyone, and required for staff when the masjid enables it. You&apos;ll enter a code from your phone when signing in.</p>
      <div className="card mt-8 p-6 sm:p-8"><MfaManager /></div>
    </div>
  );
}
