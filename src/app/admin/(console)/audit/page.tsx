import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { pageGuard } from "@/components/staff/guard";

export const metadata: Metadata = { title: "Audit log · Administration" };

export default async function AuditLog({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const denied = await pageGuard(["admin"], "audit log");
  if (denied) return denied;
  const page = Math.max(0, Number((await searchParams).page ?? 0) || 0);
  const supabase = await createClient();
  const { data } = await supabase.from("audit_events").select("*").order("created_at", { ascending: false }).range(page * 50, page * 50 + 49);
  const { data: staff } = await supabase.rpc("admin_staff_list");
  const names = new Map((staff ?? []).map((s) => [s.user_id, s.display_name || s.role]));
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl text-pine">Audit log</h1>
        <p className="text-muted">Append-only. Records who did what and when — never the text of private questions.</p>
      </header>
      <section className="card overflow-x-auto p-6">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr><th className="pb-2 text-start">When (ET)</th><th className="pb-2 text-start">Who</th><th className="pb-2 text-start">Action</th><th className="pb-2 text-start">Target</th><th className="pb-2 text-start">Details</th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((e) => (
              <tr key={e.id} className="border-t border-pine/10 align-top">
                <td className="py-2 whitespace-nowrap">{new Date(e.created_at).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "short", timeStyle: "short" })}</td>
                <td className="py-2">{e.actor_id ? names.get(e.actor_id) ?? e.actor_id.slice(0, 8) : "system"}</td>
                <td className="py-2 font-semibold text-pine">{e.action}</td>
                <td className="py-2">{e.target_type} {e.target_id && <span className="font-mono text-xs text-muted">{e.target_id.slice(0, 8)}</span>}</td>
                <td className="py-2 font-mono text-xs text-muted">{JSON.stringify(e.metadata) === "{}" ? "" : JSON.stringify(e.metadata)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex gap-3">
          {page > 0 && <a className="btn btn-secondary min-h-10 text-sm" href={`?page=${page - 1}`}>Newer</a>}
          {(data ?? []).length === 50 && <a className="btn btn-secondary min-h-10 text-sm" href={`?page=${page + 1}`}>Older</a>}
        </div>
      </section>
    </div>
  );
}
