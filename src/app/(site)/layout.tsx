import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ConceptBanner } from "@/components/site/ConceptBanner";
import { getSiteSettings } from "@/lib/site";
import { getLang, t } from "@/lib/i18n";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const d = t(lang);
  const { settings, live } = await getSiteSettings();
  return (
    <>
      <a href="#main" className="sr-only z-50 rounded-lg bg-pine px-4 py-3 text-ivory focus:not-sr-only focus:fixed focus:start-3 focus:top-3">
        {d.skip}
      </a>
      {settings.concept_mode && <ConceptBanner text={d.conceptBanner} />}
      {!live && (
        <div role="alert" className="bg-warning-bg text-warning-ink">
          <p className="container-page py-2 text-sm">
            The site&apos;s data service is not reachable or not configured. Live schedules, sign-in and member features are unavailable.
          </p>
        </div>
      )}
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter settings={settings} lang={lang} />
    </>
  );
}
