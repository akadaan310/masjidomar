import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { fullAddress, mapsUrl, telHref, type SiteSettings } from "@/lib/site";
import { t, type Lang } from "@/lib/i18n";

export function SiteFooter({ settings, lang }: { settings: SiteSettings; lang: Lang }) {
  const d = t(lang);
  const year = new Date().getFullYear();
  return (
    <footer className="pattern-lattice mt-24 text-ivory">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo tone="reverse" />
          <address className="not-italic text-sage">
            <a href={mapsUrl(settings)} className="inline-flex items-start gap-2 underline-offset-4 hover:underline" rel="noopener noreferrer" target="_blank">
              <MapPin aria-hidden className="mt-1 size-4 shrink-0 text-brass" />
              <span className="bidi-isolate" dir="ltr">{fullAddress(settings)}</span>
              <span className="sr-only">(opens map in a new tab)</span>
            </a>
            {settings.phone_verified && settings.phone && (
              <a href={telHref(settings.phone)} className="mt-2 flex items-center gap-2 hover:underline">
                <Phone aria-hidden className="size-4 text-brass" />
                <span className="bidi-isolate" dir="ltr">{settings.phone}</span>
              </a>
            )}
          </address>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            ["/prayer-times", d.prayerTimes],
            ["/visit", d.visit],
            ["/programs", d.programs],
            ["/announcements", d.announcements],
            ["/ask", d.ask],
            ["/faq", d.faq],
            ["/welcome", d.welcome],
            ["/volunteer", d.volunteer],
            ["/support", d.support],
            ["/about", d.about],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="py-1 text-sage hover:text-ivory hover:underline">
              {label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 text-sm text-sage">
          <Link href="/privacy" className="block py-1 hover:text-ivory hover:underline">Privacy</Link>
          <Link href="/terms" className="block py-1 hover:text-ivory hover:underline">Terms of use</Link>
          <Link href="/accessibility" className="block py-1 hover:text-ivory hover:underline">Accessibility</Link>
          <Link href="/display" className="block py-1 hover:text-ivory hover:underline">Masjid screen</Link>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <p className="container-page py-5 text-xs text-sage/90">
          © {year} {settings.org_name_en}
          {settings.concept_mode && " · Proposed website preview pending masjid leadership approval. Not an official publication."}
        </p>
      </div>
    </footer>
  );
}
