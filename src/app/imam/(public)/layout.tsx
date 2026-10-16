import { StaffTopBar } from "@/components/staff/StaffTopBar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StaffTopBar label="Imam desk" tone="imam" />
      <main id="main">{children}</main>
    </>
  );
}
