-- Masjid Omar — foundation: private helpers, profiles, staff roles, audit, site settings.
-- Security model: every exposed table has RLS enabled and explicit grants. Privileged state
-- changes go through SECURITY DEFINER functions that check roles from protected tables
-- (never from user-editable metadata) and write an append-only audit record.

create extension if not exists citext with schema extensions;

-- Schema not exposed through the Data API; holds helpers used by policies and RPCs.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.staff_role as enum ('admin', 'imam', 'editor', 'moderator');
create type public.account_status as enum ('active', 'disabled');
create type public.ui_language as enum ('en', 'ar');

-- -----------------------------------------------------------------------------
-- Generic updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Profiles (minimal; no gender, sect, legal name, address or date of birth)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  preferred_language public.ui_language not null default 'en',
  privacy_consent_at timestamptz,
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Staff roles: the ONLY source of privilege. No insert/update grants to clients.
-- -----------------------------------------------------------------------------
create table public.staff_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.staff_role not null,
  assigned_by uuid references auth.users (id) on delete set null,
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users (id) on delete set null
);
create unique index staff_roles_one_active on public.staff_roles (user_id, role) where revoked_at is null;
create index staff_roles_user on public.staff_roles (user_id);

-- -----------------------------------------------------------------------------
-- Site settings (single row) + revisions
-- -----------------------------------------------------------------------------
create table public.site_settings (
  id boolean primary key default true check (id),
  org_name_en text not null default 'Masjid Omar',
  org_name_ar text not null default 'مسجد عمر',
  address_line text not null default '4801 E Busch Blvd',
  city text not null default 'Tampa',
  region text not null default 'FL',
  postal_code text not null default '33617',
  latitude double precision not null default 28.0337 check (latitude between -90 and 90),
  longitude double precision not null default -82.4012 check (longitude between -180 and 180),
  timezone text not null default 'America/New_York' check (timezone = 'America/New_York'),
  phone text not null default '(813) 217-5531',
  phone_verified boolean not null default false,
  email text not null default '',
  email_verified boolean not null default false,
  -- Concept mode: private pre-launch demo. Shows disclosure banner, allows sample content,
  -- blocks search indexing. Turning it off requires explicit mosque approval (see docs).
  concept_mode boolean not null default true,
  allow_indexing boolean not null default false,
  hero_source text not null default 'concept' check (hero_source in ('concept', 'approved_photo', 'none')),
  hero_media_id uuid,
  accessibility_info text not null default '',
  accessibility_verified boolean not null default false,
  parking_info text not null default '',
  parking_verified boolean not null default false,
  giving_info text not null default '',
  giving_verified boolean not null default false,
  imam_hours_note text not null default '',
  support_escalation_url text not null default '' check (support_escalation_url = '' or support_escalation_url ~ '^https://'),
  imam_shared_queue boolean not null default true,
  require_staff_mfa boolean not null default false,
  default_language public.ui_language not null default 'en',
  secondary_language public.ui_language not null default 'ar',
  question_retention_days integer not null default 730 check (question_retention_days between 30 and 3650),
  notification_mode text not null default 'none' check (notification_mode in ('none', 'outbox_only')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
create trigger site_settings_touch before update on public.site_settings
  for each row execute function private.touch_updated_at();
insert into public.site_settings (id) values (true);

create table public.settings_revisions (
  id bigint generated always as identity primary key,
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now(),
  before jsonb not null,
  after jsonb not null
);

-- -----------------------------------------------------------------------------
-- Audit events: append-only, metadata only (never private question text)
-- -----------------------------------------------------------------------------
create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (char_length(action) <= 80),
  target_type text not null default '' check (char_length(target_type) <= 60),
  target_id text not null default '' check (char_length(target_id) <= 80),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_created on public.audit_events (created_at desc);

create or replace function private.forbid_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- The only permitted change is the FK action that anonymises a deleted account
  -- (actor_id / changed_by -> NULL). Content is never editable or deletable.
  if tg_op = 'UPDATE' then
    if tg_table_name = 'audit_events' and new.actor_id is null
       and (to_jsonb(new) - 'actor_id') = (to_jsonb(old) - 'actor_id') then
      return new;
    end if;
    if tg_table_name = 'settings_revisions' and new.changed_by is null
       and (to_jsonb(new) - 'changed_by') = (to_jsonb(old) - 'changed_by') then
      return new;
    end if;
  end if;
  raise exception 'append_only_table' using errcode = '42501';
end;
$$;
create trigger audit_events_immutable before update or delete on public.audit_events
  for each row execute function private.forbid_mutation();
create trigger settings_revisions_immutable before update or delete on public.settings_revisions
  for each row execute function private.forbid_mutation();

-- -----------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER so policies can read protected tables)
-- -----------------------------------------------------------------------------
create or replace function private.mfa_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select not s.require_staff_mfa from public.site_settings s where s.id), true)
      or coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

