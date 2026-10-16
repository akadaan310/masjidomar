import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { getSiteSettings, telHref } from "@/lib/site";

export const metadata: Metadata = { title: "Support the masjid" };

export default async function SupportPage() {
  const { settings } = await getSiteSettings();
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <HeartHandshake aria-hidden className="size-10 text-brass-700" />
      <h1 className="font-display mt-4 text-4xl text-pine sm:text-5xl">Support the masjid</h1>
      {settings.giving_verified && settings.giving_info ? (
        <div className="card mt-8 whitespace-pre-wrap p-6 text-lg">{settings.giving_info}</div>
      ) : (
        <div className="card mt-8 p-6 sm:p-8">
          <p className="text-lg text-ink">Please contact the masjid directly for giving information.</p>
          <p className="mt-3 text-muted">
            This website does not accept payments, and no online giving method has been confirmed yet. For your safety, please don&apos;t send money to
            any account you find online unless the masjid confirms it in person.
          </p>
          {settings.phone_verified && settings.phone && (
            <a href={telHref(settings.phone)} className="btn btn-primary mt-5">Call the masjid</a>
          )}
        </div>
      )}
      <p className="mt-8 text-muted">
        Giving time is also a gift — see <Link href="/volunteer" className="font-semibold text-evergreen underline">volunteer opportunities</Link>.
      </p>
    </div>
  );
}
