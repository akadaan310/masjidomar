import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { pageGuard } from "@/components/staff/guard";
import { ActionForm } from "@/components/forms/ActionForm";
import { assignQuestion } from "@/app/actions/admin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CATEGORY_LABELS } from "@/lib/questions";
import { BreakGlass } from "@/components/staff/BreakGlass";

export const metadata: Metadata = { title: "Question queue · Administration" };

export default async function AdminQuestions() {
  const denied = await pageGuard(["admin", "moderator"], "question queue");
  if (denied) return denied;
  const user = await getSessionUser();
  const supabase = await createClient();
  const [{ data: overview }, { data: queue }, { data: staff }] = await Promise.all([
    supabase.rpc("admin_question_overview"),
    supabase.rpc("admin_question_queue", { p_limit: 100 }),
    supabase.rpc("admin_staff_list"),
  ]);
  const imams = (staff ?? []).filter((s) => s.role === "imam");
  const byStatus = new Map<string, number>();
  (overview ?? []).forEach((o) => byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + o.total));
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl text-pine">Question queue</h1>
        <p className="text-muted">Metadata only: no subjects, no text, no asker identity. Religious replies are left to the imam.</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-5">
        {["submitted", "acknowledged", "needs_clarification", "answered", "closed"].map((s) => (
          <li key={s} className="card p-4">
            <span className="tabular block text-2xl font-bold text-pine">{byStatus.get(s) ?? 0}</span>
            <StatusBadge status={s} />
          </li>
        ))}
      </ul>
      <section className="card overflow-x-auto p-6">
        <h2 className="font-display text-2xl text-pine">Open questions</h2>
        <table className="mt-4 w-full min-w-[44rem] text-sm">
          <thead className="text-start text-xs uppercase tracking-wider text-muted">
            <tr><th className="pb-2 text-start">Ref</th><th className="pb-2 text-start">Topic</th><th className="pb-2 text-start">Status</th><th className="pb-2 text-start">Waiting</th><th className="pb-2 text-start">Assigned imam</th></tr>
          </thead>
          <tbody>
            {(queue ?? []).map((q) => (
              <tr key={q.id} className="border-t border-pine/10 align-top">
                <td className="py-3 font-mono text-xs">{q.id.slice(0, 8)}{q.is_sensitive && <span className="badge ms-2 bg-warning-bg text-warning-ink">sensitive</span>}</td>
                <td className="py-3">{CATEGORY_LABELS[q.category]} · {q.language}</td>
                <td className="py-3"><StatusBadge status={q.status} /></td>
                <td className="py-3">{q.waiting_hours} h</td>
                <td className="py-3">
                  <ActionForm action={assignQuestion} submitLabel="Assign" buttonClassName="btn btn-secondary min-h-9 px-3 text-xs" className="flex items-center gap-2">
                    <input type="hidden" name="id" value={q.id} />
                    <label className="sr-only" htmlFor={`a-${q.id}`}>Imam</label>
                    <select id={`a-${q.id}`} name="imamId" defaultValue={q.assigned_imam_id ?? ""} className="input min-h-9 py-1 text-sm">
                      <option value="">Shared queue</option>
                      {imams.map((i) => <option key={i.user_id} value={i.user_id}>{i.display_name || "Imam"}</option>)}
                    </select>
                  </ActionForm>
                  {user?.roles.includes("admin") && <BreakGlass questionId={q.id} />}
                </td>
              </tr>
            ))}
            {(queue ?? []).length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted">No open questions.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
