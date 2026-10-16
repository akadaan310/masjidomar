-- Masjid Omar — member privacy controls, notification preferences/outbox, data requests,
-- admin aggregate dashboard and Realtime publication.

create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_question_updates boolean not null default false,
  email_announcements boolean not null default false,
  email_event_reminders boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger notification_preferences_touch before update on public.notification_preferences
  for each row execute function private.touch_updated_at();

-- Outbox: records intent only. Nothing is delivered unless a provider is configured (see docs).
create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  channel text not null check (channel in ('email')),
  template text not null check (template in ('question_update', 'event_reminder', 'announcement')),
  ref_id uuid,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  created_at timestamptz not null default now()
);

create table public.data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  kind text not null check (kind in ('export', 'deletion')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null
);
create unique index data_requests_one_pending on public.data_requests (user_id, kind) where status = 'pending';

-- Default preferences row for every new profile (opt-in: all false).
create or replace function private.create_notification_prefs()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.notification_preferences (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger profiles_notification_prefs after insert on public.profiles
  for each row execute function private.create_notification_prefs();

-- Queue a question-update notification for the asker when staff reply (only if they opted in).
create or replace function private.enqueue_question_update()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare asker uuid;
begin
  if new.author_kind = 'imam' and not new.is_draft and (tg_op = 'INSERT' or old.is_draft) then
    select q.asker_id into asker from public.questions q where q.id = new.question_id;
    if exists (select 1 from public.notification_preferences np where np.user_id = asker and np.email_question_updates)
       and coalesce((select s.notification_mode from public.site_settings s where s.id), 'none') = 'outbox_only' then
      insert into public.notification_outbox (user_id, channel, template, ref_id)
      values (asker, 'email', 'question_update', new.question_id);
    end if;
  end if;
  return new;
end;
$$;
create trigger question_messages_notify after insert or update of is_draft on public.question_messages
  for each row execute function private.enqueue_question_update();

alter table public.notification_preferences enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.data_requests enable row level security;
revoke all on public.notification_preferences, public.notification_outbox, public.data_requests from anon, authenticated;

grant select, update (email_question_updates, email_announcements, email_event_reminders) on public.notification_preferences to authenticated;
create policy np_own on public.notification_preferences for select to authenticated using (user_id = (select auth.uid()));
create policy np_own_update on public.notification_preferences for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select on public.notification_outbox to authenticated;
create policy outbox_admin on public.notification_outbox for select to authenticated using ((select private.is_admin()));

grant select, insert on public.data_requests to authenticated;
create policy dr_insert on public.data_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and resolved_at is null and resolved_by is null);
create policy dr_read on public.data_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

create or replace function public.admin_resolve_data_request(p_id uuid, p_status text, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status not in ('completed', 'rejected') then
    raise exception 'invalid_status';
  end if;
  update public.data_requests set status = p_status, note = coalesce(p_note, ''), resolved_at = now(), resolved_by = auth.uid()
  where id = p_id and status = 'pending';
  perform private.audit('data_request.' || p_status, 'data_requests', p_id::text, '{}'::jsonb);
end;
$$;

-- Member's own data, assembled server-side under RLS-equivalent ownership checks.
create or replace function public.export_my_data()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) - 'status' from public.profiles p where p.id = auth.uid()),
    'email', (select u.email from auth.users u where u.id = auth.uid()),
    'notification_preferences', (select to_jsonb(n) from public.notification_preferences n where n.user_id = auth.uid()),
    'questions', coalesce((select jsonb_agg(jsonb_build_object(
        'id', q.id, 'category', q.category, 'subject', q.subject, 'body', q.body, 'status', q.status,
        'created_at', q.created_at,
        'messages', coalesce((select jsonb_agg(jsonb_build_object('from', m.author_kind, 'kind', m.kind, 'body', m.body, 'at', m.published_at) order by m.created_at)
                     from public.question_messages m where m.question_id = q.id and not m.is_draft), '[]'::jsonb)))
      from public.questions q where q.asker_id = auth.uid()), '[]'::jsonb),
    'event_registrations', coalesce((select jsonb_agg(jsonb_build_object('event', e.title, 'starts_at', e.starts_at, 'status', r.status, 'party_size', r.party_size))
      from public.event_registrations r join public.events e on e.id = r.event_id where r.user_id = auth.uid()), '[]'::jsonb),
    'volunteer_inquiries', coalesce((select jsonb_agg(jsonb_build_object('message', v.message, 'status', v.status, 'created_at', v.created_at))
      from public.volunteer_inquiries v where v.user_id = auth.uid()), '[]'::jsonb),
    'saved_items', coalesce((select jsonb_agg(to_jsonb(s) - 'user_id') from public.saved_items s where s.user_id = auth.uid()), '[]'::jsonb)
  )
  where auth.uid() is not null;
$$;

-- Today panel for admins: aggregates only.
create or replace function public.admin_today_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (private.is_admin() or private.is_moderator() or private.is_content_editor()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'questions_open', (select count(*) from public.questions where status in ('submitted', 'acknowledged', 'needs_clarification')),
    'questions_unassigned', (select count(*) from public.questions where status <> 'closed' and assigned_imam_id is null),
    'questions_waiting_over_72h', (select count(*) from public.questions where status in ('submitted', 'acknowledged') and last_member_activity_at < now() - interval '72 hours'),
    'faq_proposals_pending', (select count(*) from public.faq_proposals where status = 'proposed'),
    'rsvps_upcoming', (select coalesce(sum(r.party_size), 0) from public.event_registrations r join public.events e on e.id = r.event_id
                       where r.status = 'confirmed' and e.starts_at > now()),
    'volunteer_inquiries_new', (select count(*) from public.volunteer_inquiries where status = 'new'),
    'data_requests_pending', (select count(*) from public.data_requests where status = 'pending'),
    'audit_events_24h', (select count(*) from public.audit_events where created_at > now() - interval '24 hours'),
    'urgent_announcements', (select count(*) from public.announcements where urgency = 'urgent' and status = 'published'
                             and publish_at <= now() and (expires_at is null or expires_at > now()))
  );
end;
$$;

revoke execute on function public.admin_resolve_data_request(uuid, text, text) from public, anon;
revoke execute on function public.export_my_data() from public, anon;
revoke execute on function public.admin_today_summary() from public, anon;
grant execute on function public.admin_resolve_data_request(uuid, text, text) to authenticated;
grant execute on function public.export_my_data() to authenticated;
grant execute on function public.admin_today_summary() to authenticated;

-- -----------------------------------------------------------------------------
-- Realtime: only public, approved tables plus question_messages (RLS-filtered per subscriber).
-- The questions table itself is deliberately NOT published.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.prayer_publications, public.announcements,
      public.display_presets, public.question_messages;
  end if;
end $$;
