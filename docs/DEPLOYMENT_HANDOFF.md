# Deployment handoff

**Not deployed.** No Vercel project, DNS change, public domain or production database has been touched. Do
these only with written approval from masjid leadership, using masjid-owned accounts.

## 1. Supabase (masjid-owned project)
1. Create the project in an organisation owned by the masjid. Region: `us-east-1` (closest to Tampa).
2. `npx supabase link --project-ref <ref>` then `npx supabase db push` — applies `supabase/migrations/*`.
   `supabase/seed.sql` is **not** pushed (local-only sample data).
3. Auth settings (dashboard): enable email confirmations; set Site URL + redirect URLs to the real domain
   (`https://<domain>/auth/callback`); configure a custom SMTP sender; password minimum ≥ 10 with
   letters+digits; enable TOTP MFA; review rate limits; disable unused providers.
4. Storage buckets `public-media` / `private-documents` are created by the migration.
5. Regenerate types if the schema changes: `npm run db:types`.
6. Backups: enable PITR on a paid plan or schedule `pg_dump`; rehearse a restore to a staging project quarterly.

## 2. Hosting (e.g. Vercel, masjid-owned team)
Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY` (server only, never `NEXT_PUBLIC_`), `NEXT_PUBLIC_SITE_URL`. Do **not** set any
`DEMO_*` variables in production. Build: `npm run build`; Node ≥ 20.9.

## 3. First administrator (no demo script in production)
1. The future admin signs up normally and verifies their email.
2. In the Supabase SQL editor (owner access), once: `insert into public.staff_roles (user_id, role) select id, 'admin' from auth.users where email = '<their email>';`
3. They grant `imam`/`editor`/`moderator` from */admin/members* (password re-confirmation + audit log).
4. Staff enrol TOTP at */account/security*, then an admin turns on *Require two-step verification*.

## 4. Going official (after approval)
Enter verified contact/accessibility/parking/giving details and mark them verified → upload approved photos with
rights/consent and switch the hero to *Approved photograph* → publish a real prayer schedule with attestation →
replace sample content → *Settings*: turn off concept mode (requires typed confirmation), then allow indexing.
Sample rows disappear from public view automatically; delete them afterwards (see `SECRETS_CHECKLIST.md`).

## Migrations & rollback
* Apply: `npx supabase db push` (hosted) / `npx supabase db reset` (local).
* New changes: `npx supabase migration new <name>`; never edit an applied migration.
* Rollback: forward-fix preferred. Destructive down scripts are in `supabase/rollback/` (apply in reverse
  order after a backup and member-data export; verified locally to remove the schema cleanly).

## Monitoring
No third-party analytics or error tracking is installed (privacy). Use Supabase logs and the hosting platform's
logs; never log question content.
