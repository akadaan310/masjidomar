import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { pageGuard } from "@/components/staff/guard";
import { ActionForm } from "@/components/forms/ActionForm";
import { changeRole, inviteStaff, resolveDataRequest, setAccountStatus } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Members & roles · Administration" };

function Confirm() {
  return (
    <div>
      <label className="text-xs text-muted" htmlFor="pw">Your password</label>
      <input name="password" type="password" autoComplete="current-password" className="input min-h-9 w-40 py-1" aria-label="Re-enter your password to confirm" />
    </div>
  );
}

export default async function AdminMembers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const denied = await pageGuard(["admin"], "member administration");
  if (denied) return denied;
  const sp = await searchParams;
  const me = await getSessionUser();
  const page = Math.max(0, Number(sp.page ?? 0) || 0);
  const supabase = await createClient();
  const [{ data: members }, { data: requests }] = await Promise.all([
    supabase.rpc("admin_member_list", { p_search: (sp.q ?? "").slice(0, 60), p_limit: 25, p_offset: page * 25 }),
    supabase.from("data_requests").select("id, user_id, kind, status, created_at").eq("status", "pending").order("created_at"),
  ]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl text-pine">Members &amp; roles</h1>
        <p className="text-muted">25 per page, searchable. Every role or status change requires your password and is written to the audit log. You cannot change your own roles.</p>
      </header>

      <form className="card flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1">
          <label className="field-label" htmlFor="q">Search by email or name</label>
          <input id="q" name="q" defaultValue={sp.q} className="input" />
        </div>
        <button className="btn btn-secondary">Search</button>
      </form>

      <section className="card overflow-x-auto p-6">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr><th className="pb-2 text-start">Account</th><th className="pb-2 text-start">Roles</th><th className="pb-2 text-start">Change role</th><th className="pb-2 text-start">Status</th></tr>
          </thead>
          <tbody>
            {(members ?? []).map((m) => (
              <tr key={m.id} className="border-t border-pine/10 align-top">
                <td className="py-3">
                  <span className="block font-semibold text-pine">{m.display_name || "—"}</span>
                  <span className="text-muted">{m.email}</span>
                  {!m.email_confirmed && <span className="badge ms-1 bg-warning-bg text-warning-ink">unverified</span>}
                </td>
                <td className="py-3">{m.roles.length ? m.roles.join(", ") : <span className="text-muted">member</span>}</td>
                <td className="py-3">
                  {m.id === me?.id ? (
                    <span className="text-muted">Your account</span>
                  ) : (
                    <ActionForm action={changeRole} submitLabel="Apply" buttonClassName="btn btn-secondary min-h-9 px-3 text-xs" className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="userId" value={m.id} />
                      <div>
                        <label className="text-xs text-muted" htmlFor={`op-${m.id}`}>Action</label>
                        <select id={`op-${m.id}`} name="op" className="input min-h-9 py-1"><option value="grant">Grant</option><option value="revoke">Remove</option></select>
                      </div>
                      <div>
                        <label className="text-xs text-muted" htmlFor={`role-${m.id}`}>Role</label>
                        <select id={`role-${m.id}`} name="role" className="input min-h-9 py-1">
                          <option value="imam">Imam</option><option value="editor">Editor</option><option value="moderator">Moderator</option><option value="admin">Admin</option>
                        </select>
                      </div>
                      <Confirm />
                    </ActionForm>
                  )}
                </td>
                <td className="py-3">
                  <span className={`badge ${m.status === "active" ? "bg-sage-100 text-pine" : "bg-danger text-white"}`}>{m.status}</span>
                  {m.id !== me?.id && (
                    <ActionForm action={setAccountStatus} submitLabel={m.status === "active" ? "Disable" : "Re-enable"} buttonClassName="btn btn-secondary min-h-9 px-3 text-xs" className="mt-2 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="userId" value={m.id} />
                      <input type="hidden" name="status" value={m.status === "active" ? "disabled" : "active"} />
                      <Confirm />
                    </ActionForm>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex gap-3">
          {page > 0 && <a className="btn btn-secondary min-h-10 text-sm" href={`?q=${encodeURIComponent(sp.q ?? "")}&page=${page - 1}`}>Previous</a>}
          {(members ?? []).length === 25 && <a className="btn btn-secondary min-h-10 text-sm" href={`?q=${encodeURIComponent(sp.q ?? "")}&page=${page + 1}`}>Next</a>}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <section className="card p-6">
          <h2 className="font-display text-2xl text-pine">Invite staff</h2>
          <p className="text-sm text-muted">Sends an invitation email. After they set a password, grant their role above. Requires a configured email provider in production.</p>
          <ActionForm action={inviteStaff} submitLabel="Send invitation" className="mt-4 flex flex-wrap items-end gap-3" resetOnSuccess>
            <div className="flex-1"><label className="field-label" htmlFor="inv">Email</label><input id="inv" name="email" type="email" className="input" /></div>
            <Confirm />
          </ActionForm>
        </section>
        <section className="card p-6">
          <h2 className="font-display text-2xl text-pine">Data requests</h2>
          {(requests ?? []).length === 0 && <p className="mt-2 text-muted">No pending requests.</p>}
          <ul className="mt-3 space-y-4">
            {(requests ?? []).map((r) => (
              <li key={r.id} className="rounded-2xl border border-pine/10 p-4 text-sm">
                <p><strong>{r.kind}</strong> request · account {r.user_id?.slice(0, 8)} · {new Date(r.created_at).toLocaleDateString("en-US")}</p>
                {r.kind === "deletion" && <p className="text-danger">Completing permanently deletes the account and every question and reply it owns.</p>}
                <ActionForm action={resolveDataRequest} submitLabel="Resolve" buttonClassName="btn btn-secondary min-h-9 text-xs" className="mt-2 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="userId" value={r.user_id ?? ""} />
                  <input type="hidden" name="kind" value={r.kind} />
                  <div><label className="text-xs text-muted" htmlFor={`d-${r.id}`}>Decision</label><select id={`d-${r.id}`} name="decision" className="input min-h-9 py-1"><option value="completed">Complete</option><option value="rejected">Reject</option></select></div>
                  <Confirm />
                </ActionForm>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
