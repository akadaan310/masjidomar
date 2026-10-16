-- Masjid Omar — Private Imam Desk.
-- Visibility rules (enforced here, not only in the UI):
--   * a member sees only their own questions and the non-draft messages in them;
--   * an imam sees questions assigned to them, or unassigned ones when the shared queue is on;
--   * admins do NOT get row access to question text. They get aggregate/metadata functions, and a
--     recorded break-glass function that requires a written reason;
--   * internal staff notes live in a separate table no member policy can reach;
--   * nothing here is ever readable by anon.
-- All state changes go through SECURITY DEFINER RPCs that check the caller, write status history
-- and an audit event (metadata only, never question text).

create type public.question_status as enum ('submitted', 'acknowledged', 'needs_clarification', 'answered', 'closed');
create type public.question_category as enum ('worship', 'family', 'new_muslim', 'community', 'other');

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  asker_id uuid not null references auth.users (id) on delete cascade,
  category public.question_category not null,
  subject text not null check (char_length(subject) between 3 and 140),
  body text not null check (char_length(body) between 10 and 5000),
  language public.ui_language not null default 'en',
  is_sensitive boolean not null default false,
  show_name_to_imam boolean not null default false,
  faq_consent boolean not null default false,
  followups_allowed boolean not null default true,
  status public.question_status not null default 'submitted',
  assigned_imam_id uuid references auth.users (id) on delete set null,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_member_activity_at timestamptz not null default now(),
  last_staff_activity_at timestamptz,
  closed_at timestamptz
);
create index questions_asker on public.questions (asker_id, created_at desc);
create index questions_queue on public.questions (status, assigned_imam_id, created_at);
create trigger questions_touch before update on public.questions
  for each row execute function private.touch_updated_at();

create table public.question_messages (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_kind text not null check (author_kind in ('member', 'imam')),
  kind text not null check (kind in ('message', 'clarification_request', 'answer')),
  body text not null check (char_length(body) between 1 and 8000),
  is_draft boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  published_at timestamptz,
  read_by_member_at timestamptz
);
create index question_messages_thread on public.question_messages (question_id, created_at);
create unique index question_messages_one_draft on public.question_messages (question_id, author_id) where is_draft;

