# Architecture

## Layout
```
src/app/(site)/        public + member pages (shared header/footer, concept banner)
src/app/admin/(public) /admin/login              src/app/admin/(console)  guarded admin console
src/app/imam/(public)  /imam/login               src/app/imam/(desk)      guarded imam desk
src/app/display        prayer-hall screen (kiosk, no auth, public data only)
src/app/api/display    JSON for the screen's refresh       src/app/calendar/[slug]  .ics files
src/app/auth/*         email-link callbacks (PKCE code exchange, token-hash verify)
src/app/account/export member data export (JSON)           src/app/admin/export/*  admin-only CSV
src/app/actions/*      server actions (auth, member, imam, prayer, admin) — Zod-validated, role-checked
src/lib/               auth DAL, Supabase clients, prayer engine, markdown, ics, validation, i18n
src/components/        brand, site chrome, prayer UI, display, forms, member, staff
src/content/welcome.ts bilingual Path of Welcome copy
supabase/migrations    schema, RLS, RPCs (5 files)   supabase/seed.sql  local-only sample rows
supabase/rollback      destructive down scripts      scripts/bootstrap-demo.mjs  demo accounts
tests/unit  tests/integration (RLS)  tests/e2e (workflow, a11y, screenshots)
```

## Request flow
1. `src/proxy.ts` (Next 16 "proxy", formerly middleware) refreshes the Supabase session cookie and adds
   `noindex`/`no-store` headers on private areas. It is **not** the authorization layer.
2. Pages call the Data Access Layer (`src/lib/auth.ts`): `supabase.auth.getUser()` (validated by the Auth
   server) + `my_roles()` RPC, which reads the protected `staff_roles` table.
3. Layouts for `/admin` and `/imam` render a friendly *forbidden* state (no data queried) for wrong roles, and
   a *two-step verification required* state when `require_staff_mfa` is on and the session is not `aal2`.
4. Every server action re-checks the role (`assertRole`) and validates input with Zod; the database then
   enforces the same rules again through RLS and SECURITY DEFINER RPCs. Direct API calls with a user's token
   hit the same wall (see `tests/integration/rls.test.ts`).
5. Rendering is per-request (`force-dynamic`, Cache Components off) because nearly every page shows live,
   permission-dependent data; server actions call `revalidatePath` for client router caches.

## Prayer engine (`src/lib/prayer/engine.ts`)
* **Adhan** = `adhan` library, masjid coordinates, publication's method/madhab/adjustments. Dates are local
  `America/New_York` keys; adhan receives y/m/d components so the server's own TZ is irrelevant.
* **Iqamah** = admin rules only: date override → weekday rule → daily rule → otherwise *awaiting*. An
  "N minutes after adhan" rule exists only if an admin explicitly selected it and is labelled in the UI.
* **Publications** are versioned: one draft at a time; publish requires every daily iqamah plus an explicit
  verification attestation (`publish_prayer_publication`); published rows are immutable; future
  `effective_from` = scheduled change. The effective one is the latest `effective_from ≤ today`.
* In concept mode every schedule shows "Demo schedule — not current prayer times", even if published by a
  (demo) admin, so no believable official timetable can appear before launch.

## Realtime
Published to `supabase_realtime`: `prayer_publications`, `announcements`, `display_presets` (public rows) and
`question_messages` (RLS-filtered per subscriber; drafts only reach their author). `questions` is deliberately
not published. Clients refetch server-rendered state on events and also poll (60 s display, 5 min prayer page,
60 s thread), so they work without Realtime. The display shows "last synced", warns after 15 min without a
successful sync, re-fetches at local midnight, and goes quiet (no rotation) for 15 min after each iqamah.

## i18n
UI chrome and key surfaces (home, prayer table, display, welcome path) are bilingual via a `lang` cookie;
`<html lang dir>` switches to RTL. Arabic is real text in Noto Naskh Arabic; Latin addresses/phones use
`bidi-isolate`. Content tables carry optional `title_ar`/`body_ar_md`.
