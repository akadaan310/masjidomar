# Security model, RLS and evidence

## Principles
* **Roles live only in `staff_roles`** (`admin | imam | editor | moderator`). Members are any active account.
  Signup metadata is never read for roles; there is no auto-admin; clients have no insert/update grant on
  `staff_roles`. Changes go through `admin_grant_role` / `admin_revoke_role` (admin only, never on yourself,
  audited) or the trusted bootstrap script on a non-production target.
* **Every public table has RLS enabled** (29/29, checked with `pg_tables.rowsecurity`) with explicit
  `revoke all` + minimal grants. Helpers live in the non-exposed `private` schema.
* **Privileged mutations are SECURITY DEFINER RPCs** with `search_path = ''`, an explicit caller check and an
  append-only audit record (metadata only — never question text).
* **Service-role key is server-only** (`src/lib/supabase/admin.ts`, `import "server-only"`), used solely for
  Auth admin operations after a DB role check (ban/unban, invite, delete user) and by the CLI bootstrap.

## Access matrix (enforced in Postgres)
| Data | Anon | Member | Imam | Editor | Moderator | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Published public content | read | read (+ member-audience posts) | read (+ staff posts) | manage | FAQ manage | manage |
| Sample (`is_sample`) rows | only while concept mode | same | same | manage | – | manage |
| Prayer drafts | – | – | – | – | – | manage; publish via RPC |
| Own questions + non-draft replies | – | read; act via RPCs | – | – | – | – |
| Others' questions | – | – | assigned to them, or unassigned when shared queue on | – | metadata via RPC | metadata via RPC; text only via audited break-glass |
| Imam drafts | – | – | own only | – | – | – |
| Internal notes | – | – | authorised imams | – | – | – |
| RSVPs | totals RPC | own | – | totals | – | all (no names/emails in export) |
| Volunteer inquiries / notes | – | own inquiry | – | – | – | all |
| Profiles | – | own (name/lang only) | – | – | – | read + status via RPC |
| `site_settings` | read | read | read (+ hours note RPC) | read | read | update (revisioned) |
| `audit_events` | – | – | – | – | – | read; **no one** can update/delete |

## Hardening checklist
| Threat | Mitigation |
| --- | --- |
| Role escalation | Roles only from `staff_roles`; RPCs check `private.has_role`; no self-grant; re-enter password for role/status changes |
| IDOR | RLS on every row; private thread returns 404 to non-owners (no existence leak); UUID validation |
| Mass assignment | Column-level grants (e.g. profiles: display name/language only); RPCs set owner/status server-side |
| Realtime leakage | `questions` not published; `question_messages` RLS-filtered; drafts visible only to author |
| Unsafe HTML / XSS | Own escaped Markdown subset (no raw HTML, https/mailto/relative links only); JSON-LD `<` escaped; strict CSP |
| CSRF | Server Actions (Origin-checked POST, same-site cookies); `form-action 'self'`; no GET mutations |
| Open redirect | `safeNext()` allows same-site relative paths only |
| SQL injection | Parameterised PostgREST/RPC calls; search terms sanitised for `.or()` filters |
| Brute force / spam | Login 6/15 min per IP+email; signup 5/h/IP; reset 5/h/IP (in-process) + Supabase Auth limits; DB fixed-window limits: questions 3/h & 8/day, replies 20/h, RSVP 20/h, volunteer 5/day; honeypots |
| Unbounded uploads | Bucket 5 MB + MIME allow-list; server re-checks size/type; editors only |
| Sensitive logging | Audit stores ids/metadata only; no third-party analytics or error tracking |
| Clickjacking | `frame-ancestors 'self'` / `X-Frame-Options: SAMEORIGIN` (self only, for the display preview) |
| Staff MFA | TOTP enabled; `require_staff_mfa` makes `has_role()` false until the session is `aal2` (DB-enforced) |
| Account deletion | `ON DELETE CASCADE` removes questions/messages/RSVPs; audit actor anonymised to NULL (only change the append-only guard permits) |

## Evidence (run 2026-10-16, local Supabase)
* `tests/integration/rls.test.ts` — **21/21 passed**: anon blocked from 10 private tables and member/admin RPCs;
  signup metadata `role: admin` grants nothing; member cannot change `profiles.status`; cross-member read/reply/
  close denied; admin gets no question text without break-glass; break-glass needs a ≥15-char reason and is
  audited without text; drafts/notes hidden from asker; answer visible only to asker; FAQ needs consent; imam
  cannot change settings/roles/audit/members; shared-queue off hides unassigned questions; rate limit on 4th
  question; role changes audited, self-grant refused; audit log undeletable even by service role; prayer drafts
  private, direct publish refused, unverified publish refused, published rows locked; sample rows vanish when
  concept mode is off; member-only posts hidden from anon; deleted accounts' questions removed; deleting a staff
  publisher succeeds; disabled imam loses inbox; RSVP capacity + waitlist promotion; registrations private.
* `tests/e2e/workflow.spec.ts` — **7/7 passed** (browser, real backend): wrong-portal login refused, admin
  publish reflected on `/prayer-times` and `/display`, signup + Mailpit verification + private question, other
  member gets 404 and staff-area forbidden, imam acknowledge/draft/preview/send, member sees answer, admin queue
  shows no subject/answer text, sign-out ends the session.
* `npx supabase db lint --level warning` — no findings.

## Operational notes
* The in-process login throttle is per server instance; with several instances, use a shared store (e.g.
  Upstash/Redis) or rely on Supabase Auth's rate limits configured in the dashboard.
* Production must set: SMTP provider, email confirmations on (already in `config.toml` for local), a strong
  password policy (≥10, mixed case + digits locally), `require_staff_mfa = true` after staff enrol.
