-- Rollback for 20261016000003_content.sql (destroys announcements, programs, events, RSVPs, volunteering, media metadata, FAQ).
drop policy if exists "public-media editors insert" on storage.objects;
drop policy if exists "public-media editors update" on storage.objects;
drop policy if exists "public-media editors delete" on storage.objects;
drop policy if exists "private-documents owner or admin read" on storage.objects;
drop policy if exists "private-documents owner insert" on storage.objects;
-- Buckets must be emptied via the Storage API before deletion.
drop function if exists public.event_rsvp_totals(uuid[]), public.cancel_rsvp(uuid), public.rsvp_event(uuid, smallint, boolean, boolean);
drop table if exists public.saved_items, public.public_faq, public.display_presets, public.media_assets, public.volunteer_inquiry_notes,
  public.volunteer_inquiries, public.volunteer_opportunities, public.event_registrations, public.events, public.programs, public.announcements cascade;
drop function if exists private.volunteer_inquiry_defaults();
drop type if exists public.audience, public.content_status;
