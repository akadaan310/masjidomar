import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { renderMarkdown } from "@/lib/markdown";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { formatEventWhen } from "@/lib/content";
import { getSessionUser } from "@/lib/auth";
import { toggleSaved } from "@/app/actions/member";

export const metadata: Metadata = { title: "Program" };

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase.from("programs").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!p) notFound();
  const [{ data: events }, user] = await Promise.all([
    supabase.from("events").select("slug, title, starts_at, ends_at, status").eq("program_id", p.id).in("status", ["published", "cancelled"]).gte("ends_at", new Date().toISOString()).order("starts_at"),
    getSessionUser(),
  ]);
  const saved = user ? Boolean((await supabase.from("saved_items").select("item_id").match({ user_id: user.id, item_type: "program", item_id: p.id }).maybeSingle()).data) : false;
  return (
    <article className="container-page max-w-3xl py-12 sm:py-16">
      <Link href="/programs" className="text-sm font-semibold text-evergreen">← All programs</Link>
      <div className="mt-6 flex flex-wrap items-center gap-2"><span className="badge bg-sand text-pine">{p.category}</span><SampleBadge show={p.is_sample} /></div>
      <h1 className="font-display mt-3 text-4xl text-pine sm:text-5xl">{p.title}</h1>
      {p.title_ar && <p lang="ar" dir="rtl" className="mt-2 text-2xl text-evergreen">{p.title_ar}</p>}
      {(p.schedule_note || p.audience_note) && <p className="mt-4 font-semibold text-pine">{[p.schedule_note, p.audience_note].filter(Boolean).join(" · ")}</p>}
      <div className="prose-masjid mt-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.description_md || p.summary) }} />
      {user && (
        <form action={toggleSaved} className="mt-6">
          <input type="hidden" name="itemType" value="program" />
          <input type="hidden" name="itemId" value={p.id} />
          <input type="hidden" name="saved" value={saved ? "1" : "0"} />
          <input type="hidden" name="path" value={`/programs/${p.slug}`} />
          <button className="btn btn-secondary"><Bookmark aria-hidden className="size-4" /> {saved ? "Saved — remove" : "Save to my community page"}</button>
        </form>
      )}
      <h2 className="font-display mt-10 text-2xl text-pine">Upcoming sessions</h2>
      {(events ?? []).length === 0 ? (
        <p className="mt-2 text-muted">No dated sessions are published yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {(events ?? []).map((e) => (
            <li key={e.slug}><Link href={`/programs/events/${e.slug}`} className="font-semibold text-evergreen underline">{formatEventWhen(e.starts_at, e.ends_at)}</Link>{e.status === "cancelled" && " · cancelled"}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
