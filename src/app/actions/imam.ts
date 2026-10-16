"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/lib/auth";
import { friendlyDbError } from "@/lib/db-errors";
import { firstError } from "@/lib/validation";
import type { FormState } from "@/app/actions/auth";

const qid = z.uuid();

async function guard() {
  await assertRole(["imam"]);
  return createClient();
}

function done(id: string, message: string): FormState {
  revalidatePath(`/imam/questions/${id}`);
  revalidatePath("/imam");
  return { ok: true, message };
}

export async function imamClaim(_p: FormState, fd: FormData): Promise<FormState> {
  const id = qid.parse(fd.get("questionId"));
  const supabase = await guard();
  const { error } = await supabase.rpc("imam_claim", { p_question_id: id });
  return error ? { error: friendlyDbError(error) } : done(id, "Assigned to you.");
}

export async function imamAcknowledge(_p: FormState, fd: FormData): Promise<FormState> {
  const id = qid.parse(fd.get("questionId"));
  const supabase = await guard();
  const { error } = await supabase.rpc("imam_acknowledge", { p_question_id: id });
  return error ? { error: friendlyDbError(error) } : done(id, "Acknowledged. The member can see that you have received their question.");
}

export async function imamSaveDraft(_p: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({ questionId: qid, body: z.string().trim().min(1).max(8000), kind: z.enum(["answer", "clarification_request", "message"]) })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await guard();
  const { error } = await supabase.rpc("imam_save_draft", { p_question_id: parsed.data.questionId, p_body: parsed.data.body, p_kind: parsed.data.kind });
  return error ? { error: friendlyDbError(error) } : done(parsed.data.questionId, "Draft saved. Only you can see it.");
}

export async function imamSendDraft(_p: FormState, fd: FormData): Promise<FormState> {
  const id = qid.parse(fd.get("questionId"));
  if (fd.get("confirm") !== "on") return { error: "Please confirm you have reviewed the reply before sending." };
  const supabase = await guard();
  const { error } = await supabase.rpc("imam_send_draft", { p_question_id: id, p_allow_followups: fd.get("allowFollowups") === "on" });
  return error ? { error: friendlyDbError(error) } : done(id, "Sent to the asker only.");
}

export async function imamDiscardDraft(fd: FormData) {
  const id = qid.parse(fd.get("questionId"));
  const supabase = await guard();
  await supabase.rpc("imam_discard_draft", { p_question_id: id });
  revalidatePath(`/imam/questions/${id}`);
}

export async function imamSetStatus(_p: FormState, fd: FormData): Promise<FormState> {
  const id = qid.parse(fd.get("questionId"));
  const status = z.enum(["closed", "acknowledged"]).parse(fd.get("status"));
  const supabase = await guard();
  const { error } = await supabase.rpc("imam_set_status", { p_question_id: id, p_status: status });
  return error ? { error: friendlyDbError(error) } : done(id, status === "closed" ? "Closed." : "Reopened.");
}

export async function imamAddNote(_p: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ questionId: qid, body: z.string().trim().min(1).max(4000) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await guard();
  const { error } = await supabase.rpc("imam_add_note", { p_question_id: parsed.data.questionId, p_body: parsed.data.body });
  return error ? { error: friendlyDbError(error) } : done(parsed.data.questionId, "Internal note added (staff only).");
}

export async function imamProposeFaq(_p: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({
      questionId: z.union([z.literal(""), qid]).default(""),
      questionText: z.string().trim().min(5).max(600),
      answer: z.string().trim().min(5).max(8000),
      category: z.enum(["worship", "family", "new_muslim", "community", "visiting", "other"]),
      language: z.enum(["en", "ar"]),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (fd.get("anonymised") !== "on") return { error: "Please confirm the text is rewritten and contains no identifying details." };
  const supabase = await guard();
  const { error } = await supabase.rpc("imam_propose_faq", {
    p_question_id: (parsed.data.questionId || null) as string,
    p_question_text: parsed.data.questionText,
    p_answer_md: parsed.data.answer,
    p_category: parsed.data.category,
    p_language: parsed.data.language,
  });
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/imam/faq");
  return { ok: true, message: "Proposed for editorial review. Nothing is public until a moderator approves it." };
}

export async function imamSetHours(_p: FormState, fd: FormData): Promise<FormState> {
  const note = z.string().trim().max(300).safeParse(fd.get("note") ?? "");
  if (!note.success) return { error: "Keep it under 300 characters." };
  const supabase = await guard();
  const { error } = await supabase.rpc("imam_set_hours_note", { p_note: note.data });
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/imam");
  revalidatePath("/ask");
  return { ok: true, message: "Availability note updated on the Ask page." };
}
