// Map database exceptions to calm, non-leaky user messages. Raw errors are never shown.
const KNOWN: Record<string, string> = {
  rate_limited: "You've reached the limit for now. Please wait a little and try again.",
  sign_in_required: "Please sign in first.",
  email_not_verified: "Please verify your email address before sending a question.",
  forbidden: "You don't have permission to do that.",
  question_closed: "This conversation is closed.",
  followups_not_enabled: "Follow-up messages are not enabled on this answered question. You're welcome to ask a new question.",
  already_answered: "This can no longer be edited because the imam has already replied.",
  event_full: "This gathering is full.",
  rsvp_not_enabled: "RSVP isn't open for this gathering.",
  event_started: "This gathering has already started.",
  event_not_available: "This gathering isn't available.",
  draft_exists: "A draft schedule already exists — continue editing it.",
  not_a_draft: "Only a draft schedule can be published.",
  publication_locked: "Published schedules can't be edited. Create a new draft instead.",
  verification_required: "Please confirm the times were checked with the imam or masjid leadership.",
  incomplete_schedule: "Every daily prayer needs an iqamah rule before publishing.",
  cannot_change_own_roles: "For safety, you can't change your own roles.",
  cannot_revoke_own_admin: "For safety, you can't remove your own administrator role.",
  cannot_change_own_status: "You can't disable your own account.",
  account_not_active: "That account isn't active.",
  not_an_imam: "That person doesn't have the imam role.",
  asker_has_not_consented_to_faq: "The asker did not consent to an anonymised FAQ version of this question.",
  reason_required: "Please describe why access is necessary (at least 15 characters).",
  no_draft: "There is no draft to send.",
  invalid_transition: "That step isn't available for this question's current status.",
  assigned_to_another_imam: "This question is assigned to another imam.",
  not_pending: "This item has already been reviewed.",
};

export function friendlyDbError(err: { message?: string; code?: string } | null | undefined, fallback = "Something went wrong. Please try again."): string {
  if (!err?.message) return fallback;
  for (const key of Object.keys(KNOWN)) if (err.message.startsWith(key) || err.message.includes(key)) {
    if (key === "incomplete_schedule") return `${KNOWN[key]} (${err.message.split("for ").pop()})`;
    return KNOWN[key];
  }
  if (err.code === "42501") return KNOWN.forbidden;
  if (err.code === "23505") return "That already exists (duplicate value).";
  if (err.code === "23514") return "One of the values isn't allowed. Please check the form.";
  return fallback;
}
