import type { Metadata } from "next";
import Link from "next/link";
import { Eye, EyeOff, LifeBuoy, Lock, MailCheck, UserCheck } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site";
import { QuestionForm } from "@/components/member/QuestionForm";

export const metadata: Metadata = {
  title: "Ask the Imam",
  description: "Ask the imam a private question. Only you and authorised imam staff can read it.",
};

export default async function AskPage() {
  const [user, { settings }] = await Promise.all([getSessionUser(), getSiteSettings()]);
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] [&>*]:min-w-0">
        <div>
          <p className="eyebrow">The private imam desk</p>
          <h1 className="font-display mt-2 text-4xl leading-tight text-pine sm:text-5xl">Ask the Imam</h1>
          <p className="mt-4 text-lg text-muted">
            Questions about prayer, family, faith or community life deserve a thoughtful, human reply — and privacy. Write in your own words.
          </p>
          <h2 className="mt-10 font-bold text-pine">Who can read your question</h2>
          <ul className="mt-4 space-y-4">
            <li className="flex gap-3">
              <Lock aria-hidden className="mt-1 size-5 shrink-0 text-evergreen" />
              <span>
                <strong>You</strong> and <strong>authorised imam staff</strong> only. It is never public and has no share link.
              </span>
            </li>
            <li className="flex gap-3">
              <EyeOff aria-hidden className="mt-1 size-5 shrink-0 text-evergreen" />
              <span>
                <strong>Administrators</strong> see counts and categories, not your words. Exceptional access (for example, a safeguarding concern) is
                logged with a written reason.
              </span>
            </li>
            <li className="flex gap-3">
              <UserCheck aria-hidden className="mt-1 size-5 shrink-0 text-evergreen" />
              <span>You choose whether the imam sees your display name.</span>
            </li>
            <li className="flex gap-3">
              <Eye aria-hidden className="mt-1 size-5 shrink-0 text-evergreen" />
              <span>
                Answers go <strong>only to you</strong>. A public Q&amp;A version is written separately, anonymised, and only if you opt in.
              </span>
            </li>
            <li className="flex gap-3">
              <MailCheck aria-hidden className="mt-1 size-5 shrink-0 text-evergreen" />
              <span>Replies are written by people. Response times vary; there is no automatic or AI-generated answer.</span>
            </li>
          </ul>
          <div className="mt-8 rounded-2xl border-s-4 border-danger bg-danger/5 p-5 text-sm">
            <p className="flex items-center gap-2 font-bold text-danger">
              <LifeBuoy aria-hidden className="size-4" /> In an emergency
            </p>
            <p className="mt-1 text-ink">
              If you or someone else is in danger, call <strong>911</strong>. For a mental-health crisis in the US, call or text <strong>988</strong>.
              This desk is not monitored around the clock.
              {settings.support_escalation_url && (
                <>
                  {" "}
                  <a href={settings.support_escalation_url} className="font-semibold underline" rel="noopener noreferrer">
                    Other support options
                  </a>
                  .
                </>
              )}
            </p>
          </div>
          {settings.imam_hours_note && <p className="mt-6 rounded-2xl bg-sage-100 p-4 text-sm text-pine">{settings.imam_hours_note}</p>}
          <p className="mt-6 text-sm text-muted">
            Looking for general answers? Read the{" "}
            <Link href="/faq" className="font-semibold text-evergreen underline">
              curated questions &amp; answers
            </Link>
            .
          </p>
        </div>

        <section aria-labelledby="ask-form" className="card h-fit p-6 sm:p-8">
          <h2 id="ask-form" className="font-display text-2xl text-pine">
            Write your question
          </h2>
          {!user ? (
            <div className="mt-4 space-y-4">
              <p className="text-muted">
                To keep questions private and replies reaching the right person, a free account with a verified email is required. We only store your
                email, an optional name and language.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup" className="btn btn-primary">
                  Create a free account
                </Link>
                <Link href="/login?next=/ask" className="btn btn-secondary">
                  Sign in
                </Link>
              </div>
            </div>
          ) : !user.emailConfirmed ? (
            <p className="mt-4 rounded-xl bg-warning-bg p-4 text-warning-ink">Please verify your email address (check your inbox), then return here.</p>
          ) : (
            <div className="mt-6">
              <QuestionForm defaultLanguage={user.language} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
