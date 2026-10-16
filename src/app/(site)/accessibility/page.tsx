import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/site/ProsePage";
import { getSiteSettings } from "@/lib/site";

export const metadata: Metadata = { title: "Accessibility" };

export default async function AccessibilityPage() {
  const { settings: s } = await getSiteSettings();
  return (
    <ProsePage eyebrow="Accessibility" title="Accessibility">
      <h2>At the masjid</h2>
      {s.accessibility_verified && s.accessibility_info ? (
        <p className="whitespace-pre-wrap">{s.accessibility_info}</p>
      ) : (
        <p>Physical accessibility details (step-free entry, seating, restrooms) are being verified with the masjid and will be published here once confirmed. Until then, please contact the masjid before your visit so they can help.</p>
      )}
      <h2>On this website</h2>
      <ul>
        <li>We aim to meet WCAG 2.2 level AA: keyboard navigation, visible focus, screen-reader landmarks and labels, and sufficient colour contrast.</li>
        <li>Arabic text uses real text with right-to-left layout, never images of words.</li>
        <li>Motion is minimal and respects your device&apos;s &ldquo;reduce motion&rdquo; setting.</li>
        <li>Prayer times are presented as tables with headers, and the next prayer is announced politely to screen readers.</li>
      </ul>
      <h2>Tell us what isn&apos;t working</h2>
      <p>If something on this site is hard to use, please tell the masjid in person, or sign in and send a message through <Link href="/ask">Ask the Imam</Link> with the topic &ldquo;Community &amp; masjid life&rdquo;.</p>
    </ProsePage>
  );
}
