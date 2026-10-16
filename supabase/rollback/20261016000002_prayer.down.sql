-- Rollback for 20261016000002_prayer.sql (destroys all prayer schedules and their history).
drop function if exists public.create_prayer_draft(uuid), public.publish_prayer_publication(uuid, boolean);
drop table if exists public.jumuah_sessions, public.prayer_overrides, public.iqamah_schedules, public.prayer_publications, public.prayer_methods cascade;
drop function if exists private.publication_public(uuid), private.guard_publication(), private.guard_publication_children(), private.valid_adjustments(jsonb);
drop type if exists public.iqamah_mode, public.publication_status, public.prayer_name;
