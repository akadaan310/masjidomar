# Mission control — execution checklist

Source brief: `docs/source-package/MASJID_OMAR_GOLDEN_NINE_CLAUDE_CODE.md`.

## Environment findings
- Repo was empty (branch `claude/new-session-70ntsz`, no commits). App initialised from `create-next-app@16`.
- Toolchain: Node 22, Next.js 16.4.2, React 19.3, Tailwind 4, Supabase CLI 2.121 (local Docker stack,
  Mailpit), Playwright 1.64 with the preinstalled Chromium, Vitest 5, @axe-core/playwright 4.14.
- Cache Components left **off**: every page reads live, permissioned data; root layout is `force-dynamic`.
- Facebook / Google Maps share links were not fetched (would require a logged-in browser); nothing scraped.

## Checklist
- [x] Read package, manifest, research notes; originals preserved in `assets/` and `docs/source-package/`
- [x] Supabase local stack; email confirmation + TOTP MFA + password policy in `supabase/config.toml`
- [x] 5 migrations (foundation/roles/audit, prayer, content/RSVP/storage, private Q&A, privacy/realtime) + rollbacks
- [x] Local-only seed (`is_sample` rows, hidden automatically outside concept mode)
- [x] Design system, fonts, draft SVG identity (mark, mono, reverse, horizontal, stacked, favicon)
- [x] All public routes, display + setup, member area, imam desk, admin console (12 sections)
- [x] Auth: member/imam/admin portals, signup + verification, reset, sign-out, MFA page
- [x] Demo bootstrap (safety switches, rotating passwords, `DEMO_ACCESS.txt` 0600)
- [x] Unit, RLS integration, E2E workflow, accessibility and screenshot suites
- [x] Docs, commit, push

## Results (2026-10-16)
| Check | Result |
| --- | --- |
| `npm run lint` | 0 problems |
| `npm run typecheck` | 0 errors |
| `npm run build` | success, 0 warnings |
| Unit tests (`tests/unit`) | 35 / 35 passed |
| RLS integration (`tests/integration`) | 21 / 21 passed |
| E2E workflow (`tests/e2e/workflow.spec.ts`) | 7 / 7 passed |
| Accessibility + overflow + disclosure (`a11y.spec.ts`) | 21 / 21 passed (0 serious/critical axe violations on 19 pages) |
| Screenshot matrix (`screenshots.spec.ts`) | 23 / 23 passed (no overflow; display fits 1080p and 4K) |
| `supabase db lint --level warning` | no findings |
| RLS enabled on public tables | 29 / 29 |
| Lighthouse (simulated mobile) | Home P 88–90 · A 100 · BP 100; Prayer times P 92 · A 100 · BP 100; SEO low by design (noindex) |

## Bugs found and fixed by the harness
- Deleting any account failed: `ON DELETE SET NULL` on `audit_events.actor_id` was blocked by the append-only
  trigger, and the same for published prayer schedules and FAQ approval → guards now permit only FK
  anonymisation; regression test added.
- Private-thread 404s were sent as HTTP 200 because a route-group `loading.tsx` started streaming → removed.
- Mobile overflow on `/community` and `/admin` from truncating text in grid items → `min-w-0` on grid children.
- Display overflowed 1080p vertically and had low-contrast Arabic on the highlighted card → resized/recoloured.
- Hero image hidden by a `relative`/`absolute` class conflict; AI disclosure caption hidden under the overlay.
- Staff top-bar link accessible name did not include its visible text (axe `label-content-name-mismatch`).
- A concept-mode demo admin could have produced a believable "official" timetable → concept mode always shows
  the demo-schedule banner.

## Screenshots
`docs/screenshots/` (home, prayer-times, ask, community, imam, admin, display × 390/768/1440; display 1920×1080
and 3840×2160) and `docs/screenshots/workflow/01…09` (before/after publish, member ask, imam preview, member
answer, admin aggregate-only view).
