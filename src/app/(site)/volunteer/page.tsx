import type { Metadata } from "next";
import Link from "next/link";
import { getVolunteerOpportunities } from "@/lib/content";
import { getSessionUser } from "@/lib/auth";
import { renderMarkdown } from "@/lib/markdown";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { VolunteerForm } from "@/components/member/VolunteerForm";

export const metadata: Metadata = { title: "Volunteer" };

export default async function VolunteerPage() {
  const [opps, user] = await Promise.all([getVolunteerOpportunities(), getSessionUser()]);
  return (
    <div className="container-page py-12 sm:py-16">
      <p className="eyebrow">Serve together</p>
      <h1 className="font-display mt-2 text-4xl text-pine sm:text-5xl">Volunteer</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">Ways to help that the masjid has listed. We never publish a list of volunteers.</p>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <section aria-label="Opportunities">
          {opps.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-pine/20 p-6 text-muted">No opportunities have been published yet.</p>
          ) : (
            <ul className="space-y-5">
              {opps.map((o) => (
                <li key={o.id} className="card p-6">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-2xl text-pine">{o.title}</h2><SampleBadge show={o.is_sample} /></div>
                  {o.commitment && <p className="mt-1 text-sm font-semibold text-evergreen">{o.commitment}</p>}
                  <div className="prose-masjid mt-3 text-muted" dangerouslySetInnerHTML={{ __html: renderMarkdown(o.description_md) }} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="interest" className="card h-fit p-6 sm:p-8">
          <h2 id="interest" className="font-display text-2xl text-pine">Express interest</h2>
          <div className="mt-4">
            {user ? (
              <VolunteerForm options={opps.map((o) => ({ id: o.id, title: o.title }))} />
            ) : (
              <p className="text-muted">
                <Link href="/login?next=/volunteer" className="btn btn-primary mb-3">Sign in to continue</Link>
                <br />An account keeps your contact details private and lets you withdraw at any time.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