create or replace function private.account_active(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = uid and p.status = 'active');
$$;

create or replace function private.has_role(r public.staff_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
     and exists (
       select 1 from public.staff_roles sr
       where sr.user_id = auth.uid() and sr.role = r and sr.revoked_at is null
     )
     and private.account_active(auth.uid())
     and private.mfa_ok();
$$;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select private.has_role('admin'); $$;

create or replace function private.is_imam() returns boolean
language sql stable security definer set search_path = ''
as $$ select private.has_role('imam'); $$;

create or replace function private.is_content_editor() returns boolean
language sql stable security definer set search_path = ''
as $$ select private.has_role('admin') or private.has_role('editor'); $$;

create or replace function private.is_moderator() returns boolean
language sql stable security definer set search_path = ''
as $$ select private.has_role('admin') or private.has_role('moderator'); $$;

create or replace function private.is_active_member() returns boolean
language sql stable security definer set search_path = ''
as $$ select auth.uid() is not null and private.account_active(auth.uid()); $$;

create or replace function private.concept_mode() returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select s.concept_mode from public.site_settings s where s.id), true); $$;

-- Sample rows are visible publicly only while the site is in concept/demo mode.
create or replace function private.sample_visible(is_sample boolean) returns boolean
language sql stable security definer set search_path = ''
as $$ select not is_sample or private.concept_mode(); $$;

grant execute on all functions in schema private to anon, authenticated;

-- Audit writer (callable only from definer code / triggers)
create or replace function private.audit(
  p_action text, p_target_type text default '', p_target_id text default '', p_metadata jsonb default '{}'::jsonb
) returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (auth.uid(), p_action, coalesce(p_target_type, ''), coalesce(p_target_id, ''), coalesce(p_metadata, '{}'::jsonb));
$$;
revoke execute on function private.audit(text, text, text, jsonb) from anon, authenticated, public;

-- Generic row-change audit for staff-managed tables (records ids/operation, never content)
create or replace function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid text;
begin
  rid := coalesce(
    case when tg_op = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end, '');
  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (auth.uid(), lower(tg_op), tg_table_name, rid,
    case when tg_op = 'UPDATE' and (to_jsonb(new) ? 'status')
      then jsonb_build_object('status_from', to_jsonb(old) ->> 'status', 'status_to', to_jsonb(new) ->> 'status')
      else '{}'::jsonb end);
  return coalesce(new, old);
end;
$$;

-- -----------------------------------------------------------------------------
-- Rate limiting (fixed window, per user + bucket)
-- -----------------------------------------------------------------------------
create table private.rate_limits (
  bucket text not null,
  subject text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, subject, window_start)
);

create or replace function private.consume_rate(p_bucket text, p_max integer, p_window interval)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / extract(epoch from p_window)) * extract(epoch from p_window));
  n integer;
begin
  insert into private.rate_limits (bucket, subject, window_start, hits)
  values (p_bucket, coalesce(auth.uid()::text, 'anon'), w, 1)
  on conflict (bucket, subject, window_start) do update set hits = private.rate_limits.hits + 1
  returning hits into n;
  if n > p_max then
    raise exception 'rate_limited' using errcode = 'P0001', hint = 'Please wait before trying again.';
  end if;
  delete from private.rate_limits where window_start < now() - interval '2 days';
end;
$$;
revoke execute on function private.consume_rate(text, integer, interval) from anon, authenticated, public;

