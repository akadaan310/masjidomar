import type { Metadata } from "next";
import Link from "next/link";
import { EyeOff, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CATEGORY_LABELS } from "@/lib/questions";
import { ActionForm } from "@/components/forms/ActionForm";
import { imamSetHours } from "@/app/actions/imam";
import type { Database } from "@/lib/database.types";

export const metadata: Metadata = { title: "Imam inbox" };

type Status = Database["public"]["Enums"]["question_status"];
type Category = Database["public"]["Enums"]["question_category"];

const STATUSES: Status[] = ["submitted", "acknowledged", "needs_clarification", "answered", "closed"];
const CATEGORIES: Category[] = ["worship", "family", "new_muslim", "community", "other"];

export default async function ImamInbox({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as Status) ? (sp.status as Status) : undefined;
  const category = CATEGORIES.includes(sp.category as Category) ? (sp.category as Category) : undefined;
  const language = sp.language === "en" || sp.language === "ar" ? sp.language : undefined;
  const showSensitive = sp.sensitive === "1";

  const supabase = await createClient();
  const [{ data: rows, error }, { data: settings }] = await Promise.all([
    supabase.rpc("imam_inbox", {
      p_status: status,
      p_category: category,
      p_language: language,
      p_show_sensitive_excerpts: showSensitive,
    }),
    supabase.from("site_settings").select("imam_hours_note, imam_shared_queue").maybeSingle(),
  ]);
  const list = rows ?? [];
  const awaiting = list.filter((r) => r.status === "submitted" || r.status === "acknowledged").length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow !text-navy">Private questions</p>
          <h1 className="font-display mt-1 text-4xl text-navy">Inbox</h1>
          <p className="mt-1 text-muted">
            {awaiting} awaiting a reply · {settings?.imam_shared_queue ? "Shared queue: unassigned questions are visible to all imams." : "Only questions assigned to you."}
          </p>
        </div>
      </header>

      <form className="card flex flex-wrap items-end gap-4 p-4" aria-label="Filter inbox">
        <div>
          <label htmlFor="f-status" className="field-label text-sm">Status</label>
          <select id="f-status" name="status" defaultValue={status ?? ""} className="input min-h-10 py-1.5">
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-cat" className="field-label text-sm">Topic</label>
          <select id="f-cat" name="category" defaultValue={category ?? ""} className="input min-h-10 py-1.5">
            <option value="">All</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-lang" className="field-label text-sm">Language</label>
          <select id="f-lang" name="language" defaultValue={language ?? ""} className="input min-h-10 py-1.5">
            <option value="">All</option>
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input type="checkbox" name="sensitive" value="1" defaultChecked={showSensitive} className="size-5" />
          Show previews of sensitive questions
        </label>
        <button type="submit" className="btn btn-secondary min-h-10">Apply</button>
      </form>

      {error ? (
        <p role="alert" className="rounded-xl bg-danger/5 p-4 text-danger">The inbox could not be loaded.</p>
      ) : list.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center text-muted">
          <Inbox aria-hidden className="size-10" />
          <p className="mt-3">No questions match these filters.</p>
        </div>
      ) : (
        <ul className="card divide-y divide-pine/10">
          {list.map((r) => (
            <li key={r.id}>
              <Link href={`/imam/questions/${r.id}`} className="grid gap-2 p-5 hover:bg-sage-100/40 sm:grid-cols-[1fr_auto] sm:items-center">
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    {r.is_sensitive && <EyeOff aria-label="Sensitive" className="size-4 text-brass-700" />}
                    <span className="font-bold text-navy" dir="auto">{r.subject}</span>
                    {r.assigned_to_me && <span className="badge bg-navy/10 text-navy">Assigned to you</span>}
                  </span>
                  {r.excerpt && <span className="mt-1 block truncate text-sm text-muted" dir="auto">{r.excerpt}</span>}
                  <span className="mt-1 block text-xs text-muted">
                    {r.asker_label} · {CATEGORY_LABELS[r.category]} · {r.language === "ar" ? "Arabic" : "English"} · waiting {r.waiting_hours} h
                  </span>
                </span>
                <StatusBadge status={r.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="hours" className="card max-w-2xl p-6">
        <h2 id="hours" className="font-display text-xl text-navy">Availability note on the Ask page</h2>
        <p className="mt-1 text-sm text-muted">Optional. Avoid promising specific response times.</p>
        <ActionForm action={imamSetHours} submitLabel="Update note" className="mt-4 space-y-3">
          <label htmlFor="note" className="sr-only">Availability note</label>
          <textarea id="note" name="note" maxLength={300} rows={2} defaultValue={settings?.imam_hours_note ?? ""} className="input min-h-0" />
        </ActionForm>
      </section>
    </div>
  );
}
