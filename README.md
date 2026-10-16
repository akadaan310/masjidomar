# Masjid Omar · مسجد عمر — community platform (private concept preview)

A mobile-first website and operations platform for Masjid Omar, 4801 E Busch Blvd, Tampa, FL 33617:
prayer times with separately managed iqamah, a privacy-first **Ask the Imam** desk, programs/RSVP,
a bilingual welcome path, a prayer-hall **display screen**, and distinct **imam** and **admin** workspaces.

> **Status:** proposed digital experience, pending masjid leadership approval. It runs in *concept mode*:
> a preview banner is shown, sample content is labelled, prayer times carry a "Demo schedule" banner and
> search indexing is blocked. Nothing here is official until the masjid approves it (see `SECRETS_CHECKLIST.md`).

## Stack
Next.js 16 (App Router, React 19, TypeScript strict) · Tailwind CSS 4 · Supabase (Auth, Postgres + RLS,
Storage, Realtime) via `@supabase/ssr` · Zod · `adhan` (prayer calculation) · date-fns-tz · Vitest · Playwright + axe.

## Run it locally (≈5 minutes)
Prerequisites: Node 20.9+, Docker.

```bash
npm install
npx supabase start                    # local Postgres/Auth/Storage/Realtime + Mailpit on :54324
npx supabase status -o env            # copy API_URL, PUBLISHABLE_KEY, SECRET_KEY into .env.local
cp .env.example .env.local            # then fill the three values above
npx supabase db reset                 # applies supabase/migrations + local-only supabase/seed.sql
# demo accounts (local only): set DEMO_MODE=true and DEMO_TARGET_CONFIRM=I-CONFIRM-THIS-IS-NOT-PRODUCTION in .env.local
npm run demo:bootstrap                # writes gitignored DEMO_ACCESS.txt (0600) — passwords are never printed
npm run dev                           # http://localhost:3000
```

Logins: members `/login`, imam `/imam/login`, admin `/admin/login`. Credentials are in `DEMO_ACCESS.txt`;
re-running the bootstrap rotates them. Verification emails land in Mailpit at http://127.0.0.1:54324.

## Checks
```bash
npm run lint && npm run typecheck
npm test                                            # unit tests (prayer engine, markdown XSS, ICS, validation)
node --env-file=.env.local node_modules/.bin/vitest run tests/integration   # RLS tests against the local DB
npm run build && npm start &                        # then:
npx supabase db reset && npm run demo:bootstrap && npx playwright test     # E2E workflow, axe, screenshots
npx supabase db lint --level warning
```

## Documentation
| Doc | What it covers |
| --- | --- |
| `docs/SHOWCASE.md` | Step-by-step in-person demo script |
| `docs/ARCHITECTURE.md` | Structure, data flow, prayer engine, realtime |
| `docs/SECURITY_AND_RLS.md` | Roles, RLS matrix, RPCs, hardening, test evidence |
| `docs/CONTENT_PROVENANCE.md` | What is verified, sample, AI-assisted or awaiting approval |
| `docs/ASSET_MANIFEST.md` | Every image/brand file, source and publication status |
| `docs/DEPLOYMENT_HANDOFF.md` | Staging/production setup, migrations, rollback, backups |
| `docs/KNOWN_LIMITATIONS.md` | Honest gaps and the feature completion matrix |
| `docs/mission-control-progress.md` | Execution checklist and test/measurement results |
| `SECRETS_CHECKLIST.md` | Handing over to the masjid: invites, rotation, domain, removing demo data |

The original brief and supplied research are preserved in `docs/source-package/`; supplied images in `assets/`.
