# Known limitations & feature completion matrix

Legend: **Working** = implemented and exercised against the real local backend · **Working (untested path)** =
implemented, not covered by an automated test · **Demo-only** = sample/fixture content · **Blocked** = needs an
external decision, account or approval.

## Feature matrix
| Area | Feature | Status | Evidence |
| --- | --- | --- | --- |
| Public | Home (hero, bilingual identity, live clock, today's prayers, next prayer, pulse, events, invitations) | Working | E2E + screenshots |
| Public | Prayer times (adhan vs iqamah, Jumu'ah, overrides, Hijri, sunset note, method notes) | Working | Unit 20 tests + E2E |
| Public | Visit, programs (search/filter), event detail, RSVP + waitlist, `.ics` | Working | RLS tests (RSVP); pages screenshot/axe |
| Public | Announcements (search, urgent, scheduled publish via `publish_at`, expiry, audience) | Working | RLS test (member-only) |
| Public | FAQ (imam-approved, save), Volunteer (interest form), Support (no payments), About/Privacy/Terms/Accessibility, 404/error | Working | axe 21/21 |
| Public | Path of Welcome (EN/AR, to-be-verified flags) | Working | axe (EN + AR) |
| Display | `/display` 16:9 board, quiet mode, auto-quiet after iqamah, ticker, last-synced, stale warning, midnight rollover, fullscreen, draft preview | Working | E2E (updates after publish), fits 1080p & 4K |
| Display | Realtime push | Working (untested path) | Subscriptions wired; E2E relies on reload/polling |
| Auth | Signup with email verification (Mailpit), login per portal, wrong-role refusal, forgot/reset, sign-out | Working | E2E (reset flow untested path) |
| Auth | TOTP MFA enrol/verify, DB-enforced staff MFA requirement | Working (untested path) | `has_role` → `mfa_ok()`; manual UI only |
| Member | Ask (consent, sensitivity, name visibility, FAQ consent), private thread, edits before reply, follow-ups, close, unread counts | Working | E2E + RLS |
| Member | RSVP history, saved items, settings, notification prefs, data export, deletion request | Working | Pages render; export RPC; deletion via admin (RLS test cascade) |
| Imam | Inbox filters, sensitive excerpt hiding, claim, acknowledge, clarify, draft/preview/send, close/reopen, internal notes, FAQ proposal, availability note | Working | E2E + RLS |
| Admin | Today aggregates, prayer editor (draft/preview/conflict warnings/attested publish/history/future dating), announcements, programs/events (+CSV), FAQ moderation, question queue (metadata + break-glass), media (provenance, approval), volunteering, display setup, members (search, roles, disable, invite, data requests), settings (revisioned, launch gate), audit log, page status | Working | Smoke test of all 12 sections + E2E publish + RLS |
| Admin | Staff invitations by email | Blocked locally → works with SMTP | Uses Auth admin invite; Mailpit locally |
| Notifications | Email/SMS delivery | **Blocked** (no provider) | Preferences + outbox only; UI says nothing is sent |
| Payments | Online giving | **Blocked** by design | "Please contact the masjid" until approved |
| Content | All announcements/programs/events/FAQ/prayer times | **Demo-only** | `is_sample`, hidden automatically outside concept mode |
| Imagery | Real photographs | **Blocked** (rights/consent) | AI concept art captioned; references internal |
| Launch | Domain, hosting, production DB, official mode | **Blocked** (masjid approval) | Not deployed |

## Limitations to know
* **Arabic coverage:** site chrome, home, prayer table, display and welcome path are bilingual; long-form
  pages and the staff consoles are English (content tables accept Arabic titles/bodies).
* **Editor:** announcements/programs use a safe Markdown subset with a live public page as preview; there is no
  WYSIWYG or side-by-side draft preview for announcements.
* **Retention:** `question_retention_days` is a policy setting shown in the privacy notice; automatic purge is
  not scheduled (run a periodic SQL job or Supabase cron after approval).
* **Throttling:** login/signup/reset throttles are per server instance (DB-level limits cover questions,
  replies, RSVPs and volunteer forms globally).
* **Coordinates** are an approximate geocode of the address — verify before relying on calculated adhan.
* **Hijri date** uses the Umm al-Qura tabular calendar and is labelled approximate.
* **Private documents bucket** exists with owner/admin policies but has no upload UI yet.
* **Lighthouse (simulated mobile, local production build, 2026-10-16):** home Performance 88–90 across runs,
  Accessibility 100, Best Practices 100; prayer-times Performance 92, Accessibility 100. SEO scores (58–69) are
  low **by design** because concept mode sends `noindex`.
* **Not done (stretch):** topic-trend analytics, SMS/WhatsApp reminders, khutbah audio archive, CI workflow file.