create table public.question_internal_notes (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table public.question_status_history (
  id bigint generated always as identity primary key,
  question_id uuid not null references public.questions (id) on delete cascade,
  from_status public.question_status,
  to_status public.question_status not null,
  changed_by_kind text not null check (changed_by_kind in ('member', 'imam', 'admin', 'system')),
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.faq_proposals (
  id uuid primary key default gen_random_uuid(),
  source_question_id uuid references public.questions (id) on delete set null,
  question_text text not null check (char_length(question_text) between 5 and 600),
  answer_md text not null check (char_length(answer_md) between 5 and 8000),
  category text not null default 'other' check (category in ('worship', 'family', 'new_muslim', 'community', 'visiting', 'other')),
  language public.ui_language not null default 'en',
  proposed_by uuid references auth.users (id) on delete set null,
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  review_note text not null default '' check (char_length(review_note) <= 600),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Access helpers
-- -----------------------------------------------------------------------------
create or replace function private.imam_can_access(q public.questions) returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_imam() and (
    q.assigned_imam_id = auth.uid()
    or (q.assigned_imam_id is null and coalesce((select s.imam_shared_queue from public.site_settings s where s.id), false)));
$$;

create or replace function private.can_read_question(qid uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.questions q
    where q.id = qid and (
      (q.asker_id = auth.uid() and private.account_active(auth.uid()))
      or private.imam_can_access(q)));
$$;

create or replace function private.load_question_for_imam(qid uuid) returns public.questions
language plpgsql stable security definer set search_path = ''
as $$
declare q public.questions;
begin
  select * into q from public.questions where id = qid;
  if q.id is null or not private.imam_can_access(q) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return q;
end;
$$;

create or replace function private.set_question_status(
  qid uuid, new_status public.question_status, actor_kind text
) returns void
language plpgsql security definer set search_path = ''
as $$
declare old_status public.question_status;
begin
  select status into old_status from public.questions where id = qid;
  if old_status is distinct from new_status then
    update public.questions set status = new_status,
      closed_at = case when new_status = 'closed' then now() else null end
    where id = qid;
    insert into public.question_status_history (question_id, from_status, to_status, changed_by_kind, changed_by)
    values (qid, old_status, new_status, actor_kind, auth.uid());
  end if;
end;
$$;

grant execute on function private.imam_can_access(public.questions) to authenticated;
grant execute on function private.can_read_question(uuid) to authenticated;
revoke execute on function private.load_question_for_imam(uuid) from public, anon, authenticated;
revoke execute on function private.set_question_status(uuid, public.question_status, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- RLS (reads only; no direct writes from clients)
-- -----------------------------------------------------------------------------
alter table public.questions enable row level security;
alter table public.question_messages enable row level security;
alter table public.question_internal_notes enable row level security;
alter table public.question_status_history enable row level security;
alter table public.faq_proposals enable row level security;

revoke all on public.questions, public.question_messages, public.question_internal_notes,
  public.question_status_history, public.faq_proposals from anon, authenticated;

grant select on public.questions, public.question_messages, public.question_internal_notes,
  public.question_status_history, public.faq_proposals to authenticated;

create policy questions_read on public.questions for select to authenticated using (
  (asker_id = (select auth.uid()) and (select private.is_active_member()))
  or private.imam_can_access(questions));

create policy messages_read on public.question_messages for select to authenticated using (
  private.can_read_question(question_id)
  and (not is_draft or author_id = (select auth.uid())));

create policy notes_read on public.question_internal_notes for select to authenticated using (
  (select private.is_imam()) and private.can_read_question(question_id)
  and not exists (select 1 from public.questions q where q.id = question_id and q.asker_id = (select auth.uid())));

create policy history_read on public.question_status_history for select to authenticated using (
  private.can_read_question(question_id));

create policy faq_proposals_read on public.faq_proposals for select to authenticated using (
  (select private.is_moderator()) or (select private.is_imam()));

-- -----------------------------------------------------------------------------
-- Member RPCs
-- -----------------------------------------------------------------------------
create or replace function public.submit_question(
  p_category public.question_category, p_subject text, p_body text, p_language public.ui_language,
  p_is_sensitive boolean, p_show_name boolean, p_faq_consent boolean
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_id uuid;
begin
  if not private.is_active_member() then
    raise exception 'sign_in_required' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users where id = auth.uid() and email_confirmed_at is not null) then
    raise exception 'email_not_verified' using errcode = '42501';
  end if;
  perform private.consume_rate('question_submit', 3, interval '1 hour');
  perform private.consume_rate('question_submit_day', 8, interval '1 day');
  insert into public.questions (asker_id, category, subject, body, language, is_sensitive, show_name_to_imam, faq_consent)
  values (auth.uid(), p_category, btrim(p_subject), btrim(p_body), coalesce(p_language, 'en'),
          coalesce(p_is_sensitive, false), coalesce(p_show_name, false), coalesce(p_faq_consent, false))
  returning id into new_id;
  insert into public.question_status_history (question_id, from_status, to_status, changed_by_kind, changed_by)
  values (new_id, null, 'submitted', 'member', auth.uid());
  perform private.audit('question.submit', 'questions', new_id::text, '{}'::jsonb);
  return new_id;
end;
$$;

create or replace function public.member_reply(p_question_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.questions;
  mid uuid;
begin
  select * into q from public.questions where id = p_question_id for update;
  if q.id is null or q.asker_id <> auth.uid() or not private.is_active_member() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if q.status = 'closed' then
    raise exception 'question_closed';
  end if;
  if q.status = 'answered' and not q.followups_allowed then
    raise exception 'followups_not_enabled';
  end if;
  perform private.consume_rate('question_reply', 20, interval '1 hour');
  insert into public.question_messages (question_id, author_id, author_kind, kind, body, published_at)
  values (q.id, auth.uid(), 'member', 'message', btrim(p_body), now())
  returning id into mid;
  update public.questions set last_member_activity_at = now() where id = q.id;
  if q.status in ('needs_clarification', 'answered') then
    perform private.set_question_status(q.id, 'acknowledged', 'member');
  end if;
  return mid;
end;
$$;

-- Members can correct their own message until staff have replied after it.
create or replace function public.member_edit_message(p_message_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare m public.question_messages;
begin
  select * into m from public.question_messages where id = p_message_id for update;
  if m.id is null or m.author_id <> auth.uid() or m.author_kind <> 'member' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if exists (select 1 from public.question_messages s where s.question_id = m.question_id
             and s.author_kind = 'imam' and not s.is_draft and s.published_at > m.created_at) then
    raise exception 'already_answered';
  end if;
  update public.question_messages set body = btrim(p_body), edited_at = now() where id = m.id;
end;
$$;

-- Members can correct the original question until the imam has sent any message.
create or replace function public.member_edit_question(p_question_id uuid, p_subject text, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare q public.questions;
begin
  select * into q from public.questions where id = p_question_id for update;
  if q.id is null or q.asker_id <> auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if exists (select 1 from public.question_messages s where s.question_id = q.id and s.author_kind = 'imam' and not s.is_draft) then
    raise exception 'already_answered';
  end if;
  update public.questions set subject = btrim(p_subject), body = btrim(p_body), last_member_activity_at = now() where id = q.id;
end;
$$;

create or replace function public.member_close_question(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare q public.questions;
begin
  select * into q from public.questions where id = p_question_id for update;
  if q.id is null or q.asker_id <> auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform private.set_question_status(q.id, 'closed', 'member');
end;
$$;

create or replace function public.member_mark_read(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.questions where id = p_question_id and asker_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.question_messages set read_by_member_at = now()
  where question_id = p_question_id and author_kind = 'imam' and not is_draft and read_by_member_at is null;
end;
$$;

-- Member's own list with unread counts.
create or replace function public.my_questions()
returns table (id uuid, subject text, category public.question_category, status public.question_status,
               created_at timestamptz, updated_at timestamptz, unread integer)
language sql
stable
security definer
set search_path = ''
as $$
  select q.id, q.subject, q.category, q.status, q.created_at, q.updated_at,
    (select count(*)::int from public.question_messages m
      where m.question_id = q.id and m.author_kind = 'imam' and not m.is_draft and m.read_by_member_at is null)
  from public.questions q
  where q.asker_id = auth.uid() and private.account_active(auth.uid())
  order by q.updated_at desc
  limit 200;
$$;

-- -----------------------------------------------------------------------------
-- Imam RPCs
-- -----------------------------------------------------------------------------
create or replace function public.imam_inbox(
  p_status public.question_status default null, p_category public.question_category default null,
  p_language public.ui_language default null, p_show_sensitive_excerpts boolean default false
) returns table (
  id uuid, subject text, excerpt text, category public.question_category, language public.ui_language,
  status public.question_status, is_sensitive boolean, asker_label text, assigned_to_me boolean,
  created_at timestamptz, last_member_activity_at timestamptz, waiting_hours integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_imam() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select q.id,
      case when q.is_sensitive and not p_show_sensitive_excerpts then '(sensitive — open to read)' else q.subject end,
      case when q.is_sensitive and not p_show_sensitive_excerpts then '' else left(q.body, 160) end,
      q.category, q.language, q.status, q.is_sensitive,
      case when q.show_name_to_imam then coalesce(nullif(p.display_name, ''), 'Member') else 'Member (name private)' end,
      q.assigned_imam_id = auth.uid(),
      q.created_at, q.last_member_activity_at,
      (extract(epoch from (now() - q.last_member_activity_at)) / 3600)::int
    from public.questions q
    left join public.profiles p on p.id = q.asker_id
    where private.imam_can_access(q)
      and (p_status is null or q.status = p_status)
      and (p_category is null or q.category = p_category)
      and (p_language is null or q.language = p_language)
    order by case when q.status in ('submitted', 'acknowledged') then 0 else 1 end, q.last_member_activity_at
    limit 200;
end;
$$;

create or replace function public.imam_question_asker_label(p_question_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare q public.questions; nm text;
begin
  q := private.load_question_for_imam(p_question_id);
  if not q.show_name_to_imam then
    return 'Member (name private)';
  end if;
  select display_name into nm from public.profiles where id = q.asker_id;
  return coalesce(nullif(nm, ''), 'Member');
end;
$$;

create or replace function public.imam_claim(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare q public.questions;
begin
  q := private.load_question_for_imam(p_question_id);
  if q.assigned_imam_id is not null and q.assigned_imam_id <> auth.uid() then
    raise exception 'assigned_to_another_imam';
  end if;
  update public.questions set assigned_imam_id = auth.uid() where id = q.id;
  perform private.audit('question.claim', 'questions', q.id::text, '{}'::jsonb);
end;
$$;

create or replace function public.imam_acknowledge(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare q public.questions;
begin
  q := private.load_question_for_imam(p_question_id);
  if q.status <> 'submitted' then
    raise exception 'invalid_transition';
  end if;
  update public.questions set assigned_imam_id = coalesce(assigned_imam_id, auth.uid()), last_staff_activity_at = now() where id = q.id;
  perform private.set_question_status(q.id, 'acknowledged', 'imam');
  perform private.audit('question.acknowledge', 'questions', q.id::text, '{}'::jsonb);
end;
$$;

create or replace function public.imam_save_draft(p_question_id uuid, p_body text, p_kind text default 'answer')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare q public.questions; mid uuid;
begin
  q := private.load_question_for_imam(p_question_id);
  if p_kind not in ('answer', 'clarification_request', 'message') then
    raise exception 'invalid_kind';
  end if;
  if q.status = 'closed' then
    raise exception 'question_closed';
  end if;
  update public.question_messages set body = btrim(p_body), kind = p_kind, edited_at = now()
   where question_id = q.id and author_id = auth.uid() and is_draft
  returning id into mid;
  if mid is null then
    insert into public.question_messages (question_id, author_id, author_kind, kind, body, is_draft)
    values (q.id, auth.uid(), 'imam', p_kind, btrim(p_body), true)
    returning id into mid;
  end if;
  return mid;
end;
$$;

create or replace function public.imam_discard_draft(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.load_question_for_imam(p_question_id);
  delete from public.question_messages where question_id = p_question_id and author_id = auth.uid() and is_draft;
end;
$$;

-- Sends the imam's draft to the asker only. Never publishes anything publicly.
create or replace function public.imam_send_draft(p_question_id uuid, p_allow_followups boolean default true)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare q public.questions; m public.question_messages;
begin
  q := private.load_question_for_imam(p_question_id);
  select * into m from public.question_messages where question_id = q.id and author_id = auth.uid() and is_draft for update;
  if m.id is null then
    raise exception 'no_draft';
  end if;
  if q.status = 'closed' then
    raise exception 'question_closed';
  end if;
  update public.question_messages set is_draft = false, published_at = now() where id = m.id;
  update public.questions set assigned_imam_id = coalesce(assigned_imam_id, auth.uid()),
    last_staff_activity_at = now(), followups_allowed = coalesce(p_allow_followups, true) where id = q.id;
  perform private.set_question_status(q.id,
    case m.kind when 'answer' then 'answered'::public.question_status
                when 'clarification_request' then 'needs_clarification'::public.question_status
                else 'acknowledged'::public.question_status end, 'imam');
  perform private.audit('question.reply', 'questions', q.id::text, jsonb_build_object('kind', m.kind, 'message_id', m.id));
end;
$$;

create or replace function public.imam_set_status(p_question_id uuid, p_status public.question_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare q public.questions;
begin
  q := private.load_question_for_imam(p_question_id);
  if p_status not in ('closed', 'acknowledged') then
    raise exception 'use_reply_workflow';
  end if;
  perform private.set_question_status(q.id, p_status, 'imam');
  update public.questions set last_staff_activity_at = now() where id = q.id;
  perform private.audit('question.status', 'questions', q.id::text, jsonb_build_object('to', p_status));
end;
$$;

create or replace function public.imam_add_note(p_question_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare q public.questions; nid uuid;
begin
  q := private.load_question_for_imam(p_question_id);
  if q.asker_id = auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.question_internal_notes (question_id, author_id, body)
  values (q.id, auth.uid(), btrim(p_body)) returning id into nid;
  perform private.audit('question.note', 'questions', q.id::text, '{}'::jsonb);
  return nid;
end;
$$;

-- Propose an anonymised FAQ entry. Requires the asker's explicit consent; text is re-written by the imam.
create or replace function public.imam_propose_faq(
  p_question_id uuid, p_question_text text, p_answer_md text, p_category text, p_language public.ui_language
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare q public.questions; pid uuid;
begin
  if p_question_id is not null then
    q := private.load_question_for_imam(p_question_id);
    if not q.faq_consent then
      raise exception 'asker_has_not_consented_to_faq';
    end if;
  elsif not private.is_imam() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.faq_proposals (source_question_id, question_text, answer_md, category, language, proposed_by)
  values (p_question_id, btrim(p_question_text), btrim(p_answer_md), coalesce(p_category, 'other'), coalesce(p_language, 'en'), auth.uid())
  returning id into pid;
  perform private.audit('faq.propose', 'faq_proposals', pid::text, '{}'::jsonb);
  return pid;
end;
$$;

-- -----------------------------------------------------------------------------
-- Moderation / admin RPCs (metadata only unless a recorded break-glass read)
-- -----------------------------------------------------------------------------
create or replace function public.review_faq_proposal(p_id uuid, p_approve boolean, p_note text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare fp public.faq_proposals; faq_id uuid;
begin
  if not private.is_moderator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into fp from public.faq_proposals where id = p_id for update;
  if fp.id is null or fp.status <> 'proposed' then
    raise exception 'not_pending';
  end if;
  update public.faq_proposals set status = case when p_approve then 'approved' else 'rejected' end,
    reviewed_by = auth.uid(), reviewed_at = now(), review_note = coalesce(p_note, '') where id = p_id;
  if p_approve then
    insert into public.public_faq (question, answer_md, category, language, status, approved_by_imam, approved_at, source_proposal_id)
    values (fp.question_text, fp.answer_md, fp.category, fp.language, 'published', fp.proposed_by, now(), fp.id)
    returning id into faq_id;
  end if;
  perform private.audit(case when p_approve then 'faq.approve' else 'faq.reject' end, 'faq_proposals', p_id::text, '{}'::jsonb);
  return faq_id;
end;
$$;

create or replace function public.admin_question_overview()
returns table (status public.question_status, category public.question_category, total integer,
               sensitive integer, unassigned integer, oldest_waiting_hours integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (private.is_admin() or private.is_moderator()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select q.status, q.category, count(*)::int,
      count(*) filter (where q.is_sensitive)::int,
      count(*) filter (where q.assigned_imam_id is null)::int,
      max(extract(epoch from (now() - q.last_member_activity_at)) / 3600)::int
    from public.questions q
    group by q.status, q.category
    order by q.status, q.category;
end;
$$;

-- Metadata list for assignment — no subject, no body, no asker identity.
create or replace function public.admin_question_queue(p_limit integer default 50)
returns table (id uuid, category public.question_category, status public.question_status, language public.ui_language,
               is_sensitive boolean, assigned_imam_id uuid, assigned_imam_name text, created_at timestamptz, waiting_hours integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (private.is_admin() or private.is_moderator()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select q.id, q.category, q.status, q.language, q.is_sensitive, q.assigned_imam_id, p.display_name, q.created_at,
      (extract(epoch from (now() - q.last_member_activity_at)) / 3600)::int
    from public.questions q left join public.profiles p on p.id = q.assigned_imam_id
    where q.status <> 'closed'
    order by q.created_at
    limit least(greatest(p_limit, 1), 100);
end;
$$;

create or replace function public.admin_assign_question(p_question_id uuid, p_imam_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (private.is_admin() or private.is_moderator()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_imam_id is not null and not exists (
    select 1 from public.staff_roles where user_id = p_imam_id and role = 'imam' and revoked_at is null) then
    raise exception 'not_an_imam';
  end if;
  update public.questions set assigned_imam_id = p_imam_id where id = p_question_id;
  perform private.audit('question.assign', 'questions', p_question_id::text, jsonb_build_object('imam_id', p_imam_id));
end;
$$;

-- Recorded break-glass access for safeguarding/legal review. Reason is mandatory and audited.
create or replace function public.admin_open_question(p_question_id uuid, p_reason text)
returns table (subject text, body text, status public.question_status, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 15 then
    raise exception 'reason_required: describe why access is necessary (min 15 characters)';
  end if;
  perform private.audit('question.break_glass', 'questions', p_question_id::text, jsonb_build_object('reason', left(p_reason, 300)));
  return query select q.subject, q.body, q.status, q.created_at from public.questions q where q.id = p_question_id;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.submit_question(public.question_category, text, text, public.ui_language, boolean, boolean, boolean)',
    'public.member_reply(uuid, text)', 'public.member_edit_message(uuid, text)',
    'public.member_edit_question(uuid, text, text)', 'public.member_close_question(uuid)',
    'public.member_mark_read(uuid)', 'public.my_questions()',
    'public.imam_inbox(public.question_status, public.question_category, public.ui_language, boolean)',
    'public.imam_question_asker_label(uuid)', 'public.imam_claim(uuid)', 'public.imam_acknowledge(uuid)',
    'public.imam_save_draft(uuid, text, text)', 'public.imam_discard_draft(uuid)', 'public.imam_send_draft(uuid, boolean)',
    'public.imam_set_status(uuid, public.question_status)', 'public.imam_add_note(uuid, text)',
    'public.imam_propose_faq(uuid, text, text, text, public.ui_language)',
    'public.review_faq_proposal(uuid, boolean, text)', 'public.admin_question_overview()',
    'public.admin_question_queue(integer)', 'public.admin_assign_question(uuid, uuid)',
    'public.admin_open_question(uuid, text)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- Imam-editable availability note shown on /ask (no promise of response times is implied).
create or replace function public.imam_set_hours_note(p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_imam() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.site_settings set imam_hours_note = left(btrim(coalesce(p_note, '')), 300) where id;
end;
$$;
revoke execute on function public.imam_set_hours_note(text) from public, anon;
grant execute on function public.imam_set_hours_note(text) to authenticated;