-- -----------------------------------------------------------------------------
-- New-user trigger: minimal profile only. Never reads roles from metadata.
-- -----------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lang text := new.raw_user_meta_data ->> 'preferred_language';
begin
  insert into public.profiles (id, display_name, preferred_language, privacy_consent_at)
  values (
    new.id,
    left(regexp_replace(coalesce(new.raw_user_meta_data ->> 'display_name', ''), '[<>]', '', 'g'), 60),
    case when lang in ('en', 'ar') then lang::public.ui_language else 'en' end,
    case when (new.raw_user_meta_data ->> 'privacy_consent') = 'true' then now() else null end
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- -----------------------------------------------------------------------------
-- Settings revision trigger
-- -----------------------------------------------------------------------------
create or replace function private.site_settings_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_by := auth.uid();
  insert into public.settings_revisions (changed_by, before, after)
  values (auth.uid(), to_jsonb(old), to_jsonb(new));
  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (auth.uid(), 'update', 'site_settings', 'singleton',
    jsonb_build_object('changed_keys', (
      select coalesce(jsonb_agg(k), '[]'::jsonb) from jsonb_object_keys(to_jsonb(new)) k
      where k not in ('updated_at', 'updated_by') and (to_jsonb(new) -> k) is distinct from (to_jsonb(old) -> k))));
  return new;
end;
$$;
create trigger site_settings_revision before update on public.site_settings
  for each row execute function private.site_settings_revision();

-- -----------------------------------------------------------------------------
-- RLS + grants
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.staff_roles enable row level security;
alter table public.site_settings enable row level security;
alter table public.settings_revisions enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.profiles, public.staff_roles, public.site_settings,
  public.settings_revisions, public.audit_events from anon, authenticated;

-- profiles: own row; admins can read for member administration. Only safe columns updatable.
grant select on public.profiles to authenticated;
grant update (display_name, preferred_language, privacy_consent_at) on public.profiles to authenticated;
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- staff_roles: read own; admins read all. Writes only via admin RPCs below.
grant select on public.staff_roles to authenticated;
create policy staff_roles_select on public.staff_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- site_settings: public read (contains only public-facing configuration); admin update.
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
create policy site_settings_read on public.site_settings for select to anon, authenticated using (true);
create policy site_settings_admin_update on public.site_settings for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

grant select on public.settings_revisions to authenticated;
create policy settings_revisions_admin on public.settings_revisions for select to authenticated
  using ((select private.is_admin()));

grant select on public.audit_events to authenticated;
create policy audit_events_admin on public.audit_events for select to authenticated
  using ((select private.is_admin()));

-- -----------------------------------------------------------------------------
-- Role administration RPCs
-- -----------------------------------------------------------------------------
create or replace function public.admin_grant_role(p_user_id uuid, p_role public.staff_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot_change_own_roles' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id and status = 'active') then
    raise exception 'account_not_active';
  end if;
  insert into public.staff_roles (user_id, role, assigned_by)
  values (p_user_id, p_role, auth.uid())
  on conflict (user_id, role) where revoked_at is null do nothing;
  perform private.audit('role.grant', 'user', p_user_id::text, jsonb_build_object('role', p_role));
end;
$$;

create or replace function public.admin_revoke_role(p_user_id uuid, p_role public.staff_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() and p_role = 'admin' then
    raise exception 'cannot_revoke_own_admin' using errcode = '42501';
  end if;
  update public.staff_roles set revoked_at = now(), revoked_by = auth.uid()
  where user_id = p_user_id and role = p_role and revoked_at is null;
  perform private.audit('role.revoke', 'user', p_user_id::text, jsonb_build_object('role', p_role));
end;
$$;

create or replace function public.admin_set_account_status(p_user_id uuid, p_status public.account_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot_change_own_status' using errcode = '42501';
  end if;
  update public.profiles set status = p_status where id = p_user_id;
  perform private.audit('account.status', 'user', p_user_id::text, jsonb_build_object('status', p_status));
end;
$$;

-- Scoped, paginated member directory for admins (max 50 rows per call).
create or replace function public.admin_member_list(p_search text default '', p_limit integer default 25, p_offset integer default 0)
returns table (
  id uuid, email text, display_name text, status public.account_status,
  roles public.staff_role[], created_at timestamptz, email_confirmed boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.status,
      coalesce(array_agg(sr.role) filter (where sr.role is not null), '{}'),
      p.created_at, u.email_confirmed_at is not null
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.staff_roles sr on sr.user_id = p.id and sr.revoked_at is null
    where coalesce(p_search, '') = ''
       or u.email ilike '%' || p_search || '%'
       or p.display_name ilike '%' || p_search || '%'
    group by p.id, u.email, u.email_confirmed_at
    order by p.created_at desc
    limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0);
end;
$$;

create or replace function public.admin_staff_list()
returns table (user_id uuid, display_name text, role public.staff_role, assigned_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (private.is_admin() or private.is_imam() or private.is_moderator()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select sr.user_id, p.display_name, sr.role, sr.assigned_at
    from public.staff_roles sr join public.profiles p on p.id = sr.user_id
    where sr.revoked_at is null and p.status = 'active'
    order by sr.role, p.display_name;
end;
$$;

-- Current user's own active roles (for routing). Returns empty when MFA required but not satisfied.
create or replace function public.my_roles()
returns public.staff_role[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(sr.role order by sr.role), '{}')
  from public.staff_roles sr
  where sr.user_id = auth.uid() and sr.revoked_at is null
    and private.account_active(auth.uid());
$$;

revoke execute on function public.admin_grant_role(uuid, public.staff_role) from public, anon;
revoke execute on function public.admin_revoke_role(uuid, public.staff_role) from public, anon;
revoke execute on function public.admin_set_account_status(uuid, public.account_status) from public, anon;
revoke execute on function public.admin_member_list(text, integer, integer) from public, anon;
revoke execute on function public.admin_staff_list() from public, anon;
revoke execute on function public.my_roles() from public, anon;
grant execute on function public.admin_grant_role(uuid, public.staff_role) to authenticated;
grant execute on function public.admin_revoke_role(uuid, public.staff_role) to authenticated;
grant execute on function public.admin_set_account_status(uuid, public.account_status) to authenticated;
grant execute on function public.admin_member_list(text, integer, integer) to authenticated;
grant execute on function public.admin_staff_list() to authenticated;
grant execute on function public.my_roles() to authenticated;
