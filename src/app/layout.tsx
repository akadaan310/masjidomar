import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, Noto_Naskh_Arabic } from "next/font/google";
import { getLang } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/site";
import { publicEnv } from "@/lib/env";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--font-naskh", display: "swap", weight: "variable", preload: false });

// Every page reads live, permissioned data (prayer publications, session), so render per request.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteSettings();
  const indexable = settings.allow_indexing && !settings.concept_mode;
  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: { default: "Masjid Omar · مسجد عمر — Tampa", template: "%s · Masjid Omar" },
    description:
      "A home for worship and a heart for community at 4801 E Busch Blvd, Tampa. Prayer times, programs, a private Ask-the-Imam desk and a gentle welcome for newcomers.",
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: "Masjid Omar",
      locale: "en_US",
      alternateLocale: ["ar"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#145B40",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`${fraunces.variable} ${manrope.variable} ${naskh.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
