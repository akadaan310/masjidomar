import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  HandHeart,
  HeartHandshake,
  MapPin,
  MessageCircleQuestion,
  Megaphone,
  Phone,
  Sparkles,
  Accessibility,
} from "lucide-react";
import { getPrayerBoard } from "@/lib/prayer/data";
import { formatLongDate, formatTime, hijriDate, PRAYER_LABELS, weekdayOf } from "@/lib/prayer/engine";
import { getSiteSettings, mapsUrl, telHref, fullAddress } from "@/lib/site";
import { getAnnouncements, getUpcomingEvents, getPrograms, getVolunteerOpportunities, getHeroMedia, formatEventWhen } from "@/lib/content";
import { getLang, t } from "@/lib/i18n";
import { PrayerTable } from "@/components/prayer/PrayerTable";
import { PrayerStateBanner } from "@/components/prayer/PrayerStateBanner";
import { LiveClock, Countdown } from "@/components/prayer/LiveClock";
import { DisclosedImage } from "@/components/ui/DisclosedImage";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { plainExcerpt } from "@/lib/markdown";

export default async function HomePage() {
  const lang = await getLang();
  const d = t(lang);
  const [{ settings }, board, announcements, events, programs, opportunities, media] = await Promise.all([
    getSiteSettings(),
    getPrayerBoard(),
    getAnnouncements({ limit: 4 }),
    getUpcomingEvents(3),
    getPrograms(),
    getVolunteerOpportunities(),
    getHeroMedia(),
  ]);
  const now = board.now;
  const hero = media.find((m) => m.storage_path.includes("exterior")) ?? null;
  const hall = media.find((m) => m.storage_path.includes("prayer-hall")) ?? null;
  const showConceptHero = settings.hero_source === "concept" && hero?.ai_generated && settings.concept_mode;
  const isFriday = weekdayOf(board.dateKey) === 5;
  const urgent = announcements.find((a) => a.urgency === "urgent");
  const latest = announcements.find((a) => a.urgency !== "urgent") ?? announcements[0];
  const nextEvent = events.find((e) => e.status === "published");
  const opportunity = opportunities[0];

  // Structured data only once the site is official, and only with verified details.
  const jsonLd = settings.concept_mode
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "Mosque",
        name: settings.org_name_en,
        alternateName: settings.org_name_ar,
        address: { "@type": "PostalAddress", streetAddress: settings.address_line, addressLocality: settings.city, addressRegion: settings.region, postalCode: settings.postal_code, addressCountry: "US" },
        geo: { "@type": "GeoCoordinates", latitude: settings.latitude, longitude: settings.longitude },
        ...(settings.phone_verified && settings.phone ? { telephone: settings.phone } : {}),
        ...(settings.email_verified && settings.email ? { email: settings.email } : {}),
      };

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      {urgent && (
        <section aria-label="Urgent announcement" className="bg-brass/25">
          <div className="container-page flex flex-wrap items-center gap-3 py-3 text-pine">
            <Megaphone aria-hidden className="size-5" />
            <p className="font-semibold">{urgent.title}</p>
            <SampleBadge show={urgent.is_sample} />
            <Link href={`/announcements#${urgent.slug}`} className="ms-auto text-sm font-bold underline underline-offset-4">
              Read
            </Link>
          </div>
        </section>
      )}

      {/* HERO */}
      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-pine text-ivory">
        {showConceptHero && hero ? (
          <DisclosedImage
            src={hero.storage_path}
            alt={lang === "ar" && hero.alt_text_ar ? hero.alt_text_ar : hero.alt_text}
            credit={hero.credit}
            aiGenerated
            priority
            className="absolute inset-0 -z-10"
            hideCaption
          />
        ) : (
          <div aria-hidden className="pattern-lattice absolute inset-0 -z-10" />
        )}
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-pine via-pine/75 to-pine/45" />
        {showConceptHero && (
          <p className="absolute end-3 top-3 z-10 max-w-[90%] rounded-full bg-pine/85 px-3 py-1 text-[0.72rem] font-semibold text-ivory">
            Concept visualization (AI-assisted) — not a photograph of Masjid Omar
          </p>
        )}
        <div className="container-page flex min-h-[34rem] flex-col justify-end pt-24 pb-36 sm:min-h-[38rem] lg:pb-40">
          <p className="eyebrow !text-sage">
            {lang === "ar" ? "تامبا، فلوريدا" : "Tampa, Florida"} · <span className="bidi-isolate" dir="ltr">{settings.address_line}</span>
          </p>
          <h1 id="hero-title" className="mt-3 max-w-3xl">
            <span className="font-display block text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] font-medium tracking-tight">
              {settings.org_name_en}
            </span>
            <span lang="ar" dir="rtl" className="mt-3 block w-fit text-[clamp(2rem,6vw,3.5rem)] leading-tight text-sage">
              {settings.org_name_ar}
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ivory/90 sm:text-xl">
            {lang === "ar" ? "بيتٌ للعبادة، وقلبٌ للمجتمع." : "A home for worship. A heart for community."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={mapsUrl(settings)} target="_blank" rel="noopener noreferrer" className="btn bg-ivory text-pine hover:bg-chalk">
              <MapPin aria-hidden className="size-4" /> {d.directions}
              <span className="sr-only">(opens map in a new tab)</span>
            </a>
            <Link href="/prayer-times" className="btn border border-ivory/40 text-ivory hover:bg-ivory/10">
              {d.prayerTimes}
            </Link>
            <Link href="/ask" className="btn border border-ivory/40 text-ivory hover:bg-ivory/10">
              {d.ask}
            </Link>
            <Link href="/programs" className="btn border border-ivory/40 text-ivory hover:bg-ivory/10">
              {d.programs}
            </Link>
            {settings.phone_verified && settings.phone && (
              <a href={telHref(settings.phone)} className="btn border border-ivory/40 text-ivory hover:bg-ivory/10">
                <Phone aria-hidden className="size-4" /> {d.call}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* TODAY'S PRAYERS — overlaps the hero */}
      <section aria-labelledby="today-title" className="container-page relative z-10 -mt-24 lg:-mt-28">
        <div className="card grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.9fr_1.4fr]">
          <div className="flex flex-col gap-4">
            <div>
              <h2 id="today-title" className="eyebrow">{lang === "ar" ? "صلوات اليوم" : "Today at the masjid"}</h2>
              <p className="font-display mt-2 text-2xl text-pine sm:text-3xl">{formatLongDate(now, lang)}</p>
              <p className="mt-1 text-sm text-muted">
                {hijriDate(now, lang)} <span className="text-xs">({lang === "ar" ? "تقريبي" : "approx."})</span> ·{" "}
                <LiveClock initial={now.toISOString()} lang={lang} className="font-semibold text-pine" /> ET
              </p>
            </div>
            {board.next && (
              <div className="rounded-2xl bg-evergreen p-5 text-ivory" aria-live="polite">
                <p className="text-sm font-semibold text-sage">{d.next}</p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
                  <span className="font-display text-4xl">{lang === "ar" ? PRAYER_LABELS[board.next.key].ar : PRAYER_LABELS[board.next.key].en}</span>
                  <span className="text-lg text-sage">
                    <Countdown target={board.next.adhan.toISOString()} lang={lang} />
                  </span>
                </p>
                <p className="mt-2 text-sm text-ivory/90">
                  {d.adhan} {formatTime(board.next.adhan, lang)}
                  {board.next.iqamah?.status === "set" && (
                    <>
                      {" "}· {d.iqamah} {formatTime(board.next.iqamah.at, lang)}
                    </>
                  )}
                </p>
              </div>
            )}
            <PrayerStateBanner board={board} compact />
            <Link href="/prayer-times" className="btn btn-secondary self-start">
              {lang === "ar" ? "الجدول الكامل والجمعة" : "Full schedule & Jumu'ah"} <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
            </Link>
          </div>
          <PrayerTable
            rows={board.rows}
            lang={lang}
            highlight={board.next && board.next.dateKey === board.dateKey ? board.next.key : null}
            caption="Today's prayer times"
            isFriday={isFriday}
          />
        </div>
      </section>

      {/* COMMUNITY PULSE */}
      <section aria-labelledby="pulse-title" className="container-page mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{lang === "ar" ? "نبض المجتمع" : "Community pulse"}</p>
            <h2 id="pulse-title" className="font-display mt-2 text-3xl text-pine sm:text-4xl">
              {lang === "ar" ? "ما الجديد في المسجد" : "What's happening"}
            </h2>
          </div>
          <Link href="/announcements" className="btn btn-ghost">
            {d.announcements} <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <PulseCard
            icon={<Megaphone aria-hidden className="size-5" />}
            label={lang === "ar" ? "آخر إعلان" : "Latest announcement"}
            title={latest ? (lang === "ar" && latest.title_ar ? latest.title_ar : latest.title) : null}
            body={latest ? plainExcerpt(latest.body_md, 120) : null}
            href={latest ? `/announcements#${latest.slug}` : "/announcements"}
            sample={latest?.is_sample}
            empty="No announcements have been published yet."
          />
          <PulseCard
            icon={<CalendarDays aria-hidden className="size-5" />}
            label={lang === "ar" ? "الفعالية القادمة" : "Coming up"}
            title={nextEvent ? (lang === "ar" && nextEvent.title_ar ? nextEvent.title_ar : nextEvent.title) : null}
            body={nextEvent ? formatEventWhen(nextEvent.starts_at, nextEvent.ends_at, lang) : null}
            href={nextEvent ? `/programs/events/${nextEvent.slug}` : "/programs"}
            sample={nextEvent?.is_sample}
            empty="No upcoming events have been published yet."
          />
          <PulseCard
            icon={<HandHeart aria-hidden className="size-5" />}
            label={lang === "ar" ? "فرصة تطوع" : "Ways to help"}
            title={opportunity ? (lang === "ar" && opportunity.title_ar ? opportunity.title_ar : opportunity.title) : null}
            body={opportunity ? opportunity.commitment : null}
            href="/volunteer"
            sample={opportunity?.is_sample}
            empty="Volunteer opportunities will appear here once approved."
          />
        </div>
      </section>

      {/* WORSHIP & COMMUNITY STORY */}
      <section aria-labelledby="story-title" className="container-page mt-24 grid items-center gap-10 lg:grid-cols-2">
        {hall && settings.concept_mode ? (
          <DisclosedImage
            src={hall.storage_path}
            alt={lang === "ar" && hall.alt_text_ar ? hall.alt_text_ar : hall.alt_text}
            credit={hall.credit}
            aiGenerated={hall.ai_generated}
            className="aspect-[4/3] rounded-[2rem] shadow-xl"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        ) : (
          <div aria-hidden className="pattern-rug aspect-[4/3] rounded-[2rem]" />
        )}
        <div>
          <p className="eyebrow">{lang === "ar" ? "مكان للسكينة" : "A place of stillness"}</p>
          <h2 id="story-title" className="font-display mt-3 text-3xl leading-tight text-pine sm:text-[2.6rem]">
            {lang === "ar" ? "مسجد في الحيّ، أبوابه مفتوحة" : "A neighborhood masjid with an open door"}
          </h2>
          <div className="prose-masjid mt-5 space-y-4 text-muted">
            <p>
              On Busch Boulevard, a modest building with a glass entrance and a green-and-white sign opens onto a quiet prayer hall. It is a
              place to pray, to learn, and to be known by name.
            </p>
            <p>
              This website is being prepared to make that welcome easier to find: accurate prayer times set by the masjid, a private way to
              ask the imam, and a calm path for anyone visiting for the first time.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/visit" className="btn btn-primary">{lang === "ar" ? "خطط لزيارتك" : "Plan a visit"}</Link>
            <Link href="/about" className="btn btn-secondary">{d.about}</Link>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section aria-labelledby="events-title" className="container-page mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="events-title" className="font-display text-3xl text-pine sm:text-4xl">{lang === "ar" ? "فعاليات قادمة" : "Upcoming gatherings"}</h2>
          <Link href="/programs" className="btn btn-ghost">
            {lang === "ar" ? "كل البرامج" : "All programs"} <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-pine/20 p-6 text-muted">
            No events have been published yet. When the masjid adds programs, they will appear here with RSVP and calendar links.
          </p>
        ) : (
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {events.map((e) => (
              <li key={e.id} className="card flex flex-col p-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-evergreen">{formatEventWhen(e.starts_at, e.ends_at, lang)}</span>
                </div>
                <h3 className="font-display mt-3 text-xl text-pine">{lang === "ar" && e.title_ar ? e.title_ar : e.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{plainExcerpt(e.description_md, 140)}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                  <SampleBadge show={e.is_sample} />
                  {e.status === "cancelled" && <span className="badge bg-danger text-white">Cancelled</span>}
                  <Link href={`/programs/events/${e.slug}`} className="btn btn-secondary ms-auto min-h-10 px-4 text-sm">
                    Details<span className="sr-only">: {e.title}</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* WELCOME + ASK + ACCESSIBILITY */}
      <section aria-label="Getting started" className="container-page mt-24 grid gap-5 lg:grid-cols-3">
        <InviteCard
          tone="navy"
          icon={<Sparkles aria-hidden className="size-6" />}
          title={lang === "ar" ? "أول زيارة؟" : "First time here?"}
          body={
            lang === "ar"
              ? "دليل لطيف خطوة بخطوة للزوار والمسلمين الجدد — دون الحاجة إلى حساب."
              : "A gentle, step-by-step path for visitors and new Muslims — no account needed."
          }
          href="/welcome"
          cta={lang === "ar" ? "ابدأ طريق الترحيب" : "Begin the welcome path"}
        />
        <InviteCard
          tone="green"
          icon={<MessageCircleQuestion aria-hidden className="size-6" />}
          title={d.ask}
          body={
            lang === "ar"
              ? "اسأل سؤالك بخصوصية. لا يطّلع عليه إلا أنت والإمام المخوَّل."
              : "Ask privately. Only you and authorised imam staff can read your question."
          }
          href="/ask"
          cta={lang === "ar" ? "كيف يعمل" : "How it works"}
        />
        <InviteCard
          tone="sand"
          icon={<Accessibility aria-hidden className="size-6" />}
          title={lang === "ar" ? "هل تحتاج إلى ترتيب خاص؟" : "Need something to make your visit easier?"}
          body={
            lang === "ar"
              ? "أخبرنا بما يساعدك. نحن نعمل على توثيق معلومات الوصول بعد التحقق منها."
              : "Tell us what would help. Accessibility details are published only once staff have verified them."
          }
          href="/accessibility"
          cta={lang === "ar" ? "معلومات إمكانية الوصول" : "Accessibility information"}
        />
      </section>

      {/* PROGRAMS + VOLUNTEER */}
      <section aria-labelledby="learn-title" className="container-page mt-24 grid gap-10 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <div>
          <p className="eyebrow">{lang === "ar" ? "تعلّم معًا" : "Learn together"}</p>
          <h2 id="learn-title" className="font-display mt-2 text-3xl text-pine sm:text-4xl">{lang === "ar" ? "البرامج" : "Programs"}</h2>
          {programs.length === 0 ? (
            <p className="mt-6 text-muted">Programs will be listed here once the masjid publishes them.</p>
          ) : (
            <ul className="mt-6 divide-y divide-pine/10 border-y border-pine/10">
              {programs.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <Link href={`/programs/${p.slug}`} className="group flex items-center gap-4 py-4">
                    <span className="flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold text-pine group-hover:underline">{lang === "ar" && p.title_ar ? p.title_ar : p.title}</span>
                        <SampleBadge show={p.is_sample} />
                      </span>
                      <span className="block text-sm text-muted">{p.schedule_note || p.summary}</span>
                    </span>
                    <ArrowRight aria-hidden className="size-5 text-evergreen rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="pattern-rug flex flex-col justify-between rounded-[2rem] p-8 text-ivory">
          <div>
            <HeartHandshake aria-hidden className="size-8 text-brass" />
            <h2 className="font-display mt-4 text-3xl">{lang === "ar" ? "ساهم بوقتك" : "Give your time"}</h2>
            <p className="mt-3 text-ivory/85">
              {lang === "ar"
                ? "شارك في خدمة المسجد. نتواصل معك فقط بموافقتك."
                : "Help care for the masjid and its guests. We only contact you with your permission."}
            </p>
          </div>
          <Link href="/volunteer" className="btn mt-8 self-start bg-ivory text-navy hover:bg-chalk">
            {lang === "ar" ? "فرص التطوع" : "See opportunities"}
          </Link>
        </div>
      </section>

      {/* VISIT STRIP */}
      <section aria-labelledby="visit-title" className="container-page mt-24">
        <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <MapPin aria-hidden className="size-10 shrink-0 text-evergreen" />
          <div className="flex-1">
            <h2 id="visit-title" className="font-display text-2xl text-pine">{lang === "ar" ? "زورونا" : "Find us"}</h2>
            <p className="bidi-isolate mt-1 text-lg text-ink" dir="ltr">{fullAddress(settings)}</p>
          </div>
          <a href={mapsUrl(settings)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            {d.directions}
            <span className="sr-only">(opens map in a new tab)</span>
          </a>
        </div>
      </section>
    </>
  );
}

function PulseCard({
  icon,
  label,
  title,
  body,
  href,
  sample,
  empty,
}: {
  icon: React.ReactNode;
  label: string;
  title: string | null;
  body: string | null;
  href: string;
  sample?: boolean;
  empty: string;
}) {
  return (
    <article className="card flex flex-col p-6">
      <p className="flex items-center gap-2 text-sm font-bold text-evergreen">
        {icon} {label}
      </p>
      {title ? (
        <>
          <h3 className="mt-3 text-lg font-bold text-pine">
            <Link href={href} className="hover:underline">
              {title}
            </Link>
          </h3>
          {body && <p className="mt-1 text-sm text-muted">{body}</p>}
          <div className="mt-auto pt-4">
            <SampleBadge show={Boolean(sample)} />
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      )}
    </article>
  );
}

function InviteCard({
  tone,
  icon,
  title,
  body,
  href,
  cta,
}: {
  tone: "navy" | "green" | "sand";
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  const styles = {
    navy: "bg-navy text-ivory",
    green: "bg-evergreen text-ivory",
    sand: "bg-sand text-pine",
  }[tone];
  return (
    <article className={`flex flex-col rounded-[1.75rem] p-7 ${styles}`}>
      <span className={tone === "sand" ? "text-evergreen" : "text-brass"}>{icon}</span>
      <h2 className="font-display mt-4 text-2xl">{title}</h2>
      <p className={`mt-2 ${tone === "sand" ? "text-muted" : "text-ivory/85"}`}>{body}</p>
      <Link href={href} className={`btn mt-6 self-start ${tone === "sand" ? "btn-primary" : "bg-ivory text-pine hover:bg-chalk"}`}>
        {cta}
      </Link>
    </article>
  );
}
