import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site";
import { pageGuard } from "@/components/staff/guard";

export const metadata: Metadata = { title: "Page status · Administration" };

export default async function PageStatus() {
  const denied = await pageGuard(["admin", "editor"], "page status");
  if (denied) return denied;
  const { settings: s } = await getSiteSettings();
  const rows: [string, string, string][] = [
    ["/", "Home", s.concept_mode ? "Concept hero + preview banner" : s.hero_source === "approved_photo" ? "Approved photo" : "Pattern"],
    ["/prayer-times", "Prayer times", "Driven by Prayer editor"],
    ["/visit", "Visit", `Accessibility ${s.accessibility_verified ? "published" : "hidden (unverified)"} · parking ${s.parking_verified ? "published" : "hidden (unverified)"}`],
    ["/support", "Support", s.giving_verified ? "Approved giving info shown" : "“Please contact the masjid” message"],
    ["/about", "About", "Static, no unverified history"],
    ["/welcome", "Welcome path", "General guidance; masjid specifics marked to-be-verified"],
    ["/privacy", "Privacy", "Review with masjid leadership before launch"],
    ["/terms", "Terms", "Review with masjid leadership before launch"],
    ["/accessibility", "Accessibility", "Statement + feedback route"],
  ];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl text-pine">Page status</h1>
        <p className="text-muted">What each public page currently shows, and which settings control it.</p>
      </header>
      <section className="card p-6">
        <ul className="divide-y divide-pine/10 text-sm">
          {rows.map(([href, label, state]) => (
            <li key={href} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <Link href={href} target="_blank" className="font-semibold text-pine underline">{label}</Link>
              <span className="text-muted">{state}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm"><Link href="/admin/settings" className="font-semibold text-evergreen underline">Change settings</Link></p>
      </section>
    </div>
  );
}
