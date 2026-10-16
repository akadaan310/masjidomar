import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { getPublicFaq } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { CATEGORY_LABELS } from "@/lib/questions";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toggleSaved } from "@/app/actions/member";

export const metadata: Metadata = { title: "Questions & answers", description: "Curated, imam-approved answers to common questions." };

export default async function FaqPage() {
  const [faq, user] = await Promise.all([getPublicFaq(), getSessionUser()]);
  const savedIds = new Set<string>();
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.from("saved_items").select("item_id").eq("user_id", user.id).eq("item_type", "faq");
    (data ?? []).forEach((d) => savedIds.add(d.item_id));
  }
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <p className="eyebrow">Curated by the imam</p>
      <h1 className="font-display mt-2 text-4xl text-pine sm:text-5xl">Questions &amp; answers</h1>
      <p className="mt-3 text-lg text-muted">
        General answers written or approved by the imam. Questions here are rewritten and anonymised — no private question is ever posted automatically.
      </p>
      {faq.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-pine/20 p-6 text-muted">No answers have been published yet.</p>
      ) : (
        <div className="mt-10 space-y-4">
          {faq.map((f) => (
            <details key={f.id} id={f.id} className="card group scroll-mt-24 p-6" lang={f.language}>
              <summary className="flex cursor-pointer list-none items-start gap-3 text-lg font-bold text-pine">
                <span className="flex-1" dir="auto">{f.question}</span>
                <span aria-hidden className="text-evergreen transition group-open:rotate-45">+</span>
              </summary>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="badge bg-sand text-pine">{CATEGORY_LABELS[f.category]}</span>
                <SampleBadge show={f.is_sample} />
              </div>
              <div className="prose-masjid mt-4" dir="auto" dangerouslySetInnerHTML={{ __html: renderMarkdown(f.answer_md) }} />
              {user && (
                <form action={toggleSaved} className="mt-4">
                  <input type="hidden" name="itemType" value="faq" />
                  <input type="hidden" name="itemId" value={f.id} />
                  <input type="hidden" name="saved" value={savedIds.has(f.id) ? "1" : "0"} />
                  <input type="hidden" name="path" value="/faq" />
                  <button className="btn btn-ghost min-h-10 text-sm"><Bookmark aria-hidden className="size-4" /> {savedIds.has(f.id) ? "Saved" : "Save"}</button>
                </form>
              )}
            </details>
          ))}
        </div>
      )}
      <div className="mt-12 rounded-[1.75rem] bg-evergreen p-8 text-ivory">
        <h2 className="font-display text-2xl">Have a personal question?</h2>
        <p className="mt-2 text-ivory/85">Ask privately. Only you and authorised imam staff will read it.</p>
        <Link href="/ask" className="btn mt-5 bg-ivory text-pine hover:bg-chalk">Ask the Imam privately</Link>
      </div>
    </div>
  );
}
