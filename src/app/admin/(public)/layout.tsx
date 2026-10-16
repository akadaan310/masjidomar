import { StaffTopBar } from "@/components/staff/StaffTopBar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StaffTopBar label="Administration" tone="admin" />
      <main id="main">{children}</main>
    </>
  );
}
