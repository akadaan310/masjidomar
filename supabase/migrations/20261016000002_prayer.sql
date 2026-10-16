-- Masjid Omar — prayer schedule model.
-- Adhan times are CALCULATED in the app from the publication's method/madhab/adjustments and the
-- site coordinates. Iqamah times are ENTERED by authorised admins; they are never silently derived
-- from adhan (an "offset" rule must be explicitly chosen and is labelled as such).

create type public.prayer_name as enum ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha');
create type public.publication_status as enum ('draft', 'published', 'archived');
create type public.iqamah_mode as enum ('fixed', 'offset');

create or replace function private.valid_adjustments(a jsonb) returns boolean
language plpgsql immutable set search_path = ''
as $$
declare k text; v jsonb;
begin
  if jsonb_typeof(a) <> 'object' then return false; end if;
  for k, v in select * from jsonb_each(a) loop
    if k not in ('fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha') then return false; end if;
    if jsonb_typeof(v) <> 'number' or abs((v #>> '{}')::numeric) > 30 or (v #>> '{}')::numeric % 1 <> 0 then return false; end if;
  end loop;
  return true;
end;
$$;

create table public.prayer_methods (
  code text primary key,
  label text not null,
  description text not null default '',
  sort_order integer not null default 0
);
insert into public.prayer_methods (code, label, description, sort_order) values
  ('NorthAmerica', 'ISNA (North America)', 'Fajr 15°, Isha 15°. Common in North American masajid.', 1),
  ('MuslimWorldLeague', 'Muslim World League', 'Fajr 18°, Isha 17°.', 2),
  ('Egyptian', 'Egyptian General Authority', 'Fajr 19.5°, Isha 17.5°.', 3),
  ('Karachi', 'University of Islamic Sciences, Karachi', 'Fajr 18°, Isha 18°.', 4),
  ('UmmAlQura', 'Umm al-Qura, Makkah', 'Fajr 18.5°, Isha 90 minutes after Maghrib.', 5),
  ('MoonsightingCommittee', 'Moonsighting Committee Worldwide', 'Season-adjusted twilight angles.', 6);

create table public.prayer_publications (
  id uuid primary key default gen_random_uuid(),
  version integer generated always as identity,
  status public.publication_status not null default 'draft',
  title text not null default 'Prayer schedule' check (char_length(title) between 1 and 120),
  calculation_method text not null default 'NorthAmerica' references public.prayer_methods (code),
  madhab text not null default 'shafi' check (madhab in ('shafi', 'hanafi')),
  adjustments jsonb not null default '{"fajr":0,"sunrise":0,"dhuhr":0,"asr":0,"maghrib":0,"isha":0}'::jsonb,
  effective_from date not null default current_date,
  notice text not null default '' check (char_length(notice) <= 600),
  is_sample boolean not null default false,
  verified_by uuid references auth.users (id) on delete set null,
  verified_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint adjustments_bounds check (private.valid_adjustments(adjustments))
);
create unique index prayer_publications_single_draft on public.prayer_publications ((true)) where status = 'draft';
create index prayer_publications_effective on public.prayer_publications (status, effective_from desc, published_at desc);
create trigger prayer_publications_touch before update on public.prayer_publications
  for each row execute function private.touch_updated_at();

create table public.iqamah_schedules (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.prayer_publications (id) on delete cascade,
  prayer public.prayer_name not null,
  weekday smallint check (weekday between 0 and 6), -- null = every day; 0 = Sunday
  mode public.iqamah_mode not null default 'fixed',
  time_of_day time,
  offset_minutes smallint check (offset_minutes between 0 and 90),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint iqamah_mode_fields check (
    (mode = 'fixed' and time_of_day is not null and offset_minutes is null)
    or (mode = 'offset' and offset_minutes is not null and time_of_day is null))
);
create unique index iqamah_unique_rule on public.iqamah_schedules (publication_id, prayer, coalesce(weekday, -1));
create trigger iqamah_touch before update on public.iqamah_schedules
  for each row execute function private.touch_updated_at();

create table public.prayer_overrides (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.prayer_publications (id) on delete cascade,
  on_date date not null,
  prayer public.prayer_name not null,
  iqamah_time time,
  kind text not null default 'other' check (kind in ('ramadan', 'eid', 'holiday', 'jumuah', 'other')),
  note text not null default '' check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  unique (publication_id, on_date, prayer)
);

create table public.jumuah_sessions (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.prayer_publications (id) on delete cascade,
  label text not null default 'Jumu''ah' check (char_length(label) between 1 and 60),
  khutbah_time time not null,
  iqamah_time time not null,
  language text not null default '' check (char_length(language) <= 60),
  note text not null default '' check (char_length(note) <= 200),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint jumuah_order check (iqamah_time >= khutbah_time)
);

-- Children of a non-draft publication are immutable.
create or replace function private.guard_publication_children()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid := coalesce(new.publication_id, old.publication_id);
begin
  if exists (select 1 from public.prayer_publications where id = pid and status <> 'draft') then
    raise exception 'publication_locked: only drafts can be edited' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and new.publication_id <> old.publication_id then
    raise exception 'publication_locked' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger iqamah_guard before insert or update or delete on public.iqamah_schedules
  for each row execute function private.guard_publication_children();
create trigger overrides_guard before insert or update or delete on public.prayer_overrides
  for each row execute function private.guard_publication_children();
create trigger jumuah_guard before insert or update or delete on public.jumuah_sessions
  for each row execute function private.guard_publication_children();

-- Publications: published rows may only move to archived; publishing happens via RPC.
create or replace function private.guard_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'publication_locked' using errcode = '42501';
    end if;
    return old;
  end if;
  if tg_op = 'INSERT' then
    if new.status <> 'draft' and current_setting('app.publishing', true) is distinct from 'on' then
      raise exception 'new publications must start as drafts' using errcode = '42501';
    end if;
    new.published_by := null; new.published_at := null; new.verified_by := null; new.verified_at := null;
    if current_setting('app.publishing', true) is distinct from 'on' then
      new.created_by := auth.uid();
    end if;
    return new;
  end if;
  -- UPDATE
  if current_setting('app.publishing', true) = 'on' then
    return new;
  end if;
  -- FK anonymisation when a staff account is deleted (user columns -> NULL) is always allowed.
  if (to_jsonb(new) - array['created_by', 'published_by', 'verified_by', 'updated_at'])
     = (to_jsonb(old) - array['created_by', 'published_by', 'verified_by', 'updated_at']) then
    return new;
  end if;
  if old.status = 'draft' then
    if new.status <> 'draft' or new.published_at is distinct from old.published_at
       or new.verified_by is distinct from old.verified_by or new.verified_at is distinct from old.verified_at
       or new.published_by is distinct from old.published_by then
      raise exception 'use publish_prayer_publication() to publish' using errcode = '42501';
    end if;
    return new;
  end if;
  if old.status = 'published' and new.status = 'archived'
     and (to_jsonb(new) - 'status' - 'updated_at') = (to_jsonb(old) - 'status' - 'updated_at') then
    return new;
  end if;
  raise exception 'publication_locked' using errcode = '42501';
end;
$$;
create trigger prayer_publications_guard before insert or update or delete on public.prayer_publications
  for each row execute function private.guard_publication();

create trigger prayer_publications_audit after insert or update or delete on public.prayer_publications
  for each row execute function private.audit_row_change();
create trigger iqamah_audit after insert or update or delete on public.iqamah_schedules
  for each row execute function private.audit_row_change();
create trigger overrides_audit after insert or update or delete on public.prayer_overrides
  for each row execute function private.audit_row_change();
create trigger jumuah_audit after insert or update or delete on public.jumuah_sessions
  for each row execute function private.audit_row_change();

-- Publish: requires every daily prayer to have an iqamah rule and an explicit verification attestation.
create or replace function public.publish_prayer_publication(p_id uuid, p_verified boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  missing text;
  pub public.prayer_publications;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not coalesce(p_verified, false) then
    raise exception 'verification_required: confirm these times were checked with the imam or masjid leadership';
  end if;
  select * into pub from public.prayer_publications where id = p_id for update;
  if pub.id is null or pub.status <> 'draft' then
    raise exception 'not_a_draft';
  end if;
  select string_agg(p::text, ', ') into missing
  from unnest(enum_range(null::public.prayer_name)) p
  where not exists (
    select 1 from public.iqamah_schedules s where s.publication_id = p_id and s.prayer = p and s.weekday is null);
  if missing is not null then
    raise exception 'incomplete_schedule: missing every-day iqamah for %', missing;
  end if;
  perform set_config('app.publishing', 'on', true);
  update public.prayer_publications
     set status = 'published', published_by = auth.uid(), published_at = now(),
         verified_by = auth.uid(), verified_at = now()
   where id = p_id;
  perform set_config('app.publishing', 'off', true);
  perform private.audit('prayer.publish', 'prayer_publications', p_id::text,
    jsonb_build_object('effective_from', pub.effective_from, 'is_sample', pub.is_sample));
end;
$$;

-- Start a new draft by copying an existing publication (or blank if null).
create or replace function public.create_prayer_draft(p_from uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  src public.prayer_publications;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if exists (select 1 from public.prayer_publications where status = 'draft') then
    raise exception 'draft_exists';
  end if;
  if p_from is not null then
    select * into src from public.prayer_publications where id = p_from;
  end if;
  insert into public.prayer_publications (title, calculation_method, madhab, adjustments, effective_from, notice, is_sample)
  values (
    coalesce(src.title, 'Prayer schedule'), coalesce(src.calculation_method, 'NorthAmerica'),
    coalesce(src.madhab, 'shafi'), coalesce(src.adjustments, '{"fajr":0,"sunrise":0,"dhuhr":0,"asr":0,"maghrib":0,"isha":0}'::jsonb),
    greatest(current_date, coalesce(src.effective_from, current_date)), coalesce(src.notice, ''), coalesce(src.is_sample, false))
  returning id into new_id;
  if p_from is not null then
    insert into public.iqamah_schedules (publication_id, prayer, weekday, mode, time_of_day, offset_minutes)
      select new_id, prayer, weekday, mode, time_of_day, offset_minutes from public.iqamah_schedules where publication_id = p_from;
    insert into public.prayer_overrides (publication_id, on_date, prayer, iqamah_time, kind, note)
      select new_id, on_date, prayer, iqamah_time, kind, note from public.prayer_overrides
      where publication_id = p_from and on_date >= current_date;
    insert into public.jumuah_sessions (publication_id, label, khutbah_time, iqamah_time, language, note, sort_order)
      select new_id, label, khutbah_time, iqamah_time, language, note, sort_order from public.jumuah_sessions where publication_id = p_from;
  end if;
  return new_id;
end;
$$;

revoke execute on function public.publish_prayer_publication(uuid, boolean) from public, anon;
revoke execute on function public.create_prayer_draft(uuid) from public, anon;
grant execute on function public.publish_prayer_publication(uuid, boolean) to authenticated;
grant execute on function public.create_prayer_draft(uuid) to authenticated;

-- RLS
alter table public.prayer_methods enable row level security;
alter table public.prayer_publications enable row level security;
alter table public.iqamah_schedules enable row level security;
alter table public.prayer_overrides enable row level security;
alter table public.jumuah_sessions enable row level security;

revoke all on public.prayer_methods, public.prayer_publications, public.iqamah_schedules,
  public.prayer_overrides, public.jumuah_sessions from anon, authenticated;

grant select on public.prayer_methods to anon, authenticated;
create policy prayer_methods_read on public.prayer_methods for select to anon, authenticated using (true);

grant select on public.prayer_publications, public.iqamah_schedules, public.prayer_overrides, public.jumuah_sessions to anon, authenticated;
grant insert, update, delete on public.prayer_publications, public.iqamah_schedules, public.prayer_overrides, public.jumuah_sessions to authenticated;

create policy pub_read on public.prayer_publications for select to anon, authenticated
  using ((status = 'published' and private.sample_visible(is_sample)) or (select private.is_admin()));
create policy pub_admin_insert on public.prayer_publications for insert to authenticated
  with check ((select private.is_admin()));
create policy pub_admin_update on public.prayer_publications for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy pub_admin_delete on public.prayer_publications for delete to authenticated
  using ((select private.is_admin()));

create or replace function private.publication_public(pid uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.prayer_publications p
    where p.id = pid and p.status = 'published' and private.sample_visible(p.is_sample));
$$;
grant execute on function private.publication_public(uuid) to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['iqamah_schedules', 'prayer_overrides', 'jumuah_sessions'] loop
    execute format('create policy %1$s_read on public.%1$s for select to anon, authenticated
      using (private.publication_public(publication_id) or (select private.is_admin()))', t);
    execute format('create policy %1$s_admin_ins on public.%1$s for insert to authenticated
      with check ((select private.is_admin()))', t);
    execute format('create policy %1$s_admin_upd on public.%1$s for update to authenticated
      using ((select private.is_admin())) with check ((select private.is_admin()))', t);
    execute format('create policy %1$s_admin_del on public.%1$s for delete to authenticated
      using ((select private.is_admin()))', t);
  end loop;
end $$;
