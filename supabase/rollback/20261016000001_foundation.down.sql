-- Rollback for 20261016000001_foundation.sql. Run the other rollbacks first (reverse order).
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.my_roles(), public.admin_staff_list(), public.admin_member_list(text, integer, integer),
  public.admin_set_account_status(uuid, public.account_status), public.admin_revoke_role(uuid, public.staff_role), public.admin_grant_role(uuid, public.staff_role);
drop table if exists public.audit_events, public.settings_revisions, public.site_settings, public.staff_roles, public.profiles cascade;
drop schema if exists private cascade;
drop type if exists public.ui_language, public.account_status, public.staff_role;
