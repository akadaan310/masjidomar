import type { Metadata } from "next";
import Link from "next/link";
import { Accessibility, Car, Clock, MapPin, Phone } from "lucide-react";
import { getSiteSettings, fullAddress, mapsUrl, telHref } from "@/lib/site";
import { getHeroMedia } from "@/lib/content";
import { DisclosedImage } from "@/components/ui/DisclosedImage";

export const metadata: Metadata = { title: "Visit", description: "Address, directions and what to expect when visiting Masjid Omar in Tampa." };

export default async function VisitPage() {
  const [{ settings: s }, media] = await Promise.all([getSiteSettings(), getHeroMedia()]);
  const gallery = media.filter((m) => m.publish_approved || (m.ai_generated && s.concept_mode));
  return (
    <div className="container-page py-12 sm:py-16">
      <p className="eyebrow">Plan a visit</p>
      <h1 className="font-display mt-2 text-4xl text-pine sm:text-5xl">Visit {s.org_name_en}</h1>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr] [&>*]:min-w-0">
        <div className="space-y-5">
          <section className="card p-6" aria-labelledby="where">
            <h2 id="where" className="flex items-center gap-2 font-display text-2xl text-pine"><MapPin aria-hidden className="size-5" /> Where</h2>
            <address className="bidi-isolate mt-3 text-lg not-italic" dir="ltr">{fullAddress(s)}</address>
            <a href={mapsUrl(s)} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4">Open in Maps<span className="sr-only"> (new tab)</span></a>
          </section>
          <section className="card p-6" aria-labelledby="when">
            <h2 id="when" className="flex items-center gap-2 font-display text-2xl text-pine"><Clock aria-hidden className="size-5" /> When</h2>
            <p className="mt-3 text-muted">The building is used for the five daily prayers. See <Link href="/prayer-times" className="font-semibold text-evergreen underline">prayer times</Link>. Visiting hours outside prayer are to be confirmed.</p>
          </section>
          <section className="card p-6" aria-labelledby="access">
            <h2 id="access" className="flex items-center gap-2 font-display text-2xl text-pine"><Accessibility aria-hidden className="size-5" /> Accessibility</h2>
            {s.accessibility_verified && s.accessibility_info ? (
              <p className="mt-3 whitespace-pre-wrap">{s.accessibility_info}</p>
            ) : (
              <p className="mt-3 text-muted">Step-free access, seating and restroom details are being verified and will be published once confirmed. If you need anything to make your visit easier, please contact the masjid ahead of time.</p>
            )}
          </section>
          <section className="card p-6" aria-labelledby="parking">
            <h2 id="parking" className="flex items-center gap-2 font-display text-2xl text-pine"><Car aria-hidden className="size-5" /> Parking</h2>
            {s.parking_verified && s.parking_info ? (
              <p className="mt-3 whitespace-pre-wrap">{s.parking_info}</p>
            ) : (
              <p className="mt-3 text-muted">Parking information is to be verified with the masjid.</p>
            )}
          </section>
          <section className="card p-6" aria-labelledby="contact">
            <h2 id="contact" className="flex items-center gap-2 font-display text-2xl text-pine"><Phone aria-hidden className="size-5" /> Contact</h2>
            <ul className="mt-3 space-y-2">
              {s.phone_verified && s.phone && <li><a className="font-semibold text-evergreen underline" href={telHref(s.phone)}><span dir="ltr" className="bidi-isolate">{s.phone}</span></a></li>}
              {s.email_verified && s.email && <li><a className="font-semibold text-evergreen underline" href={`mailto:${s.email}`}>{s.email}</a></li>}
              {!(s.phone_verified && s.phone) && !(s.email_verified && s.email) && <li className="text-muted">Official contact details are awaiting confirmation. In the meantime, visit in person or <Link href="/ask" className="underline">ask the imam online</Link>.</li>}
            </ul>
          </section>
        </div>
        <div className="space-y-8">
          <section aria-labelledby="etiquette" className="rounded-[1.75rem] bg-sand/70 p-6 sm:p-8">
            <h2 id="etiquette" className="font-display text-2xl text-pine">Visitor courtesies</h2>
            <p className="mt-1 text-sm text-muted">General etiquette shared by most masajid. Any Masjid Omar–specific guidance will be added by staff.</p>
            <ul className="mt-4 list-disc space-y-2 ps-5">
              <li>Remove your shoes before stepping onto the prayer carpet.</li>
              <li>Wear modest clothing; a light scarf for women is appreciated in the prayer hall.</li>
              <li>Keep phones silent and voices low, especially during prayer.</li>
              <li>Avoid walking directly in front of someone who is praying.</li>
              <li>Ask before taking photos, and never photograph people without their permission.</li>
            </ul>
            <Link href="/welcome" className="btn btn-primary mt-5">Read the full welcome path</Link>
          </section>
          {gallery.length > 0 && (
            <section aria-labelledby="gallery">
              <h2 id="gallery" className="font-display text-2xl text-pine">Gallery</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {gallery.map((m) => (
                  <li key={m.id}>
                    <DisclosedImage src={m.storage_path} alt={m.alt_text} credit={m.credit} aiGenerated={m.ai_generated} className="aspect-[4/3] rounded-2xl" sizes="(min-width: 640px) 33vw, 100vw" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
