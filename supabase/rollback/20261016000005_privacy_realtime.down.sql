-- Rollback for 20261016000005_privacy_realtime.sql (destroys notification prefs, outbox, data requests).
alter publication supabase_realtime drop table public.prayer_publications, public.announcements, public.display_presets, public.question_messages;
drop function if exists public.admin_today_summary();
drop function if exists public.export_my_data();
drop function if exists public.admin_resolve_data_request(uuid, text, text);
drop trigger if exists question_messages_notify on public.question_messages;
drop function if exists private.enqueue_question_update();
drop trigger if exists profiles_notification_prefs on public.profiles;
drop function if exists private.create_notification_prefs();
drop table if exists public.data_requests, public.notification_outbox, public.notification_preferences;
