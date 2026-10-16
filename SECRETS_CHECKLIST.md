# Secrets & handover checklist

The operator must **not** become the default administrator of a production instance without express,
written mosque authorisation. Everything below is done by, or with, masjid leadership.

## Credentials
- [ ] `.env.local` and `DEMO_ACCESS.txt` are gitignored — confirm with `git check-ignore .env.local DEMO_ACCESS.txt`.
- [ ] Never paste `SUPABASE_SECRET_KEY` into chat, tickets, screenshots or a `NEXT_PUBLIC_` variable.
- [ ] Rotate demo passwords after every demo: `npm run demo:bootstrap` (fresh random passwords each run).
- [ ] Revoke a demo account immediately: disable it in */admin/members*, or delete it in Supabase Auth.
- [ ] If a secret key leaks: roll it in Supabase (Settings → API Keys), update hosting env vars, redeploy.

## Mosque-owned staff accounts
- [ ] Masjid creates/owns the Supabase project, hosting team and domain registrar account.
- [ ] First admin bootstrapped per `docs/DEPLOYMENT_HANDOFF.md` §3 (their own signup, one SQL insert).
- [ ] Imam(s) invited via */admin/members → Invite staff*, then granted the `imam` role.
- [ ] All staff enrol two-step verification; then enable *Require two-step verification* in Settings.
- [ ] Remove any operator/developer roles before launch (*Members & roles* → Remove; audited).

## Domain
- [ ] Masjid registers/owns the domain; DNS changes only with their approval.
- [ ] Set `NEXT_PUBLIC_SITE_URL` and Supabase Auth Site URL/redirects to the domain; configure SMTP sender on it.

## Content approvals
- [ ] Name spelling, address, coordinates, phone, email (mark verified in Settings).
- [ ] Prayer calculation method, Asr rule, adjustments, iqamah and Jumu'ah times (published with attestation).
- [ ] Photos with rights and consent; replace AI concept images; hero → *Approved photograph*.
- [ ] Brand identity (draft mark/lockups) approved or replaced.
- [ ] Privacy notice and terms reviewed and adopted; retention period agreed.
- [ ] Giving information (only official, leadership-approved channels).

## Remove all demo fixtures before launch
```sql
delete from public.questions where is_sample;           -- demo Q&A
delete from public.announcements where is_sample;
delete from public.events where is_sample;
delete from public.programs where is_sample;
delete from public.volunteer_opportunities where is_sample;
delete from public.public_faq where is_sample;
delete from public.media_assets where ai_generated and not publish_approved;
-- Sample prayer publications are immutable once published; archive them instead:
update public.prayer_publications set status = 'archived' where is_sample and status = 'published';
```
Then delete the `*-demo@example.test` users in Supabase Auth. (On a fresh production project none of these
exist, because `seed.sql` and the bootstrap script are never run there.)
