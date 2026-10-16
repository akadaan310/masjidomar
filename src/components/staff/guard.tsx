import "server-only";
import { getSessionUser, type StaffRole } from "@/lib/auth";
import { Forbidden } from "@/components/staff/Forbidden";

/** Per-page role check inside the admin console (the layout already ensured some staff role). */
export async function pageGuard(roles: StaffRole[], area: string) {
  const user = await getSessionUser();
  if (!user || !roles.some((r) => user.roles.includes(r))) return <Forbidden area={area} email={user?.email} />;
  return null;
}
