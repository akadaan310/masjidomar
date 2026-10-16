# Showcase script (in-person demo, ~10 minutes)

## Before you go
1. `npx supabase start && npx supabase db reset` (fresh sample data), then `npm run demo:bootstrap`
   (fresh passwords in `DEMO_ACCESS.txt` — keep it on your laptop, never on screen).
2. `npm run build && npm start` → http://localhost:3000. Open three browser profiles (admin, imam, member)
   so sessions don't collide, plus a TV/second window on `/display`.
3. **Phone demo without deploying publicly:** run the app on your laptop and use either
   (a) the same Wi-Fi: `npm start -- -H 0.0.0.0` and open `http://<laptop-ip>:3000` (set `NEXT_PUBLIC_SITE_URL`
   accordingly and add it to `additional_redirect_urls` in `supabase/config.toml`), or (b) an access-restricted
   HTTPS tunnel you control (e.g. Cloudflare Tunnel with Access/email-OTP, or Tailscale Funnel limited to your
   tailnet). Never leave a tunnel open unattended, never use the demo bootstrap against a public staging
   project without `DEMO_STAGING_HOST` and per-person accounts, and rotate passwords (re-run bootstrap) after.

## The walkthrough
1. **First impression (public, phone).** Home: concept-preview banner, bilingual identity, live Tampa clock,
   Hijri date, today's adhan vs iqamah, next prayer, "Demo schedule" honesty banner, community pulse. Tap the
   language toggle → Arabic RTL. Open **New here?** → the six-step bilingual welcome path.
2. **Admin updates a prayer time** (`/admin/login` → *Prayer editor*). "Edit as new draft (copy current)" →
   change Dhuhr to a fixed time → watch the preview and any adhan-conflict warnings → try *Publish* without the
   attestation (refused) → tick it → publish. Show `/prayer-times` and `/display` now show the new time
   (display refreshes via Realtime, polling as fallback). *Audit log* shows who changed what.
3. **Member asks privately** (member profile, `/ask`). Explain who can read it; submit; the private thread opens
   with progress steps. (For a brand-new account: `/signup` → verification email in Mailpit → confirmed.)
4. **Imam answers** (`/imam/login`). Inbox (sensitive items hide previews; name hidden unless the member opted
   in) → open → *Acknowledge* → write a draft → preview exactly what the asker sees → tick review → *Send to asker
   only*. Add an internal note (never visible to the member).
5. **Member sees the answer** — unread badge on *My community*, reply in the thread, optional respectful
   follow-up, download-my-data.
6. **Admin sees only aggregates** — *Today* tiles and *Question queue* show counts, category, waiting time,
   assignment — no subject, text or asker. Mention break-glass (reason required, permanently logged).
7. **Role boundaries** — sign in to `/admin/login` with the member account → refused; visit `/admin` as member →
   friendly "authorised staff" page, no data.

## Talking points
* Nothing is published as official: concept mode, sample badges, demo prayer banner, AI images captioned.
* Privacy is enforced by the database, not just the screens (21 automated security tests).
* Everything the masjid must confirm is listed in `docs/CONTENT_PROVENANCE.md` and `SECRETS_CHECKLIST.md`.
