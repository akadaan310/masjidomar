import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isBackendConfigured } from "@/lib/env";
import type { Database } from "@/lib/database.types";

export type StaffRole = Database["public"]["Enums"]["staff_role"];

export type SessionUser = {
  id: string;
  email: string;
  emailConfirmed: boolean;
  displayName: string;
  language: "en" | "ar";
  status: "active" | "disabled";
  roles: StaffRole[];
  aal: "aal1" | "aal2" | null;
  mfaRequired: boolean;
};

/**
 * Data Access Layer: the single place that resolves the current user.
 * Uses auth.getUser() (validated by the Auth server, not just a local cookie claim) and reads
 * roles from the protected staff_roles table through the my_roles() RPC.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isBackendConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = data.user;

  const [{ data: profile }, { data: roles }, { data: aalData }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("display_name, preferred_language, status").eq("id", user.id).maybeSingle(),
    supabase.rpc("my_roles"),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.from("site_settings").select("require_staff_mfa").maybeSingle(),
  ]);

  return {
    id: user.id,
    email: user.email ?? "",
    emailConfirmed: Boolean(user.email_confirmed_at),
    displayName: profile?.display_name ?? "",
    language: (profile?.preferred_language as "en" | "ar") ?? "en",
    status: (profile?.status as "active" | "disabled") ?? "active",
    roles: (roles ?? []) as StaffRole[],
    aal: (aalData?.currentLevel as "aal1" | "aal2" | null) ?? null,
    mfaRequired: Boolean(settings?.require_staff_mfa),
  };
});

export function hasRole(user: SessionUser | null, role: StaffRole) {
  return Boolean(user && user.status === "active" && user.roles.includes(role));
}

/** Require any signed-in, active member. Redirects to the member login otherwise. */
export async function requireUser(next: string, loginPath = "/login"): Promise<SessionUser> {
  if (!isBackendConfigured()) redirect("/setup-required");
  const user = await getSessionUser();
  if (!user) redirect(`${loginPath}?next=${encodeURIComponent(next)}`);
  if (user.status !== "active") redirect("/account-disabled");
  return user;
}

export type RoleCheck =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "forbidden" | "mfa_required"; user: SessionUser };

/**
 * Require one of the given staff roles. Never trusts client claims: roles come from the DB.
 * Returns a result so pages can render a friendly forbidden state (no privileged data loaded).
 */
export async function requireRole(roles: StaffRole[], next: string, loginPath: string): Promise<RoleCheck> {
  const user = await requireUser(next, loginPath);
  const has = roles.some((r) => user.roles.includes(r));
  if (!has) return { ok: false, reason: "forbidden", user };
  if (user.mfaRequired && user.aal !== "aal2") return { ok: false, reason: "mfa_required", user };
  return { ok: true, user };
}

/** Server-action guard: returns the user or throws (actions surface a generic error). */
export async function assertRole(roles: StaffRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.status !== "active") throw new Error("Not signed in.");
  if (!roles.some((r) => user.roles.includes(r))) throw new Error("You do not have permission for this action.");
  if (user.mfaRequired && user.aal !== "aal2") throw new Error("Two-step verification is required for staff actions.");
  return user;
}

export async function assertMember(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.status !== "active") throw new Error("Please sign in first.");
  return user;
}
