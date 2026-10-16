"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { assertMember } from "@/lib/auth";
import { friendlyDbError } from "@/lib/db-errors";
import { questionSchema, replySchema, firstError, volunteerInquirySchema } from "@/lib/validation";
import type { FormState } from "@/app/actions/auth";

export async function submitQuestion(_prev: FormState, formData: FormData): Promise<FormState> {
  let user;
  try {
    user = await assertMember();
  } catch {
    return { error: "Please sign in first." };
  }
  if (!user.emailConfirmed) return { error: "Please verify your email address before sending a question." };
  const parsed = questionSchema.safeParse({
    ...Object.fromEntries(formData),
    acknowledge: formData.get("acknowledge") === "on",
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const q = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_question", {
    p_category: q.category,
    p_subject: q.subject,
    p_body: q.body,
    p_language: q.language,
    p_is_sensitive: q.isSensitive,
    p_show_name: q.showName,
    p_faq_consent: q.faqConsent,
  });
  if (error || !data) return { error: friendlyDbError(error) };
  revalidatePath("/community");
  redirect(`/questions/${data}?sent=1`);
}

export async function replyToQuestion(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = replySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("member_reply", { p_question_id: parsed.data.questionId, p_body: parsed.data.body });
  if (error) return { error: friendlyDbError(error) };
  revalidatePath(`/questions/${parsed.data.questionId}`);
  return { ok: true, message: "Sent. Only you and authorised imam staff can see this conversation." };
}

export async function editMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ messageId: z.uuid(), questionId: z.uuid(), body: z.string().trim().min(1).max(8000) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("member_edit_message", { p_message_id: parsed.data.messageId, p_body: parsed.data.body });
  if (error) return { error: friendlyDbError(error) };
  revalidatePath(`/questions/${parsed.data.questionId}`);
  return { ok: true, message: "Updated." };
}

export async function editQuestion(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ questionId: z.uuid(), subject: z.string().trim().min(3).max(140), body: z.string().trim().min(10).max(5000) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("member_edit_question", {
    p_question_id: parsed.data.questionId,
    p_subject: parsed.data.subject,
    p_body: parsed.data.body,
  });
  if (error) return { error: friendlyDbError(error) };
  revalidatePath(`/questions/${parsed.data.questionId}`);
  return { ok: true, message: "Your question was updated." };
}

export async function closeQuestion(formData: FormData) {
  const id = z.uuid().parse(formData.get("questionId"));
  const supabase = await createClient();
  await supabase.rpc("member_close_question", { p_question_id: id });
  revalidatePath(`/questions/${id}`);
  revalidatePath("/community");
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await assertMember().catch(() => null);
  if (!user) return { error: "Please sign in first." };
  const parsed = z
    .object({
      displayName: z.string().trim().max(60).default(""),
      language: z.enum(["en", "ar"]),
      emailQuestionUpdates: z.preprocess((v) => v === "on", z.boolean()),
      emailAnnouncements: z.preprocess((v) => v === "on", z.boolean()),
      emailEventReminders: z.preprocess((v) => v === "on", z.boolean()),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const [a, b] = await Promise.all([
    supabase.from("profiles").update({ display_name: parsed.data.displayName.replace(/[<>]/g, ""), preferred_language: parsed.data.language }).eq("id", user.id),
    supabase
      .from("notification_preferences")
      .update({
        email_question_updates: parsed.data.emailQuestionUpdates,
        email_announcements: parsed.data.emailAnnouncements,
        email_event_reminders: parsed.data.emailEventReminders,
      })
      .eq("user_id", user.id),
  ]);
  if (a.error || b.error) return { error: friendlyDbError(a.error ?? b.error) };
  revalidatePath("/community");
  return { ok: true, message: "Saved." };
}

export async function requestDataAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await assertMember().catch(() => null);
  if (!user) return { error: "Please sign in first." };
  const kind = formData.get("kind") === "deletion" ? "deletion" : "export";
  if (kind === "deletion" && formData.get("confirm") !== "DELETE") return { error: 'Type DELETE to confirm the deletion request.' };
  const supabase = await createClient();
  const { error } = await supabase.from("data_requests").insert({ user_id: user.id, kind });
  if (error) return { error: error.code === "23505" ? "You already have a pending request of this kind." : friendlyDbError(error) };
  revalidatePath("/community");
  return {
    ok: true,
    message:
      kind === "deletion"
        ? "Your deletion request was recorded. An administrator will process it and your account and questions will be permanently removed."
        : "Export request recorded. You can also download your data instantly below.",
  };
}

export async function toggleSaved(formData: FormData) {
  const user = await assertMember();
  const parsed = z
    .object({ itemType: z.enum(["faq", "program", "announcement"]), itemId: z.uuid(), saved: z.enum(["0", "1"]), path: z.string().startsWith("/").max(200) })
    .parse(Object.fromEntries(formData));
  const supabase = await createClient();
  if (parsed.saved === "1") {
    await supabase.from("saved_items").delete().match({ user_id: user.id, item_type: parsed.itemType, item_id: parsed.itemId });
  } else {
    await supabase.from("saved_items").insert({ user_id: user.id, item_type: parsed.itemType, item_id: parsed.itemId });
  }
  revalidatePath(parsed.path);
}

export async function rsvp(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await assertMember().catch(() => null);
  if (!user) return { error: "Please sign in to RSVP." };
  const parsed = z
    .object({
      eventId: z.uuid(),
      partySize: z.coerce.number().int().min(1).max(10),
      contactConsent: z.preprocess((v) => v === "on", z.boolean()),
      reminderOptIn: z.preprocess((v) => v === "on", z.boolean()),
      path: z.string().startsWith("/").max(200),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rsvp_event", {
    p_event_id: parsed.data.eventId,
    p_party_size: parsed.data.partySize,
    p_contact_consent: parsed.data.contactConsent,
    p_reminder_opt_in: parsed.data.reminderOptIn,
  });
  if (error) return { error: friendlyDbError(error) };
  revalidatePath(parsed.data.path);
  return {
    ok: true,
    message: data === "waitlisted" ? "This gathering is full — you're on the waitlist. You'll be moved up automatically if a place opens." : "You're registered. See you there, in shā' Allāh.",
  };
}

export async function cancelRsvp(formData: FormData) {
  await assertMember();
  const id = z.uuid().parse(formData.get("eventId"));
  const path = z.string().startsWith("/").max(200).parse(formData.get("path"));
  const supabase = await createClient();
  await supabase.rpc("cancel_rsvp", { p_event_id: id });
  revalidatePath(path);
}

export async function volunteerInquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await assertMember().catch(() => null);
  if (!user) return { error: "Please sign in to express interest." };
  const parsed = volunteerInquirySchema.safeParse({ ...Object.fromEntries(formData), consent: formData.get("consent") === "on" });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("volunteer_inquiries").insert({
    user_id: user.id,
    opportunity_id: parsed.data.opportunityId || null,
    message: parsed.data.message,
    contact_preference: parsed.data.contactPreference,
    consent_contact: true,
  });
  if (error) return { error: friendlyDbError(error) };
  return { ok: true, message: "Thank you. A coordinator will reach out using your account email. Your details are visible only to masjid administrators." };
}
