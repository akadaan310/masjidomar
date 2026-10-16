import type { Metadata } from "next";
import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { WELCOME_STEPS } from "@/content/welcome";
import { getLang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "New here? A path of welcome",
  description: "A gentle, self-guided introduction for first-time visitors and new Muslims. No account needed.",
};

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const sp = await searchParams;
  const cookieLang = await getLang();
  const lang = sp.lang === "ar" || sp.lang === "en" ? sp.lang : cookieLang;
  const other = lang === "ar" ? "en" : "ar";
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">{lang === "ar" ? "طريق الترحيب" : "Path of welcome"}</p>
        <Link href={`/welcome?lang=${other}`} lang={other} className="btn btn-secondary min-h-10 text-sm">
          {lang === "ar" ? "Read in English" : "اقرأ بالعربية"}
        </Link>
      </div>
      <h1 className="font-display mt-3 text-4xl text-pine sm:text-5xl">{lang === "ar" ? "زيارتك الأولى" : "Your first visit"}</h1>
      <p className="mt-4 text-lg text-muted">
        {lang === "ar"
          ? "ستّ خطوات قصيرة. اقرأها بالترتيب أو انتقل إلى ما يهمّك. لا حاجة إلى حساب."
          : "Six short steps. Read them in order or jump to what you need. No account needed."}
      </p>
      <nav aria-label={lang === "ar" ? "الخطوات" : "Steps"} className="mt-8">
        <ol className="flex flex-wrap gap-2">
          {WELCOME_STEPS.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="badge min-h-9 bg-sage-100 px-3 text-sm text-pine hover:bg-sage">
                {i + 1}. {s[lang].title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <ol className="mt-10 space-y-6">
        {WELCOME_STEPS.map((s, i) => (
          <li key={s.id} id={s.id} className="card scroll-mt-24 p-6 sm:p-8">
            <p className="text-sm font-bold text-evergreen">{lang === "ar" ? `الخطوة ${i + 1} من ${WELCOME_STEPS.length}` : `Step ${i + 1} of ${WELCOME_STEPS.length}`}</p>
            <h2 className="font-display mt-1 text-2xl text-pine">{s[lang].title}</h2>
            <div className="mt-3 space-y-3 text-lg text-ink">
              {s[lang].body.map((p, k) => <p key={k}>{p}</p>)}
            </div>
            {s.verify && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-warning-bg p-3 text-sm text-warning-ink">
                <CircleHelp aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span><strong>{lang === "ar" ? "بانتظار تأكيد المسجد: " : "To be confirmed by the masjid: "}</strong>{s.verify[lang]}</span>
              </p>
            )}
          </li>
        ))}
      </ol>
      <section className="mt-12 grid gap-4 sm:grid-cols-3" aria-label={lang === "ar" ? "الخطوة التالية" : "Next steps"}>
        <Link href="/visit" className="card p-5 font-bold text-pine hover:border-evergreen">{lang === "ar" ? "خطّط لزيارتك ←" : "Plan your visit →"}</Link>
        <Link href="/ask" className="card p-5 font-bold text-pine hover:border-evergreen">{lang === "ar" ? "اسأل الإمام بخصوصية ←" : "Ask the imam privately →"}</Link>
        <Link href="/programs" className="card p-5 font-bold text-pine hover:border-evergreen">{lang === "ar" ? "البرامج ←" : "See programs →"}</Link>
      </section>
    </div>
  );
}
