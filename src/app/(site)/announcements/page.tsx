import type { Metadata } from "next";
import { getAnnouncements } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { getLang } from "@/lib/i18n";

export const metadata: Metadata = { title: "Announcements" };

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const lang = await getLang();
  const q = (sp.q ?? "").slice(0, 60);
  const list = await getAnnouncements({ q, limit: 50 });
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <p className="eyebrow">News from the masjid</p>
      <h1 className="font-display mt-2 text-4xl text-pine sm:text-5xl">Announcements</h1>
      <form role="search" className="mt-8 flex gap-3">
        <label htmlFor="q" className="sr-only">Search announcements</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search announcements" className="input" />
        <button className="btn btn-primary">Search</button>
      </form>
      {list.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-pine/20 p-6 text-muted">{q ? "No announcements match your search." : "No announcements have been published yet."}</p>
      ) : (
        <ol className="mt-10 space-y-6">
          {list.map((a) => (
            <li key={a.id} id={a.slug} className={`card scroll-mt-24 p-6 sm:p-8 ${a.urgency === "urgent" ? "border-2 border-brass" : ""}`}>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <time dateTime={a.publish_at}>{new Date(a.publish_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { dateStyle: "long", timeZone: "America/New_York" })}</time>
                {a.urgency === "urgent" && <span className="badge bg-brass text-pine">Urgent</span>}
                {a.audience === "members" && <span className="badge bg-sage-100 text-pine">Members</span>}
                <SampleBadge show={a.is_sample} />
              </div>
              <h2 className="font-display mt-2 text-2xl text-pine">{lang === "ar" && a.title_ar ? a.title_ar : a.title}</h2>
              <div className="prose-masjid mt-3" dir={lang === "ar" && a.body_ar_md ? "rtl" : undefined} dangerouslySetInnerHTML={{ __html: renderMarkdown(lang === "ar" && a.body_ar_md ? a.body_ar_md : a.body_md) }} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
