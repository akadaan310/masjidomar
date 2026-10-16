import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/site/ProsePage";
import { getSiteSettings, fullAddress } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const { settings: s } = await getSiteSettings();
  return (
    <ProsePage
      eyebrow="About"
      title={`About ${s.org_name_en}`}
      note={s.concept_mode ? "The masjid's own history, leadership and mission statement will be written by masjid leadership. Nothing here is invented on their behalf." : undefined}
    >
      <p>
        {s.org_name_en} (<span lang="ar">{s.org_name_ar}</span>) is a masjid at <span dir="ltr" className="bidi-isolate">{fullAddress(s)}</span>, serving
        Muslims in north Tampa and welcoming neighbours of every background.
      </p>
      <h2>What you&apos;ll find here</h2>
      <ul>
        <li>The five daily prayers and Jumu&apos;ah, with times published by masjid administrators.</li>
        <li>A private way to <Link href="/ask">ask the imam</Link>.</li>
        <li><Link href="/programs">Programs</Link> and <Link href="/announcements">announcements</Link> approved by the masjid.</li>
        <li>A gentle <Link href="/welcome">welcome path</Link> for first-time visitors.</li>
      </ul>
      <h2>About this website</h2>
      <p>
        This site is built to be accurate, private and accessible: prayer times come from the masjid, private questions stay private, and anything not yet
        confirmed is clearly marked.
      </p>
    </ProsePage>
  );
}
