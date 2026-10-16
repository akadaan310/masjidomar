-- Masjid Omar — public content, events/RSVP, volunteering, media, display, curated FAQ.

create type public.content_status as enum ('draft', 'published', 'archived');
create type public.audience as enum ('public', 'members', 'staff');

-- -----------------------------------------------------------------------------
-- Announcements (scheduled publishing via publish_at; expiry via expires_at)
-- -----------------------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 3 and 140),
  title_ar text not null default '' check (char_length(title_ar) <= 140),
  body_md text not null default '' check (char_length(body_md) <= 8000),
  body_ar_md text not null default '' check (char_length(body_ar_md) <= 8000),
  urgency text not null default 'normal' check (urgency in ('normal', 'urgent')),
  audience public.audience not null default 'public',
  status public.content_status not null default 'draft',
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  show_on_display boolean not null default true,
  is_sample boolean not null default false,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcement_window check (expires_at is null or expires_at > publish_at)
);
create index announcements_public on public.announcements (status, audience, publish_at desc);

-- -----------------------------------------------------------------------------
-- Programs (recurring offerings) and events (dated occurrences)
-- -----------------------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 3 and 140),
  title_ar text not null default '' check (char_length(title_ar) <= 140),
  summary text not null default '' check (char_length(summary) <= 400),
  description_md text not null default '' check (char_length(description_md) <= 8000),
  category text not null default 'class' check (category in ('class', 'family', 'lecture', 'youth', 'seasonal', 'community', 'other')),
  schedule_note text not null default '' check (char_length(schedule_note) <= 200),
  audience_note text not null default '' check (char_length(audience_note) <= 200),
  status public.content_status not null default 'draft',
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs (id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 3 and 140),
  title_ar text not null default '' check (char_length(title_ar) <= 140),
  description_md text not null default '' check (char_length(description_md) <= 8000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text not null default 'Masjid Omar, 4801 E Busch Blvd, Tampa, FL 33617' check (char_length(location) <= 200),
  capacity integer check (capacity is null or capacity between 1 and 5000),
  rsvp_enabled boolean not null default false,
  waitlist_enabled boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled', 'archived')),
  cancel_note text not null default '' check (char_length(cancel_note) <= 300),
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_window check (ends_at > starts_at)
);
create index events_upcoming on public.events (status, starts_at);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('confirmed', 'waitlisted', 'cancelled')),
  party_size smallint not null default 1 check (party_size between 1 and 10),
  contact_consent boolean not null default false,
  reminder_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Volunteering
