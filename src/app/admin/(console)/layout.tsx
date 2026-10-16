import { requireRole } from "@/lib/auth";
import { StaffTopBar } from "@/components/staff/StaffTopBar";
import { Forbidden } from "@/components/staff/Forbidden";
import { AdminNav } from "@/components/staff/AdminNav";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const check = await requireRole(["admin", "editor", "moderator"], "/admin", "/admin/login");
  if (!check.ok) {
    return (
      <>
        <StaffTopBar label="Administration" tone="admin" email={check.user.email} />
        <main id="main">
          <Forbidden area="administration console" reason={check.reason} email={check.user.email} />
        </main>
      </>
    );
  }
  return (
    <div className="min-h-dvh bg-[#f2f1ec]">
      <StaffTopBar label="Administration" tone="admin" email={check.user.email} />
      <div className="mx-auto grid max-w-[90rem] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[15rem_1fr] [&>*]:min-w-0">
        <AdminNav roles={check.user.roles} />
        <main id="main" className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
