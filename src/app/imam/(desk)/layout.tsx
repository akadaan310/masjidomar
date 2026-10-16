import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { StaffTopBar } from "@/components/staff/StaffTopBar";
import { Forbidden } from "@/components/staff/Forbidden";

export const metadata = { robots: { index: false, follow: false } };

export default async function ImamLayout({ children }: { children: React.ReactNode }) {
  const check = await requireRole(["imam"], "/imam", "/imam/login");
  if (!check.ok) {
    return (
      <>
        <StaffTopBar label="Imam desk" tone="imam" email={check.user.email} />
        <main id="main">
          <Forbidden area="imam desk" reason={check.reason} email={check.user.email} />
        </main>
      </>
    );
  }
  return (
    <div className="min-h-dvh bg-[#f3f5f8]">
      <StaffTopBar label="Imam desk" tone="imam" email={check.user.email}>
        <nav aria-label="Imam desk" className="flex gap-1">
          <Link href="/imam" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-ivory/10">Inbox</Link>
          <Link href="/imam/faq" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-ivory/10">FAQ proposals</Link>
        </nav>
      </StaffTopBar>
      <main id="main" className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