-- -----------------------------------------------------------------------------
create table public.volunteer_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 140),
  title_ar text not null default '' check (char_length(title_ar) <= 140),
  description_md text not null default '' check (char_length(description_md) <= 4000),
  commitment text not null default '' check (char_length(commitment) <= 200),
  status public.content_status not null default 'draft',
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.volunteer_inquiries (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.volunteer_opportunities (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  message text not null default '' check (char_length(message) <= 1500),
  contact_preference text not null default 'email' check (contact_preference in ('email', 'in_person')),
  consent_contact boolean not null check (consent_contact),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Staff-only notes are a separate table so members can never select them.
create table public.volunteer_inquiry_notes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.volunteer_inquiries (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null default auth.uid(),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Media assets (provenance + consent + AI disclosure)
-- -----------------------------------------------------------------------------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique check (char_length(storage_path) <= 300),
  alt_text text not null check (char_length(alt_text) between 3 and 300),
  alt_text_ar text not null default '' check (char_length(alt_text_ar) <= 300),
  credit text not null default '' check (char_length(credit) <= 200),
  source text not null check (source in ('ai_concept', 'reference_screenshot', 'mosque_supplied', 'commissioned')),
  ai_generated boolean not null default false,
  people_consent text not null default 'not_applicable' check (people_consent in ('not_applicable', 'obtained', 'pending')),
  rights_cleared boolean not null default false,
  privacy_tier text not null default 'internal' check (privacy_tier in ('public', 'internal')),
  publish_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_source_flag check (source <> 'ai_concept' or ai_generated),
  constraint publish_requires_rights check (not publish_approved or (rights_cleared and privacy_tier = 'public' and people_consent <> 'pending'))
);

-- -----------------------------------------------------------------------------
-- Masjid display presets (single row)
-- -----------------------------------------------------------------------------
create table public.display_presets (
  id boolean primary key default true check (id),
  panels jsonb not null default '["prayers","next","jumuah","announcements","program"]'::jsonb,
  quiet_mode boolean not null default false,
  language_mode text not null default 'bilingual' check (language_mode in ('en', 'ar', 'bilingual')),
  theme text not null default 'evergreen' check (theme in ('evergreen', 'navy', 'ivory')),
  show_seconds boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint panels_shape check (jsonb_typeof(panels) = 'array' and jsonb_array_length(panels) <= 8)
);
insert into public.display_presets (id) values (true);

-- -----------------------------------------------------------------------------
-- Curated public FAQ (imam-approved, anonymised; never auto-posted)
-- -----------------------------------------------------------------------------
create table public.public_faq (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 5 and 600),
  answer_md text not null check (char_length(answer_md) between 5 and 8000),
  category text not null default 'other' check (category in ('worship', 'family', 'new_muslim', 'community', 'visiting', 'other')),
  language public.ui_language not null default 'en',
  status public.content_status not null default 'draft',
  approved_by_imam uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  source_proposal_id uuid,
  is_sample boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_requires_approval check (status <> 'published' or is_sample or approved_at is not null)
);

create table public.saved_items (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  item_type text not null check (item_type in ('faq', 'program', 'announcement')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

-- -----------------------------------------------------------------------------
-- Triggers: updated_at + audit
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['announcements', 'programs', 'events', 'event_registrations', 'volunteer_opportunities',
                           'volunteer_inquiries', 'media_assets', 'display_presets', 'public_faq'] loop
    execute format('create trigger %1$s_touch before update on public.%1$s for each row execute function private.touch_updated_at()', t);
  end loop;
  foreach t in array array['announcements', 'programs', 'events', 'volunteer_opportunities', 'media_assets',
                           'display_presets', 'public_faq', 'volunteer_inquiry_notes'] loop
    execute format('create trigger %1$s_audit after insert or update or delete on public.%1$s for each row execute function private.audit_row_change()', t);
  end loop;
end $$;

-- Volunteer inquiries: force ownership/status on insert; rate-limit.
create or replace function private.volunteer_inquiry_defaults()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.status := 'new';
    perform private.consume_rate('volunteer_inquiry', 5, interval '1 day');
  end if;
  return new;
end;
$$;
create trigger volunteer_inquiry_defaults before insert on public.volunteer_inquiries
  for each row execute function private.volunteer_inquiry_defaults();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.announcements enable row level security;
alter table public.programs enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.volunteer_opportunities enable row level security;
alter table public.volunteer_inquiries enable row level security;
alter table public.volunteer_inquiry_notes enable row level security;
alter table public.media_assets enable row level security;
alter table public.display_presets enable row level security;
alter table public.public_faq enable row level security;
alter table public.saved_items enable row level security;

revoke all on public.announcements, public.programs, public.events, public.event_registrations,
  public.volunteer_opportunities, public.volunteer_inquiries, public.volunteer_inquiry_notes,
  public.media_assets, public.display_presets, public.public_faq, public.saved_items from anon, authenticated;

-- Announcements
grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;
create policy announcements_read on public.announcements for select to anon, authenticated using (
  (status = 'published' and publish_at <= now() and (expires_at is null or expires_at > now())
     and private.sample_visible(is_sample)
     and (audience = 'public' or (audience = 'members' and (select private.is_active_member()))))
  or (select private.is_content_editor())
  or (audience = 'staff' and status = 'published' and ((select private.is_imam()) or (select private.is_moderator()))));
create policy announcements_write on public.announcements for all to authenticated
  using ((select private.is_content_editor())) with check ((select private.is_content_editor()));

-- Programs / events / volunteer opportunities / FAQ: public sees published; editors manage.
grant select on public.programs, public.events, public.volunteer_opportunities, public.public_faq to anon, authenticated;
grant insert, update, delete on public.programs, public.events, public.volunteer_opportunities, public.public_faq to authenticated;
create policy programs_read on public.programs for select to anon, authenticated
  using ((status = 'published' and private.sample_visible(is_sample)) or (select private.is_content_editor()));
create policy programs_write on public.programs for all to authenticated
  using ((select private.is_content_editor())) with check ((select private.is_content_editor()));
create policy events_read on public.events for select to anon, authenticated
  using ((status in ('published', 'cancelled') and private.sample_visible(is_sample)) or (select private.is_content_editor()));
create policy events_write on public.events for all to authenticated
  using ((select private.is_content_editor())) with check ((select private.is_content_editor()));
create policy volunteer_opps_read on public.volunteer_opportunities for select to anon, authenticated
  using ((status = 'published' and private.sample_visible(is_sample)) or (select private.is_content_editor()));
create policy volunteer_opps_write on public.volunteer_opportunities for all to authenticated
  using ((select private.is_content_editor())) with check ((select private.is_content_editor()));
create policy faq_read on public.public_faq for select to anon, authenticated
  using ((status = 'published' and private.sample_visible(is_sample))
     or (select private.is_moderator()) or (select private.is_imam()));
create policy faq_write on public.public_faq for all to authenticated
  using ((select private.is_moderator())) with check ((select private.is_moderator()));

-- Event registrations: own rows; admins read all. Writes via RPCs (capacity is checked atomically).
grant select on public.event_registrations to authenticated;
create policy registrations_read on public.event_registrations for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- Volunteer inquiries: member inserts/reads own; admins read/update status.
grant select, insert on public.volunteer_inquiries to authenticated;
grant update (status) on public.volunteer_inquiries to authenticated;
create policy vi_insert on public.volunteer_inquiries for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.is_active_member()));
create policy vi_read on public.volunteer_inquiries for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy vi_admin_update on public.volunteer_inquiries for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

grant select, insert on public.volunteer_inquiry_notes to authenticated;
create policy vin_admin on public.volunteer_inquiry_notes for select to authenticated using ((select private.is_admin()));
create policy vin_admin_insert on public.volunteer_inquiry_notes for insert to authenticated
  with check ((select private.is_admin()) and author_id = (select auth.uid()));

-- Media: public sees publish-approved public assets; editors manage.
grant select on public.media_assets to anon, authenticated;
grant insert, update, delete on public.media_assets to authenticated;
create policy media_read on public.media_assets for select to anon, authenticated
  using ((publish_approved and privacy_tier = 'public')
     or (ai_generated and privacy_tier = 'public' and private.concept_mode())
     or (select private.is_content_editor()));
create policy media_write on public.media_assets for all to authenticated
  using ((select private.is_content_editor())) with check ((select private.is_content_editor()));

-- Display preset: public kiosk read; admin update.
grant select on public.display_presets to anon, authenticated;
grant update on public.display_presets to authenticated;
create policy display_read on public.display_presets for select to anon, authenticated using (true);
create policy display_admin on public.display_presets for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Saved items: own only.
grant select, insert, delete on public.saved_items to authenticated;
create policy saved_own on public.saved_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- RSVP RPCs
-- -----------------------------------------------------------------------------
create or replace function public.rsvp_event(p_event_id uuid, p_party_size smallint, p_contact_consent boolean, p_reminder_opt_in boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  ev public.events;
  taken integer;
  result text;
begin
  if not private.is_active_member() then
    raise exception 'sign_in_required' using errcode = '42501';
  end if;
  if p_party_size is null or p_party_size < 1 or p_party_size > 10 then
    raise exception 'invalid_party_size';
  end if;
  perform private.consume_rate('rsvp', 20, interval '1 hour');
  select * into ev from public.events where id = p_event_id for update;
  if ev.id is null or ev.status <> 'published' or not private.sample_visible(ev.is_sample) then
    raise exception 'event_not_available';
  end if;
  if not ev.rsvp_enabled then
    raise exception 'rsvp_not_enabled';
  end if;
  if ev.starts_at < now() then
    raise exception 'event_started';
  end if;
  select coalesce(sum(party_size), 0) into taken from public.event_registrations
   where event_id = p_event_id and status = 'confirmed' and user_id <> auth.uid();
  if ev.capacity is null or taken + p_party_size <= ev.capacity then
    result := 'confirmed';
  elsif ev.waitlist_enabled then
    result := 'waitlisted';
  else
    raise exception 'event_full';
  end if;
  insert into public.event_registrations (event_id, user_id, status, party_size, contact_consent, reminder_opt_in)
  values (p_event_id, auth.uid(), result, p_party_size, coalesce(p_contact_consent, false), coalesce(p_reminder_opt_in, false))
  on conflict (event_id, user_id) do update
    set status = excluded.status, party_size = excluded.party_size,
        contact_consent = excluded.contact_consent, reminder_opt_in = excluded.reminder_opt_in;
  return result;
end;
$$;

create or replace function public.cancel_rsvp(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ev public.events;
  cand record;
  taken integer;
begin
  if auth.uid() is null then
    raise exception 'sign_in_required' using errcode = '42501';
  end if;
  select * into ev from public.events where id = p_event_id for update;
  update public.event_registrations set status = 'cancelled'
   where event_id = p_event_id and user_id = auth.uid() and status <> 'cancelled';
  -- Promote waitlisted members in arrival order while capacity allows.
  if ev.capacity is not null then
    for cand in select id, party_size from public.event_registrations
                where event_id = p_event_id and status = 'waitlisted' order by created_at loop
      select coalesce(sum(party_size), 0) into taken from public.event_registrations
       where event_id = p_event_id and status = 'confirmed';
      exit when taken + cand.party_size > ev.capacity;
      update public.event_registrations set status = 'confirmed' where id = cand.id;
    end loop;
  end if;
end;
$$;

-- Anonymised totals only (no names), for public cards and admin dashboards.
create or replace function public.event_rsvp_totals(p_event_ids uuid[])
returns table (event_id uuid, confirmed integer, waitlisted integer)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id,
    coalesce(sum(r.party_size) filter (where r.status = 'confirmed'), 0)::int,
    coalesce(sum(r.party_size) filter (where r.status = 'waitlisted'), 0)::int
  from public.events e
  left join public.event_registrations r on r.event_id = e.id
  where e.id = any(p_event_ids)
    and ((e.status in ('published', 'cancelled') and private.sample_visible(e.is_sample)) or private.is_content_editor())
  group by e.id;
$$;

revoke execute on function public.rsvp_event(uuid, smallint, boolean, boolean) from public, anon;
revoke execute on function public.cancel_rsvp(uuid) from public, anon;
grant execute on function public.rsvp_event(uuid, smallint, boolean, boolean) to authenticated;
grant execute on function public.cancel_rsvp(uuid) to authenticated;
grant execute on function public.event_rsvp_totals(uuid[]) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Storage: public media bucket (editors write) + private documents bucket
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-media', 'public-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('private-documents', 'private-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "public-media editors insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'public-media' and (select private.is_content_editor()));
create policy "public-media editors update" on storage.objects for update to authenticated
  using (bucket_id = 'public-media' and (select private.is_content_editor()));
create policy "public-media editors delete" on storage.objects for delete to authenticated
  using (bucket_id = 'public-media' and (select private.is_content_editor()));
create policy "private-documents owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'private-documents'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin())));
create policy "private-documents owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'private-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
