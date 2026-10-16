-- Rollback for 20261016000004_questions.sql. DESTROYS ALL PRIVATE QUESTIONS — export first.
drop function if exists public.imam_set_hours_note(text), public.admin_open_question(uuid, text), public.admin_assign_question(uuid, uuid),
  public.admin_question_queue(integer), public.admin_question_overview(), public.review_faq_proposal(uuid, boolean, text),
  public.imam_propose_faq(uuid, text, text, text, public.ui_language), public.imam_add_note(uuid, text),
  public.imam_set_status(uuid, public.question_status), public.imam_send_draft(uuid, boolean), public.imam_discard_draft(uuid),
  public.imam_save_draft(uuid, text, text), public.imam_acknowledge(uuid), public.imam_claim(uuid), public.imam_question_asker_label(uuid),
  public.imam_inbox(public.question_status, public.question_category, public.ui_language, boolean), public.my_questions(),
  public.member_mark_read(uuid), public.member_close_question(uuid), public.member_edit_question(uuid, text, text),
  public.member_edit_message(uuid, text), public.member_reply(uuid, text),
  public.submit_question(public.question_category, text, text, public.ui_language, boolean, boolean, boolean);
drop table if exists public.faq_proposals, public.question_status_history, public.question_internal_notes, public.question_messages, public.questions cascade;
drop function if exists private.set_question_status(uuid, public.question_status, text), private.load_question_for_imam(uuid),
  private.can_read_question(uuid), private.imam_can_access(public.questions);
drop type if exists public.question_category, public.question_status;
