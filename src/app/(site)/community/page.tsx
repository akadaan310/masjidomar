import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, CalendarCheck, Download, MessageCircleQuestion, Settings, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CATEGORY_LABELS } from "@/lib/questions";
import { ProfileForm, DataRequestForm } from "@/components/member/AccountForms";
import { formatEventWhen } from "@/lib/content";

export const metadata: Metadata = { title: "My community", robots: { index: false, follow: false } };

export default async function CommunityPage() {
  const user = await requireUser("/community");
  const supabase = await createClient();
  const [{ data: questions }, { data: regs }, { data: saved }, { data: prefs }, { data: requests }] = await Promise.all([
    supabase.rpc("my_questions"),
    supabase
      .from("event_registrations")
      .select("id, status, party_size, events(slug, title, starts_at, ends_at, status)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("saved_items").select("item_type, item_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("notification_preferences").select("email_question_updates, email_announcements, email_event_reminders").eq("user_id", user.id).maybeSingle(),
    supabase.from("data_requests").select("id, kind, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  // Resolve titles of saved items (each read is RLS-scoped to published content).
  const faqIds = (saved ?? []).filter((s) => s.item_type === "faq").map((s) => s.item_id);
  const progIds = (saved ?? []).filter((s) => s.item_type === "program").map((s) => s.item_id);
  const [{ data: savedFaq }, { data: savedPrograms }] = await Promise.all([
    faqIds.length ? supabase.from("public_faq").select("id, question").in("id", faqIds) : Promise.resolve({ data: [] as { id: string; question: string }[] }),
    progIds.length ? supabase.from("programs").select("id, slug, title").in("id", progIds) : Promise.resolve({ data: [] as { id: string; slug: string; title: string }[] }),
  ]);

  const unreadTotal = (questions ?? []).reduce((n, q) => n + q.unread, 0);
  const greeting = user.language === "ar" ? "السلام عليكم" : "As-salāmu ʿalaykum";

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My community</p>
          <h1 className="font-display mt-2 text-4xl text-pine">
            {greeting}
            {user.displayName ? `, ${user.displayName}` : ""}
          </h1>
          <p className="mt-2 text-muted">Signed in as {user.email}</p>
        </div>
        <Link href="/ask" className="btn btn-primary">
          <MessageCircleQuestion aria-hidden className="size-4" /> Ask a new question
        </Link>
      </header>

      {!user.emailConfirmed && (
        <p role="alert" className="mt-6 rounded-xl bg-warning-bg p-4 text-warning-ink">Please verify your email address to send questions.</p>
      )}
      {user.roles.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-sage-100 p-4 text-sm text-pine">
          <ShieldCheck aria-hidden className="size-5" />
          <span>You have staff access: {user.roles.join(", ")}.</span>
          {user.roles.includes("imam") && <Link href="/imam" className="font-bold underline">Imam desk</Link>}
          {user.roles.some((r) => r !== "imam") && <Link href="/admin" className="font-bold underline">Administration</Link>}
          <Link href="/account/security" className="font-bold underline">Two-step verification</Link>
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <section aria-labelledby="myq" className="card p-6 sm:p-8">
          <h2 id="myq" className="flex items-center gap-2 font-display text-2xl text-pine">
            My questions
            {unreadTotal > 0 && <span className="badge bg-evergreen text-ivory">{unreadTotal} new {unreadTotal === 1 ? "reply" : "replies"}</span>}
          </h2>
          {(questions ?? []).length === 0 ? (
            <p className="mt-4 text-muted">You haven&apos;t asked anything yet. Your questions will appear here, visible only to you.</p>
          ) : (
            <ul className="mt-5 divide-y divide-pine/10">
              {(questions ?? []).map((q) => (
                <li key={q.id}>
                  <Link href={`/questions/${q.id}`} className="flex flex-wrap items-center gap-3 py-4 hover:bg-sage-100/50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-pine">{q.subject}</span>
                      <span className="text-sm text-muted">
                        {CATEGORY_LABELS[q.category]} · {new Date(q.created_at).toLocaleDateString("en-US", { timeZone: "America/New_York" })}
                      </span>
                    </span>
                    {q.unread > 0 && <span className="badge bg-brass text-pine">{q.unread} unread</span>}
                    <StatusBadge status={q.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-8">
          <section aria-labelledby="rsvps" className="card p-6">
            <h2 id="rsvps" className="flex items-center gap-2 font-display text-xl text-pine">
              <CalendarCheck aria-hidden className="size-5" /> My RSVPs
            </h2>
            {(regs ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No RSVPs yet. Browse <Link href="/programs" className="underline">programs</Link>.
              </p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {(regs ?? []).map((r) => {
                  const ev = r.events as unknown as { slug: string; title: string; starts_at: string; ends_at: string; status: string } | null;
                  if (!ev) return null;
                  return (
                    <li key={r.id}>
                      <Link href={`/programs/events/${ev.slug}`} className="font-semibold text-pine underline-offset-4 hover:underline">{ev.title}</Link>
                      <span className="block text-muted">
                        {formatEventWhen(ev.starts_at, ev.ends_at)} · {r.status}
                        {r.party_size > 1 ? ` · party of ${r.party_size}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="saved" className="card p-6">
            <h2 id="saved" className="flex items-center gap-2 font-display text-xl text-pine">
              <Bookmark aria-hidden className="size-5" /> Saved
            </h2>
            {(savedFaq ?? []).length + (savedPrograms ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-muted">Save answers and programs to find them here.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {(savedPrograms ?? []).map((p) => (
                  <li key={p.id}><Link href={`/programs/${p.slug}`} className="underline">{p.title}</Link></li>
                ))}
                {(savedFaq ?? []).map((f) => (
                  <li key={f.id}><Link href={`/faq#${f.id}`} className="underline">{f.question}</Link></li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2 [&>*]:min-w-0">
        <section aria-labelledby="settings" className="card p-6 sm:p-8">
          <h2 id="settings" className="flex items-center gap-2 font-display text-2xl text-pine">
            <Settings aria-hidden className="size-5" /> Account &amp; notifications
          </h2>
          <div className="mt-5">
            <ProfileForm displayName={user.displayName} language={user.language} prefs={prefs ?? null} />
          </div>
        </section>
        <section aria-labelledby="privacy" className="card p-6 sm:p-8">
          <h2 id="privacy" className="font-display text-2xl text-pine">Your data</h2>
          <p className="mt-3 text-sm text-muted">
            Download everything associated with your account — profile, questions and replies, RSVPs and saved items — as a JSON file.
          </p>
          <a href="/account/export" className="btn btn-secondary mt-4" download>
            <Download aria-hidden className="size-4" /> Download my data
          </a>
          <hr className="my-6 border-pine/10" />
          <DataRequestForm />
          {(requests ?? []).length > 0 && (
            <ul className="mt-5 space-y-1 text-sm text-muted">
              {(requests ?? []).map((r) => (
                <li key={r.id}>
                  {r.kind} request · {r.status} · {new Date(r.created_at).toLocaleDateString("en-US")}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
